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
  const [tagColor, setTagColor] = useState("#ffb988")

  // Load user settings for tag color
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await sendToBackground({
          name: "get-settings"
        })
        
        if (response.success && response.data?.extensionSettings?.tag_color) {
          setTagColor(response.data.extensionSettings.tag_color)
        }
      } catch (error) {
        console.warn("Failed to load settings, using default color:", error)
      }
    }
    
    loadSettings()
  }, [])

  // Handle Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      // Check if we're on an ignored site
      if (IGNORE_LIST.some(ignore => window.location.href.startsWith(ignore))) {
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
  }, [isHighlighted, tagColor])

  const performAIScan = async () => {
    if (isScanning) return
    
    setIsScanning(true)
    showToast("warning", "🤖 AI is analyzing the page...")
    
    try {
      // Scan the page for taggable content
      const taggableElements = await scanPageForTaggableContent()
      
      if (taggableElements.length === 0) {
        showToast("warning", "No important content found by AI")
        return
      }
      
      // Highlight the found elements
      highlightTaggableElements(taggableElements, tagColor)
      setIsHighlighted(true)
      
      showToast(
        "success", 
        `🎯 AI found ${taggableElements.length} important ${taggableElements.length === 1 ? 'element' : 'elements'}`
      )
      
    } catch (error) {
      console.error("AI scan failed:", error)
      showToast("danger", "AI scan failed. Please try again.")
    } finally {
      setIsScanning(false)
    }
  }

  // Show loading indicator when scanning
  if (isScanning) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[99999] bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-gray-700">AI analyzing page...</span>
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