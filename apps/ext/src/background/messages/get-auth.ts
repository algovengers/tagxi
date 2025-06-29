import type { PlasmoMessaging } from "@plasmohq/messaging"

import { authClient } from "~lib/auth/auth-client"

// Cache auth session for 2 minutes to prevent excessive requests
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes
let authCache: {
  data: any
  timestamp: number
} | null = null

// Track ongoing requests to prevent duplicate calls
let ongoingAuthRequest: Promise<any> | null = null

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    // Check if we have valid cached data
    if (authCache && (Date.now() - authCache.timestamp) < CACHE_DURATION) {
      console.log("📦 get-auth: Returning cached session")
      res.send({
        redirect: authCache.data,
        source: "cache"
      })
      return
    }

    // If there's already an ongoing request, wait for it
    if (ongoingAuthRequest) {
      console.log("⏳ get-auth: Waiting for ongoing auth request...")
      try {
        const result = await ongoingAuthRequest
        res.send(result)
        return
      } catch (error) {
        // If the ongoing request failed, we'll make a new one below
        ongoingAuthRequest = null
      }
    }

    console.log("🔐 get-auth: Checking fresh authentication...")
    
    // Create the request promise and store it
    ongoingAuthRequest = (async () => {
      const session = await authClient.getSession()
      
      // Cache the response (both success and failure)
      authCache = {
        data: session,
        timestamp: Date.now()
      }
      
      console.log("✅ get-auth: Session check cached")
      
      return {
        redirect: session,
        source: "api"
      }
    })()

    // Wait for the request and send response
    const result = await ongoingAuthRequest
    res.send(result)

  } catch (error) {
    console.error("❌ get-auth: Error in handler:", error);
    
    // Clear the ongoing request on error
    ongoingAuthRequest = null
    
    // If we have cached data, return it even if stale
    if (authCache) {
      console.log("🔄 get-auth: Auth check failed, returning stale cache")
      res.send({
        redirect: authCache.data,
        source: "stale-cache"
      })
      return
    }
    
    res.send({
      redirect: null,
      source: "error"
    })
  } finally {
    // Clear the ongoing request when done
    ongoingAuthRequest = null
  }
}

export default handler