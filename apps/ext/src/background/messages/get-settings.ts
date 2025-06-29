import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    // First try to get from local storage (faster)
    const stored = await chrome.storage.local.get(['userSettings', 'lastSettingsUpdate']);
    
    // Check if we have recent cached settings (less than 5 minutes old)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const hasRecentCache = stored.lastSettingsUpdate && stored.lastSettingsUpdate > fiveMinutesAgo;
    
    if (hasRecentCache && stored.userSettings) {
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
    
    const response = await fetch(`${API_BASE_URL}/api/settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
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
    console.error("Error fetching settings:", error);
    
    // Try to return any cached settings as fallback
    try {
      const stored = await chrome.storage.local.get(['userSettings']);
      if (stored.userSettings) {
        res.send({
          success: true,
          data: stored.userSettings,
          message: "Settings retrieved from fallback cache",
          source: "fallback_cache"
        });
        return;
      }
    } catch (storageError) {
      console.error("Failed to get fallback settings:", storageError);
    }
    
    res.send({
      success: false,
      error: error.message,
      message: "Failed to fetch settings"
    });
  }
}

export default handler