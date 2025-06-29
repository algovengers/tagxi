import type { PlasmoMessaging } from "@plasmohq/messaging"

// Session-based cache - cleared when page reloads
let sessionCache: {
  friends?: {
    data: any[]
    timestamp: number
  }
} = {}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Track ongoing requests to prevent duplicate calls
let ongoingRequest: Promise<any> | null = null

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const { query = "" } = req.body || {}
    
    // Create cache key based on query
    const cacheKey = `friends_${query.toLowerCase()}`
    
    // Check session cache first
    if (sessionCache.friends && (Date.now() - sessionCache.friends.timestamp) < CACHE_DURATION) {
      console.log("📦 get-friends: Returning session cached friends")
      
      // Filter cached friends based on query
      let filteredFriends = sessionCache.friends.data
      if (query.trim()) {
        const searchQuery = query.toLowerCase().replace(/^@/, "")
        filteredFriends = sessionCache.friends.data.filter(friend => 
          friend.username.toLowerCase().includes(searchQuery) ||
          (friend.name && friend.name.toLowerCase().includes(searchQuery))
        )
      }
      
      res.send({
        success: true,
        data: filteredFriends,
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
        
        // Apply query filter to the result
        if (query.trim() && result.success) {
          const searchQuery = query.toLowerCase().replace(/^@/, "")
          result.data = result.data.filter((friend: any) => 
            friend.username.toLowerCase().includes(searchQuery) ||
            (friend.name && friend.name.toLowerCase().includes(searchQuery))
          )
        }
        
        res.send(result)
        return
      } catch (error) {
        ongoingRequest = null
      }
    }

    console.log("📡 get-friends: Fetching fresh friends from API...")
    
    const API_BASE_URL = process.env.PLASMO_PUBLIC_BACKEND_URL;
    
    // Create the request promise and store it
    ongoingRequest = (async () => {
      // Use the search API with empty query to get all friends
      const response = await fetch(`${API_BASE_URL}/api/trpc/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          query: "", // Get all friends first
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

      const allFriends = data.result.data.map((friend: any) => ({
        username: friend.username,
        name: friend.name,
        image: friend.image,
        areFriends: friend.areFriends
      }));
      
      // Cache all friends in session cache
      sessionCache.friends = {
        data: allFriends,
        timestamp: Date.now()
      }
      
      console.log("✅ get-friends: Fresh friends cached in session:", allFriends.length)

      // Filter based on query
      let filteredFriends = allFriends
      if (query.trim()) {
        const searchQuery = query.toLowerCase().replace(/^@/, "")
        filteredFriends = allFriends.filter((friend: any) => 
          friend.username.toLowerCase().includes(searchQuery) ||
          (friend.name && friend.name.toLowerCase().includes(searchQuery))
        )
      }

      return {
        success: true,
        data: filteredFriends,
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
      
      let filteredFriends = sessionCache.friends.data
      if (req.body?.query?.trim()) {
        const searchQuery = req.body.query.toLowerCase().replace(/^@/, "")
        filteredFriends = sessionCache.friends.data.filter((friend: any) => 
          friend.username.toLowerCase().includes(searchQuery) ||
          (friend.name && friend.name.toLowerCase().includes(searchQuery))
        )
      }
      
      res.send({
        success: true,
        data: filteredFriends,
        message: "Friends retrieved from stale session cache (API unavailable)",
        source: "stale-session-cache"
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