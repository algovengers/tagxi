import type { PlasmoMessaging } from "@plasmohq/messaging"

import { authClient } from "~lib/auth/auth-client"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const session = await authClient.getSession()
    
    let settings = null
    
    // If user is authenticated, fetch their settings
    if (session?.data?.user) {
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
          
          // Store settings in chrome storage for offline access
          await chrome.storage.local.set({
            userSettings: settings,
            lastSettingsUpdate: Date.now()
          });
        }
      } catch (error) {
        console.warn("Failed to fetch user settings:", error);
        
        // Try to get cached settings from storage
        try {
          const stored = await chrome.storage.local.get(['userSettings']);
          if (stored.userSettings) {
            settings = stored.userSettings;
          }
        } catch (storageError) {
          console.warn("Failed to get cached settings:", storageError);
        }
      }
    }
    
    res.send({
      redirect: session,
      settings: settings
    })
  } catch (error) {
    console.error("Error in get-auth handler:", error);
    res.send({
      redirect: null,
      settings: null
    })
  }
}

export default handler