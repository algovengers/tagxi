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

type Friend = {
  username: string
  name: string | null
  image: string | null
}

const TagxiContentScript = () => {
  const [showIcon, setShowIcon] = useState(false)
  const [iconPosition, setIconPosition] = useState({ top: 0, left: 0 })
  const [showInput, setShowInput] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [tagColor, setTagColor] = useState("#ffb988") // Default color
  const [blockedWebsites, setBlockedWebsites] = useState<string[]>([])
  const [currentUsername, setCurrentUsername] = useState<string>("")
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendsLoaded, setFriendsLoaded] = useState(false)
  const [lastScroll, setLastScroll] = useState({
    y: window.scrollY,
    x: window.scrollX
  })
  const selectionRef = useRef<Record<string, string | number> | null>(null)
  const settingsLoadedRef = useRef(false) // Prevent multiple loads
  const friendsLoadedRef = useRef(false) // Prevent multiple loads

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

  // Load user settings - ONLY ONCE
  const loadSettings = async () => {
    // Prevent multiple simultaneous loads
    if (settingsLoadedRef.current) {
      console.log("⚠️ Content Script: Settings already loaded, skipping...")
      return
    }
    
    settingsLoadedRef.current = true
    
    try {
      console.log("🔧 Content Script: Loading user settings (one-time)...")
      
      // Get settings and auth info
      const [settingsResponse, authResponse] = await Promise.all([
        sendToBackground({ name: "get-settings" }),
        sendToBackground({ name: "get-auth" })
      ])
      
      // Handle settings
      if (settingsResponse.success && settingsResponse.data) {
        const settings = settingsResponse.data
        
        if (settings.extensionSettings?.tag_color) {
          setTagColor(settings.extensionSettings.tag_color)
          console.log("✅ Content Script: Tag color loaded:", settings.extensionSettings.tag_color)
        }
        
        if (settings.blockedWebsites) {
          setBlockedWebsites(settings.blockedWebsites)
          console.log("✅ Content Script: Blocked websites loaded:", settings.blockedWebsites)
        }
        
        console.log(`📦 Content Script: Settings source: ${settingsResponse.source || 'unknown'}`)
      }
      
      // Handle authentication
      if (authResponse?.redirect?.data?.user?.username) {
        setCurrentUsername(authResponse.redirect.data.user.username)
        console.log("✅ Content Script: Current user loaded:", authResponse.redirect.data.user.username)
      }
      
      setSettingsLoaded(true)
      console.log("✅ Content Script: Settings and auth loaded successfully")
    } catch (error) {
      console.error("❌ Content Script: Error loading settings:", error)
      setSettingsLoaded(true) // Still mark as loaded to prevent blocking
    }
  }

  // Load user friends - ONLY ONCE
  const loadFriends = async () => {
    // Prevent multiple simultaneous loads
    if (friendsLoadedRef.current) {
      console.log("⚠️ Content Script: Friends already loaded, skipping...")
      return
    }
    
    friendsLoadedRef.current = true
    
    try {
      console.log("👥 Content Script: Loading user friends (one-time)...")
      
      const friendsResponse = await sendToBackground({ name: "get-friends" })
      
      if (friendsResponse.success && friendsResponse.data) {
        setFriends(friendsResponse.data)
        console.log("✅ Content Script: Friends loaded:", friendsResponse.data.length, "friends")
        console.log(`📦 Content Script: Friends source: ${friendsResponse.source || 'unknown'}`)
      } else {
        console.log("⚠️ Content Script: No friends found or failed to load")
        setFriends([]) // Set empty array as fallback
      }
      
      setFriendsLoaded(true)
    } catch (error) {
      console.error("❌ Content Script: Error loading friends:", error)
      setFriends([]) // Set empty array as fallback
      setFriendsLoaded(true) // Still mark as loaded to prevent blocking
    }
  }

  const resetSelection = () => {
    setShowIcon(false)
    setShowInput(false)
    selectionRef.current = {}
  }

  const handleMouseUp = useCallback((e: MouseEvent) => {
    // Don't proceed if settings not loaded or site is blocked
    if (!settingsLoaded || isCurrentSiteBlocked()) {
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
  }, [settingsLoaded, blockedWebsites])

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
            
            // FIXED: Use the correct function calls with proper parameters
            if (startContainerXPath === endContainerXPath) {
              selectAndHighlightElement(
                startContainerXPath as string,
                startOffset as number,
                endOffset as number,
                tagColor,
                currentUsername // Pass current user as tagger for hover tooltip
              )
            } else {
              selectAndHighlightElement(
                startContainerXPath as string,
                startOffset as number,
                undefined, // endOffset not needed for single container
                tagColor,
                currentUsername
              )
              selectAndHighlightElement(
                endContainerXPath as string,
                0,
                endOffset as number,
                tagColor,
                currentUsername
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
    [tagColor, blockedWebsites, currentUsername, isLoading]
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
    // Don't load tags if settings not loaded or site is blocked
    if (!settingsLoaded || isCurrentSiteBlocked()) {
      console.log("🚫 Content Script: Skipping tag loading - settings not loaded or site blocked")
      return
    }
    
    if (
      IGNORE_LIST.filter((IGNORE) => window.location.href.startsWith(IGNORE))
        .length
    )
      return
    
    console.log("🏷️ Content Script: Loading existing tags with color:", tagColor)
    
    try {
      const response = await sendToBackground({
        name: "get-tag",
        body: { url: window.location.href }
      })
      if (response.success && response.data) {
        let successCount = 0
        
        response.data.forEach(({ metadata, owner }) => {
          const {
            start_tag_offset,
            end_tag_xpath,
            start_tag_xpath,
            end_tag_offset
          } = metadata
          try {
            // FIXED: Use correct function calls for loading existing tags
            if (start_tag_xpath === end_tag_xpath) {
              selectAndHighlightElement(
                start_tag_xpath,
                start_tag_offset,
                end_tag_offset,
                tagColor,
                owner // Pass the owner as the tagger for hover tooltip
              )
            } else {
              selectAndHighlightElement(
                start_tag_xpath, 
                start_tag_offset, 
                undefined, 
                tagColor, 
                owner
              )
              selectAndHighlightElement(
                end_tag_xpath, 
                0, 
                end_tag_offset, 
                tagColor, 
                owner
              )
            }
            successCount++
          } catch (error) {
            console.warn("Failed to highlight tag:", error)
          }
        })
        
        if (successCount > 0) {
          console.log(`✅ Content Script: Successfully loaded ${successCount} tags with color ${tagColor}`)
        }
      } else if (!response.success && response.authenticationRequired) {
        showToast("warning", "Please sign in to load and save tags")
      } else {
        console.log("No existing tags found")
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

  // Initial setup - load settings and friends ONLY ONCE
  useEffect(() => {
    const initializeExtension = async () => {
      console.log("🚀 Content Script: Initializing TagXi extension...")
      
      // Step 1: Load settings ONLY if not already loaded
      if (!settingsLoadedRef.current) {
        await loadSettings()
      }
      
      // Step 2: Load friends ONLY if not already loaded
      if (!friendsLoadedRef.current) {
        await loadFriends()
      }
    }
    
    initializeExtension()
    
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("scroll", removeTagAndInputOnScroll)
    document.addEventListener("keydown", handleKeyboardInputs)
    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("scroll", removeTagAndInputOnScroll)
      document.removeEventListener("keydown", handleKeyboardInputs)
    }
  }, [handleMouseUp])

  // Load existing tags when settings are loaded - ONLY ONCE
  useEffect(() => {
    if (settingsLoaded && !isCurrentSiteBlocked()) {
      console.log("⚙️ Content Script: Settings loaded, now loading existing tags...")
      loadExistingTags()
    }
  }, [settingsLoaded]) // Removed tagColor dependency to prevent reloading

  // Don't render anything if site is blocked
  if (isCurrentSiteBlocked()) {
    console.log("🚫 Content Script: TagXi disabled on this website")
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
          friends={friends} // Pass loaded friends to TagInput
        />
      )}
    </>
  )
}

export default TagxiContentScript