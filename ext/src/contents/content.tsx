import cssText from "data-text:~style.css"
import type { PlasmoCreateShadowRoot } from "plasmo"
import React, { useCallback, useEffect, useRef, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"

import TagButton from "~components/WebComponents/TagButton"
import TagInput from "~components/WebComponents/TagInput"
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
// /**
//  * Plasmo specific function for content script ui to apply tailwind
//  */

export const createShadowRoot: PlasmoCreateShadowRoot = (shadowHost) =>
  shadowHost.attachShadow({ mode: "closed" })

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
  const [lastScroll, setLastScroll] = useState({
    y: window.scrollY,
    x: window.scrollX
  })
  const selectionRef = useRef<Record<string, string | number> | null>(null)

  const resetSelection = () => {
    setShowIcon(false)
    setShowInput(false)
    selectionRef.current = {}
  }

  const handleMouseUp = useCallback((e: MouseEvent) => {
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
  }, [])

  const handleIconClick = useCallback(() => {
    setShowInput(true)
    setShowIcon(false)
  }, [])

  const handleInputKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
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
                endOffset as number
              )
            } else {
              selectAndHighlightElement(
                startContainerXPath as string,
                startOffset as number
              )
              selectAndHighlightElement(
                endContainerXPath as string,
                0,
                endOffset as number
              )
            }
            resetSelection()
          } else {
            console.error("Failed to save tag:", response.message)
            // You could show an error message to the user here
          }
        } catch (error) {
          console.error("Error saving tag:", error)
          // You could show an error message to the user here
        } finally {
          setIsLoading(false)
        }
      }
    },
    []
  )

  const handleEspaceKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      resetSelection()
    }
  }

  const loadExistingTags = async () => {
    try {
      const response = await sendToBackground({
        name: "get-tag",
        body: { url: window.location.href }
      })
      if (response.success && response.data) {
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
                end_tag_offset
              )
            } else {
              selectAndHighlightElement(start_tag_xpath, start_tag_offset)
              selectAndHighlightElement(end_tag_xpath, 0, end_tag_offset)
            }
          } catch (error) {
            // TODO: maybe showing our saved page kind of internet archive with a toast
          }
        })
      }
    } catch (error) {
      console.error("Error loading existing tags:", error)
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
    loadExistingTags()
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("scroll", removeTagAndInputOnScroll)
    document.addEventListener("keydown", handleEspaceKey)
    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
      document.addEventListener("scroll", removeTagAndInputOnScroll)
      document.addEventListener("keydown", handleEspaceKey)
    }
  }, [])

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
