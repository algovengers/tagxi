import type { PlasmoMessaging } from "@plasmohq/messaging"

// Session-based cache - cleared when page reloads
let sessionCache: {
  settings?: {
    data: any
    timestamp: number
  }
} = {}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Track ongoing requests to prevent duplicate calls
let ongoingRequest: Promise<any> | null = null

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    // Check if we have valid session cached data
    if (sessionCache.settings && (Date.now() - sessionCache.settings.timestamp) < CACHE_DURATION) {
      console.log("📦 get-settings: Returning session cached settings")
      res.send({
        success: true,
        data: sessionCache.settings.data,
        message: "Settings retrieved from session cache",
        source: "session-cache"
      });
      return
    }

    // If there's already an ongoing request, wait for it
    if (ongoingRequest) {
      console.log("⏳ get-settings: Waiting for ongoing request...")
      try {
        const result = await ongoingRequest
        res.send(result)
        return
      } catch (error) {
        // If the ongoing request failed, we'll make a new one below
        ongoingRequest = null
      }
    }

    console.log("📡 get-settings: Fetching fresh settings from API...")
    
    const API_BASE_URL = process.env.PLASMO_PUBLIC_BACKEND_URL;
    
    // Create the request promise and store it
    ongoingRequest = (async () => {
      const response = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const settings = await response.json();
      
      // Cache the successful response in session cache
      sessionCache.settings = {
        data: settings,
        timestamp: Date.now()
      }
      
      console.log("✅ get-settings: Fresh settings cached in session:", {
        tagColor: settings.extensionSettings?.tag_color,
        blockedWebsites: settings.blockedWebsites?.length || 0
      })

      return {
        success: true,
        data: settings,
        message: "Settings retrieved successfully",
        source: "api"
      }
    })()

    // Wait for the request and send response
    const result = await ongoingRequest
    res.send(result)

  } catch (error) {
    console.error("❌ get-settings: Error fetching settings:", error);
    
    // Clear the ongoing request on error
    ongoingRequest = null
    
    // If we have session cached data, return it even if stale
    if (sessionCache.settings) {
      console.log("🔄 get-settings: API failed, returning stale session cache")
      res.send({
        success: true,
        data: sessionCache.settings.data,
        message: "Settings retrieved from stale session cache (API unavailable)",
        source: "stale-session-cache"
      });
      return
    }
    
    res.send({
      success: false,
      error: error.message,
      message: "Failed to fetch settings"
    });
  } finally {
    // Clear the ongoing request when done
    ongoingRequest = null
  }
}

export default handler