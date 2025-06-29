import type { PlasmoMessaging } from "@plasmohq/messaging"

// Session-based cache - cleared when page reloads
let sessionCache: {
  friends?: {
    data: any[]
    timestamp: number
  }
} = {}

const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

// Track ongoing requests to prevent duplicate calls
let ongoingRequest: Promise<any> | null = null

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    // Check if we have valid session cached data
    if (sessionCache.friends && (Date.now() - sessionCache.friends.timestamp) < CACHE_DURATION) {
      console.log("📦 get-friends: Returning session cached friends")
      res.send({
        success: true,
        data: sessionCache.friends.data,
        message: "Friends retrieved from session cache",
        source: "session-cache"
      });
      return
    }

    // If there's already an ongoing request, wait for it
    if (ongoingRequest) {
      console.log("⏳ get-friends: Waiting for ongoing request...")
      try {
        const result = await ongoingRequest
        res.send(result)
        return
      } catch (error) {
        // If the ongoing request failed, we'll make a new one below
        ongoingRequest = null
      }
    }

    console.log("👥 get-friends: Fetching fresh friends from API...")
    
    const API_BASE_URL = process.env.PLASMO_PUBLIC_BACKEND_URL;
    
    // Create the request promise and store it
    ongoingRequest = (async () => {
      const response = await fetch(`${API_BASE_URL}/api/friends`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const friends = await response.json();
      
      // Cache the successful response in session cache
      sessionCache.friends = {
        data: friends,
        timestamp: Date.now()
      }
      
      console.log("✅ get-friends: Fresh friends cached in session:", friends.length)

      return {
        success: true,
        data: friends,
        message: "Friends retrieved successfully",
        source: "api"
      }
    })()

    // Wait for the request and send response
    const result = await ongoingRequest
    res.send(result)

  } catch (error) {
    console.error("❌ get-friends: Error fetching friends:", error);
    
    // Clear the ongoing request on error
    ongoingRequest = null
    
    // If we have session cached data, return it even if stale
    if (sessionCache.friends) {
      console.log("🔄 get-friends: API failed, returning stale session cache")
      res.send({
        success: true,
        data: sessionCache.friends.data,
        message: "Friends retrieved from stale session cache (API unavailable)",
        source: "stale-session-cache"
      });
      return
    }
    
    res.send({
      success: false,
      error: error.message,
      message: "Failed to fetch friends",
      data: [] // Return empty array as fallback
    });
  } finally {
    // Clear the ongoing request when done
    ongoingRequest = null
  }
}

export default handler