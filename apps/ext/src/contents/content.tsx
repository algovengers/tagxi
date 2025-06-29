import cssText from "data-text:~style.css"
import type { PlasmoCreateShadowRoot } from "plasmo"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { createRoot } from "react-dom/client"

import { sendToBackground } from "@plasmohq/messaging"

import TagButton from "~components/WebComponents/TagButton"
import TagInput from "~components/WebComponents/TagInput"
import { showToast, ToastManager } from "~components/WebComponents/Toast"
import { IGNORE_LIST } from "~constants"
import { getXPathForElement, selectAndHighlightElement } from "~lib/xpath/xpath"

/**
 * TODO:
 * 1. Add mutation observer to the dom for js based sites
 * 4. option for choosing the highlighter and dashed lines -> with hover show the person who tagged you
 * 3. on click tag icon add the text box with dropdown to add multiple options
 * 8. force reset shortcut to clear out all the tags -> just if required
 * 9. option to ignore which sites ignore -> need backend
 * 10. web push protocol for notifications
 * 11. Handling text box selections -> example would be github
 * 12. find a way to redirect reliably for signup automaitcally if not auth that is getting done in the popup
 */

// // Export a function to create a shadow host
export const getShadowHostId = () => "tagxi-shadow-host"

// keeping the shadow dom open to attach elements like toast
export const createShadowRoot: PlasmoCreateShadowRoot = (shadowHost) =>
  shadowHost.attachShadow({ mode: "open" })

// /**
//  * Plasmo specific function for content script ui to apply tailwind
//  */
export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText.replaceAll(":root", ":host(plasmo-csui)")
  return style
}

const MAX_SCROLL_DELTA = 150

const TagxiContentScript = () => {
  const [showIcon, setShowIcon] = useState(false)
  const [iconPosition, setIconPosition] = useState({ top: 0, left: 0 })
  const [showInput, setShowInput] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [tagColor, setTagColor] = useState("#ffb988") // Default color
  const [blockedWebsites, setBlockedWebsites] = useState<string[]>([])
  const [lastScroll, setLastScroll] = useState({
    y: window.scrollY,
    x: window.scrollX
  })
  const selectionRef = useRef<Record<string, string | number> | null>(null)

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

  // Load user settings
  const loadSettings = async () => {
    try {
      const response = await sendToBackground({
        name: "get-settings"
      })
      
      if (response.success && response.data) {
        const settings = response.data
        
        // Update tag color
        if (settings.extensionSettings?.tag_color) {
          setTagColor(settings.extensionSettings.tag_color)
        }
        
        // Update blocked websites
        if (settings.blockedWebsites) {
          setBlockedWebsites(settings.blockedWebsites)
        }
        
        console.log("Settings loaded:", {
          tagColor: settings.extensionSettings?.tag_color,
          blockedWebsites: settings.blockedWebsites,
          source: response.source
        })
      }
    } catch (error) {
      console.warn("Failed to load settings:", error)
    }
  }

  const resetSelection = () => {
    setShowIcon(false)
    setShowInput(false)
    selectionRef.current = {}
  }

  const handleMouseUp = useCallback((e: MouseEvent) => {
    // Check if site is blocked
    if (isCurrentSiteBlocked()) {
      return
    }
    
    if ((e.target as HTMLElement).id === "tagxi-icon") {
      return
    }
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setShowIcon(false)
      setShowInput(false)
      return
    }
    setLastScroll({
      y: window.scrollY,
      x: window.scrollX
    })

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    // Information to store
    // store containers xpath -> if text is selected in more than two html elements
    // use offset to calculate the start(container) and end(end container)
    const selectedText = range.toString()
    const startContainerXPath = getXPathForElement(range.startContainer)
    const endContainerXPath = getXPathForElement(range.endContainer)
    const startOffset = range.startOffset
    const endOffset = range.endOffset
    selectionRef.current = {
      startContainerXPath,
      endContainerXPath,
      startOffset,
      endOffset
    }

    setIconPosition({ top: rect.top - 30, left: rect.left })
    setLastScroll({ y: window.scrollY, x: window.scrollX })
    setShowIcon(true)
    setShowInput(false)
  }, [blockedWebsites])

  const handleIconClick = useCallback(() => {
    setShowInput(true)
    setShowIcon(false)
  }, [])

  const handleInputKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Check if site is blocked
      if (isCurrentSiteBlocked()) {
        showToast("warning", "TagXi is disabled on this website")
        return
      }
      
      if (
        IGNORE_LIST.filter((IGNORE) => window.location.href.startsWith(IGNORE))
          .length
      )
        return
      if (e.key === "Enter") {
        const value = e.currentTarget.value
        if (!value || isLoading) return

        setIsLoading(true)
        // Information to store
        // store containers xpath -> if text is selected in more than two html elements
        // use offset to calculate the start(container) and end(end container)
        try {
          const data = {
            url: window.location.href,
            tag: value,
            timestamp: Date.now(),
            ...selectionRef.current
          }

          // Use Plasmo messaging to send to background script
          const response = await sendToBackground({
            name: "save-tag",
            body: data
          })
          if (response.success) {
            const {
              startContainerXPath,
              endContainerXPath,
              startOffset,
              endOffset
            } = selectionRef.current
            if (startContainerXPath === endContainerXPath) {
              selectAndHighlightElement(
                startContainerXPath as string,
                startOffset as number,
                endOffset as number,
                tagColor // Use user's preferred color
              )
            } else {
              selectAndHighlightElement(
                startContainerXPath as string,
                startOffset as number,
                undefined,
                tagColor
              )
              selectAndHighlightElement(
                endContainerXPath as string,
                0,
                endOffset as number,
                tagColor
              )
            }
            showToast("success", "Tag saved")
            resetSelection()
          } else if (!response.success && response.authenticationRequired) {
            showToast("warning", "Please sign in to load and save tags")
          } else {
            showToast("danger", "Failed to save tags")
          }
        } finally {
          setIsLoading(false)
        }
      }
    },
    [tagColor, blockedWebsites]
  )

  const handleKeyboardInputs = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      resetSelection()
    } else if (e.key === "Enter") {
      console.log({ showIcon })
      setShowIcon((icon) => {
        if (icon) setShowInput(true)
        return false
      })
    }
  }

  const loadExistingTags = async () => {
    // Check if site is blocked
    if (isCurrentSiteBlocked()) {
      console.log("TagXi is disabled on this website")
      return
    }
    
    if (
      IGNORE_LIST.filter((IGNORE) => window.location.href.startsWith(IGNORE))
        .length
    )
      return
    try {
      const response = await sendToBackground({
        name: "get-tag",
        body: { url: window.location.href }
      })
      if (response.success && response.data) {
        let successCount = 0
        let errorCount = 0
        
        response.data.forEach(({ metadata }) => {
          const {
            start_tag_offset,
            end_tag_xpath,
            start_tag_xpath,
            end_tag_offset
          } = metadata
          try {
            if (start_tag_xpath === end_tag_xpath) {
              selectAndHighlightElement(
                start_tag_xpath,
                start_tag_offset,
                end_tag_offset,
                tagColor // Use user's preferred color
              )
            } else {
              selectAndHighlightElement(start_tag_xpath, start_tag_offset, undefined, tagColor)
              selectAndHighlightElement(end_tag_xpath, 0, end_tag_offset, tagColor)
            }
            successCount++
          } catch (error) {
            console.warn("Failed to highlight tag:", error, { metadata })
            errorCount++
          }
        })
        
        if (successCount > 0) {
          console.log(`Successfully loaded ${successCount} tags`)
        }
        if (errorCount > 0) {
          console.warn(`Failed to load ${errorCount} tags (page content may have changed)`)
        }
      } else if (!response.success && response.authenticationRequired) {
        showToast("warning", "Please sign in to load and save tags")
      } else {
        showToast("danger", "Error loading existing tags")
      }
    } catch (error) {
      console.error("Error loading existing tags:", error)
      showToast("danger", "Error loading existing tags")
    }
  }

  const removeTagAndInputOnScroll = () => {
    if (
      Math.abs(lastScroll.y - window.scrollY) > MAX_SCROLL_DELTA ||
      Math.abs(lastScroll.x - window.scrollX) > MAX_SCROLL_DELTA
    ) {
      resetSelection()
    }
  }

  useEffect(() => {
    const shadowRoot = document.getElementById(getShadowHostId())?.shadowRoot
    if (shadowRoot) {
      const toastContainer = document.createElement("div")
      shadowRoot.appendChild(toastContainer)
      const root = createRoot(toastContainer)
      root.render(<ToastManager />)
    }
  }, [])

  useEffect(() => {
    // Load settings first
    loadSettings().then(() => {
      // Only load existing tags after settings are loaded
      loadExistingTags()
    })
    
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("scroll", removeTagAndInputOnScroll)
    document.addEventListener("keydown", handleKeyboardInputs)
    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
      document.addEventListener("scroll", removeTagAndInputOnScroll)
      document.addEventListener("keydown", handleKeyboardInputs)
    }
  }, [])

  // Re-run when settings change
  useEffect(() => {
    if (tagColor !== "#ffb988") { // Only reload if color has changed from default
      loadExistingTags()
    }
  }, [tagColor])

  // Don't render anything if site is blocked
  if (isCurrentSiteBlocked()) {
    return null
  }

  return (
    <>
      {showIcon && (
        <TagButton position={iconPosition} onClick={handleIconClick} />
      )}
      {showInput && (
        <TagInput
          position={iconPosition}
          onKeyDown={handleInputKeyDown}
          disabled={isLoading}
        />
      )}
    </>
  )
}

export default TagxiContentScript