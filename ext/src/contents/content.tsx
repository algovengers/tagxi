import cssText from "data-text:~style.css"
import React, { useCallback, useEffect, useRef, useState } from "react"

import TagButton from "~components/WebComponents/TagButton"
import TagInput from "~components/WebComponents/TagInput"

/**
 * TODO:
 * 2. on click tag icon add the text box with dropdown to add multiple options
 * 6. sending background message to the background worker to save that
 * 8. force reset shortcut to clear out all the tags -> just if required
 * 9. option to ignore which sites ignore -> need backend
 */

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export {}

const TagxiComponent = () => {
  const [showIcon, setShowIcon] = useState(false)
  const [iconPosition, setIconPosition] = useState({ top: 0, left: 0 })
  const [showInput, setShowInput] = useState(false)
  const selectionRef = useRef<Selection | null>(null)

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

    selectionRef.current = selection
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    setIconPosition({ top: rect.top - 30, left: rect.left })
    setShowIcon(true)
    setShowInput(false)
  }, [])

  const handleIconClick = useCallback(() => {
    setShowInput(true)
    setShowIcon(false)
  }, [])

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const value = e.currentTarget.value
        if (!value) return

        const data = {
          url: window.location.href,
          selection: selectionRef.current
            ? selectionRef.current.toString()
            : "",
          tag: value,
          timestamp: Date.now()
        }

        if (typeof chrome !== "undefined" && chrome.runtime) {
          chrome.runtime.sendMessage({
            name: "LOG_MESSAGE",
            body: `Saved tag: ${JSON.stringify(data)}`
          })
        } else {
          console.log("Mock chrome.runtime.sendMessage:", data)
        }

        setShowIcon(false)
        setShowInput(false)
      }

      if (e.key === "Escape") {
        setShowInput(false)
      }
    },
    []
  )

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  return (
    <>
      {showIcon && (
        <TagButton position={iconPosition} onClick={handleIconClick} />
      )}
      {showInput && (
        <TagInput position={iconPosition} onKeyDown={handleInputKeyDown} />
      )}
    </>
  )
}

export default TagxiComponent
