import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    console.log("📡 get-settings: Fetching user settings...")
    
    // First try to get from local storage (faster)
    const stored = await chrome.storage.local.get(['userSettings', 'lastSettingsUpdate']);
    
    // Check if we have recent cached settings (less than 5 minutes old)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const hasRecentCache = stored.lastSettingsUpdate && stored.lastSettingsUpdate > fiveMinutesAgo;
    
    if (hasRecentCache && stored.userSettings) {
      console.log("✅ get-settings: Returning cached settings")
      res.send({
        success: true,
        data: stored.userSettings,
        message: "Settings retrieved from cache",
        source: "cache"
      });
      return;
    }
    
    // If no recent cache, fetch from API
    const API_BASE_URL = process.env.PLASMO_PUBLIC_BACKEND_URL;
    
    console.log("🌐 get-settings: Fetching from API...")
    const response = await fetch(`${API_BASE_URL}/api/settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn("⚠️ get-settings: API request failed, trying cached settings")
      // If API fails, try to return cached settings anyway
      if (stored.userSettings) {
        res.send({
          success: true,
          data: stored.userSettings,
          message: "Settings retrieved from stale cache (API unavailable)",
          source: "stale_cache"
        });
        return;
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const settings = await response.json();
    console.log("✅ get-settings: Settings fetched from API:", {
      tagColor: settings.extensionSettings?.tag_color,
      blockedWebsites: settings.blockedWebsites?.length || 0
    })
    
    // Update cache
    await chrome.storage.local.set({
      userSettings: settings,
      lastSettingsUpdate: Date.now()
    });

    res.send({
      success: true,
      data: settings,
      message: "Settings retrieved successfully",
      source: "api"
    });
  } catch (error) {
    console.error("❌ get-settings: Error fetching settings:", error);
    
    // Try to return any cached settings as fallback
    try {
      const stored = await chrome.storage.local.get(['userSettings']);
      if (stored.userSettings) {
        console.log("🔄 get-settings: Returning fallback cached settings")
        res.send({
          success: true,
          data: stored.userSettings,
          message: "Settings retrieved from fallback cache",
          source: "fallback_cache"
        });
        return;
      }
    } catch (storageError) {
      console.error("❌ get-settings: Failed to get fallback settings:", storageError);
    }
    
    console.log("❌ get-settings: No settings available, returning error")
    res.send({
      success: false,
      error: error.message,
      message: "Failed to fetch settings"
    });
  }
}

export default handler