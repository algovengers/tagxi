import React, { useEffect, useState } from "react"

import "~style.css"

import TagxiHeroImage from "data-base64:assets/tagxi-hero.png"

import { sendToBackground } from "@plasmohq/messaging"

import { IGNORE_LIST } from "~constants"

// import { authClient } from "~lib/auth/auth-client"

import AuthView from "./AuthView"
import Home from "./Home"

const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
  </div>
)

const InitialLoadingView = () => (
  <div className="w-[22rem] h-[28rem] bg-gradient-to-tr from-[#f9fbfc] to-[#f9fbfc] flex flex-col justify-center items-center gap-6 font-sans">
    <img
      src={TagxiHeroImage}
      alt="tagxi-hero-image"
      className="w-[5.5rem] aspect-9/11"
    />
    <div className="flex flex-col items-center gap-2">
      <LoadingSpinner />
      <p className="text-gray-600 text-sm">Loading...</p>
    </div>
  </div>
)

const Popup = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userData, setUserData] = useState({
    username: "arnab",
    userStats: { tagsMade: 2000, tagsReceived: 1450 },
    recentTags: [],
    collectibles: []
  })

  const checkAuthentication = async () => {
    console.log("🔐 Popup: Checking authentication (cached)...")
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      })

      if (
        IGNORE_LIST.filter((IGNORE) => tab.url?.startsWith(IGNORE)).length > 0
      ) {
        setIsAuthenticated(true)
        setIsLoading(false)
        return
      }

      const response = await sendToBackground({
        name: "get-auth"
      })

      console.log("✅ Popup: Authentication response:", {
        hasData: !!response?.redirect?.data,
        source: response?.source || 'unknown'
      })

      if (response?.redirect?.data) {
        setIsAuthenticated(true)
        setUserData((prev) => ({
          ...prev,
          username: response.redirect.data?.user?.username || prev.username
        }))
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error("❌ Popup: Authentication check failed:", error)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuthentication()
  }, [])

  if (isLoading) {
    return <InitialLoadingView />
  }

  // Show appropriate view based on authentication status
  return isAuthenticated ? (
    <Home
      username={userData.username}
      userStats={userData.userStats}
      recentTags={userData.recentTags}
      collectibles={userData.collectibles}
      onTagClick={(tag) => console.log("Tag clicked:", tag)}
      onNotificationClick={() => console.log("Notifications")}
    />
  ) : (
    <AuthView />
  )
}

export default Popup