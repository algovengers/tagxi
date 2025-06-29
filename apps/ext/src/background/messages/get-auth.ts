import type { PlasmoMessaging } from "@plasmohq/messaging"

import { authClient } from "~lib/auth/auth-client"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    console.log("🔐 get-auth: Checking authentication...")
    const session = await authClient.getSession()
    
    let settings = null
    
    // If user is authenticated, fetch their settings
    if (session?.data?.user) {
      console.log("👤 get-auth: User authenticated, fetching settings...")
      try {
        const API_BASE_URL = process.env.PLASMO_PUBLIC_BACKEND_URL;
        
        const settingsResponse = await fetch(`${API_BASE_URL}/api/settings`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (settingsResponse.ok) {
          settings = await settingsResponse.json();
          console.log("✅ get-auth: Settings fetched and cached:", {
            tagColor: settings.extensionSettings?.tag_color,
            blockedWebsites: settings.blockedWebsites?.length || 0
          })
          
          // Store settings in chrome storage for offline access
          await chrome.storage.local.set({
            userSettings: settings,
            lastSettingsUpdate: Date.now()
          });
        }
      } catch (error) {
        console.warn("⚠️ get-auth: Failed to fetch user settings:", error);
        
        // Try to get cached settings from storage
        try {
          const stored = await chrome.storage.local.get(['userSettings']);
          if (stored.userSettings) {
            settings = stored.userSettings;
            console.log("🔄 get-auth: Using cached settings")
          }
        } catch (storageError) {
          console.warn("❌ get-auth: Failed to get cached settings:", storageError);
        }
      }
    } else {
      console.log("🚫 get-auth: User not authenticated")
    }
    
    res.send({
      redirect: session,
      settings: settings
    })
  } catch (error) {
    console.error("❌ get-auth: Error in handler:", error);
    res.send({
      redirect: null,
      settings: null
    })
  }
}

export default handler