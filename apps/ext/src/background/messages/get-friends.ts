import type { PlasmoMessaging } from "@plasmohq/messaging"

// Cache friends for 5 minutes to prevent excessive requests
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
let friendsCache: {
  data: any[]
  timestamp: number
} | null = null

// Track ongoing requests to prevent duplicate calls
let ongoingRequest: Promise<any> | null = null

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    // Check if we have valid cached data
    if (friendsCache && (Date.now() - friendsCache.timestamp) < CACHE_DURATION) {
      console.log("📦 get-friends: Returning cached friends")
      res.send({
        success: true,
        data: friendsCache.data,
        message: "Friends retrieved from cache",
        source: "cache"
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

    console.log("📡 get-friends: Fetching fresh friends from API...")
    
    const API_BASE_URL = process.env.PLASMO_PUBLIC_BACKEND_URL;
    
    // Create the request promise and store it
    ongoingRequest = (async () => {
      // Use the search API with friendsOnly flag to get friends
      const response = await fetch(`${API_BASE_URL}/api/trpc/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          query: "",
          friendsOnly: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.result?.data) {
        throw new Error('Invalid response format');
      }

      const friends = data.result.data.map((friend: any) => ({
        username: friend.username,
        name: friend.name,
        image: friend.image,
        areFriends: friend.areFriends
      }));
      
      // Cache the successful response
      friendsCache = {
        data: friends,
        timestamp: Date.now()
      }
      
      console.log("✅ get-friends: Fresh friends cached:", friends.length)

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
    
    // If we have cached data, return it even if stale
    if (friendsCache) {
      console.log("🔄 get-friends: API failed, returning stale cache")
      res.send({
        success: true,
        data: friendsCache.data,
        message: "Friends retrieved from stale cache (API unavailable)",
        source: "stale-cache"
      });
      return
    }
    
    res.send({
      success: false,
      error: error.message,
      message: "Failed to fetch friends"
    });
  } finally {
    // Clear the ongoing request when done
    ongoingRequest = null
  }
}

export default handler