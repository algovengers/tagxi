import TagxiHeroImage from "data-base64:assets/tagxi-hero.png"
import React, { useEffect } from "react"

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
  </div>
)

const AuthView = () => {
  useEffect(() => {
    // Auto-redirect to main website for authentication
    const redirectToAuth = async () => {
      try {
        chrome.tabs.create({ url: process.env.PLASMO_PUBLIC_BACKEND_URL })
      } catch (error) {
        console.error("Failed to redirect for authentication:", error)
      }
    }

    redirectToAuth()
  }, [])

  return (
    <div className="w-[22rem] h-[28rem] bg-gradient-to-tr from-[#f9fbfc] to-[#f9fbfc] flex flex-col justify-center items-center gap-6 font-sans">
      <img
        src={TagxiHeroImage}
        alt="tagxi-hero-image"
        className="w-[5.5rem] aspect-9/11"
      />
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner />
        <p className="text-gray-600 text-sm">
          Redirecting for authentication...
        </p>
      </div>
    </div>
  )
}

export default AuthView
