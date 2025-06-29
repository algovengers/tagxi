import type { PlasmoMessaging } from "@plasmohq/messaging"

import { authClient } from "~lib/auth/auth-client"

// Session-based cache - cleared when page reloads
let sessionCache: {
  auth?: {
    data: any
    timestamp: number
  }
} = {}

const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

// Track ongoing requests to prevent duplicate calls
let ongoingAuthRequest: Promise<any> | null = null

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    // Check if we have valid session cached data
    if (sessionCache.auth && (Date.now() - sessionCache.auth.timestamp) < CACHE_DURATION) {
      console.log("📦 get-auth: Returning session cached session")
      res.send({
        redirect: sessionCache.auth.data,
        source: "session-cache"
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
      
      // Cache the response in session cache (both success and failure)
      sessionCache.auth = {
        data: session,
        timestamp: Date.now()
      }
      
      console.log("✅ get-auth: Session check cached in session")
      
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
    
    // If we have session cached data, return it even if stale
    if (sessionCache.auth) {
      console.log("🔄 get-auth: Auth check failed, returning stale session cache")
      res.send({
        redirect: sessionCache.auth.data,
        source: "stale-session-cache"
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