import cssText from "data-text:~style.css"
import type { PlasmoCreateShadowRoot } from "plasmo"
import React, { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

import { sendToBackground } from "@plasmohq/messaging"

import { showToast, ToastManager } from "~components/WebComponents/Toast"
import { IGNORE_LIST } from "~constants"
import { 
  scanPageForTaggableContent, 
  highlightTaggableElements, 
  clearAIHighlights,
  type ScannableElement 
} from "~lib/ai/page-scanner"

// Export a function to create a shadow host
export const getShadowHostId = () => "tagxi-ai-scanner-shadow-host"

// keeping the shadow dom open to attach elements like toast
export const createShadowRoot: PlasmoCreateShadowRoot = (shadowHost) =>
  shadowHost.attachShadow({ mode: "open" })

// Plasmo specific function for content script ui to apply tailwind
export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText.replaceAll(":root", ":host(plasmo-csui)")
  return style
}

const AIScannerContentScript = () => {
  const [isScanning, setIsScanning] = useState(false)
  const [isHighlighted, setIsHighlighted] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [tagColor, setTagColor] = useState("#ffb988")
  const [blockedWebsites, setBlockedWebsites] = useState<string[]>([])
  const [aiStatus, setAiStatus] = useState<'loading' | 'ready' | 'fallback'>('loading')

  // Check if current site is blocked
  const isCurrentSiteBlocked = () => {
    const currentUrl = window.location.href
    return blockedWebsites.some(blockedSite => {
      try {
        // Handle both full URLs and domain patterns
        if (blockedSite.startsWith('http')) {
          return currentUrl.startsWith(blockedSite)
        } else {
          // Treat as domain pattern
          return currentUrl.includes(blockedSite)
        }
      } catch (error) {
        console.warn("Error checking blocked site:", error)
        return false
      }
    })
  }

  // Load user settings - ONLY ONCE with caching
  useEffect(() => {
    let settingsLoaded = false
    
    const loadSettings = async () => {
      if (settingsLoaded) return // Prevent multiple loads
      settingsLoaded = true
      
      try {
        console.log("🔧 AI Scanner: Loading user settings (cached)...")
        const response = await sendToBackground({
          name: "get-settings"
        })
        
        if (response.success && response.data) {
          const settings = response.data
          
          if (settings.extensionSettings?.tag_color) {
            setTagColor(settings.extensionSettings.tag_color)
            console.log("✅ AI Scanner: Tag color loaded:", settings.extensionSettings.tag_color)
          }
          
          if (settings.blockedWebsites) {
            setBlockedWebsites(settings.blockedWebsites)
            console.log("✅ AI Scanner: Blocked websites loaded:", settings.blockedWebsites)
          }
          
          setSettingsLoaded(true)
          console.log(`📦 AI Scanner: Settings loaded from ${response.source || 'unknown'}`)
        } else {
          console.warn("⚠️ AI Scanner: Failed to load settings, using defaults")
          setSettingsLoaded(true)
        }
      } catch (error) {
        console.error("❌ AI Scanner: Error loading settings:", error)
        setSettingsLoaded(true)
      }
    }
    
    loadSettings()
  }, []) // Empty dependency array - load only once

  // Handle Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      // Don't proceed if settings not loaded
      if (!settingsLoaded) {
        return
      }
      
      // Check if we're on an ignored site or blocked site
      if (IGNORE_LIST.some(ignore => window.location.href.startsWith(ignore)) || 
          isCurrentSiteBlocked()) {
        return
      }

      // Ctrl+K or Cmd+K to trigger AI scan
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        
        if (isHighlighted) {
          // Clear existing highlights
          clearAIHighlights()
          setIsHighlighted(false)
          showToast("success", "AI highlights cleared")
        } else {
          // Start AI scan
          await performAIScan()
        }
      }
      
      // Escape to clear highlights
      if (event.key === 'Escape' && isHighlighted) {
        clearAIHighlights()
        setIsHighlighted(false)
        showToast("success", "AI highlights cleared")
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isHighlighted, tagColor, blockedWebsites, settingsLoaded])

  const performAIScan = async () => {
    if (isScanning) return
    
    setIsScanning(true)
    setAiStatus('loading')
    
    showToast("warning", "🤖 Analyzing page content...")
    
    try {
      // Scan the page for taggable content
      const taggableElements = await scanPageForTaggableContent()
      
      // Mark AI as ready
      setAiStatus('ready')
      
      if (taggableElements.length === 0) {
        showToast("warning", "No important content found")
        return
      }
      
      // Highlight the found elements with user's preferred color
      highlightTaggableElements(taggableElements, tagColor)
      setIsHighlighted(true)
      
      const message = taggableElements.length === 1 
        ? "🎯 Found 1 important element" 
        : `🎯 Found ${taggableElements.length} important elements`
      
      showToast("success", message)
      
    } catch (error) {
      console.error("AI scan failed:", error)
      
      if (error.message.includes('local_files_only') || 
          error.message.includes('not found locally') ||
          error.message.includes('404')) {
        showToast("warning", "AI models loading... Using smart fallback analysis")
        setAiStatus('fallback')
        
        // Try again with fallback mode
        try {
          const taggableElements = await scanPageForTaggableContent()
          
          if (taggableElements.length > 0) {
            highlightTaggableElements(taggableElements, tagColor)
            setIsHighlighted(true)
            showToast("success", `📝 Found ${taggableElements.length} elements using smart analysis`)
          } else {
            showToast("warning", "No important content found")
          }
        } catch (fallbackError) {
          console.error("Fallback scan also failed:", fallbackError)
          showToast("danger", "Content analysis failed. Please try again.")
        }
      } else {
        showToast("danger", "Analysis failed. Please try again.")
      }
    } finally {
      setIsScanning(false)
    }
  }

  // Don't render anything if site is blocked or settings not loaded
  if (isCurrentSiteBlocked() || !settingsLoaded) {
    return null
  }

  // Show loading indicator when scanning
  if (isScanning) {
    const statusMessages = {
      loading: "Analyzing content...",
      ready: "AI analyzing page...",
      fallback: "Smart analysis in progress..."
    }
    
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[99999] bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-gray-700">
            {statusMessages[aiStatus]}
          </span>
        </div>
      </div>
    )
  }

  return null
}

// Initialize toast manager in shadow DOM
const initializeToastManager = () => {
  const shadowRoot = document.getElementById(getShadowHostId())?.shadowRoot
  if (shadowRoot) {
    const toastContainer = document.createElement("div")
    shadowRoot.appendChild(toastContainer)
    const root = createRoot(toastContainer)
    root.render(<ToastManager />)
  }
}

// Auto-initialize when the script loads
if (typeof window !== "undefined") {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeToastManager)
  } else {
    initializeToastManager()
  }
}

export default AIScannerContentScript