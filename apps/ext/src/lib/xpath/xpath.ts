const getElementFromXpath = (xpath: string): Node | null => {
  xpath.replace(/\\"/g, '"')
  const result = document.evaluate(
    xpath,
    document.documentElement,
    null, // namespaceResolver (not needed for simple XPath)
    XPathResult.FIRST_ORDERED_NODE_TYPE, // Specify result type
    null // Result (usually null to create a new result)
  )
  const node = result.singleNodeValue // Use singleNodeValue for FIRST_ORDERED_NODE_TYPE
  return node
}

const selectAndHighlightText = (
  element: Node,
  start: number,
  end: number,
  color = "#ffb988" // Default color, will be overridden by user settings
) => {
  const textNode = element as Text
  const textLength = textNode.textContent?.length || 0
  
  // Validate offsets to prevent IndexSizeError
  if (start < 0 || start >= textLength) {
    console.warn(`Invalid start offset ${start} for text length ${textLength}`)
    return
  }
  
  if (end < 0 || end > textLength) {
    console.warn(`Invalid end offset ${end} for text length ${textLength}`)
    end = textLength // Clamp to text length
  }
  
  if (start >= end) {
    console.warn(`Start offset ${start} is greater than or equal to end offset ${end}`)
    return
  }
  
  try {
    const before = textNode.splitText(start)
    const highlightLength = end - start
    
    // Ensure we don't split beyond the remaining text
    if (highlightLength > 0 && highlightLength <= before.textContent.length) {
      before.splitText(highlightLength)
    }
    
    const wrapper = document.createElement("mark")
    wrapper.style.backgroundColor = color
    wrapper.style.color = "#000" // Ensure text is readable
    wrapper.style.padding = "1px 2px"
    wrapper.style.borderRadius = "2px"
    wrapper.textContent = before.textContent
    before.replaceWith(wrapper)
  } catch (error) {
    console.error("Error highlighting text:", error, {
      start,
      end,
      textLength,
      textContent: textNode.textContent?.substring(0, 50) + "..."
    })
  }
}

const selectAndHighlightImage = (element: Node, color = "#ffb988") => {
  if (
    element &&
    element.nodeType === Node.ELEMENT_NODE &&
    (element as HTMLElement).tagName === "IMG"
  ) {
    const img = element as HTMLImageElement
    img.style.border = `3px solid ${color}`
    img.style.borderRadius = "4px"
    img.style.boxShadow = `0 0 0 2px ${color}40` // Add subtle glow
  }
}

export const selectAndHighlightElement = (
  xpath: string,
  startOffset: number,
  endOffset?: number,
  color = "#ffb988" // Accept color parameter
) => {
  try {
    const element = getElementFromXpath(xpath)

    if (!element) {
      console.warn(`Element not found for xpath: ${xpath}`)
      return
    }
    
    if (element.nodeType === Node.TEXT_NODE) {
      const textLength = element.textContent?.length || 0
      
      if (typeof startOffset === "number" && typeof endOffset === "number") {
        // Validate and clamp offsets
        const validStart = Math.max(0, Math.min(startOffset, textLength))
        const validEnd = Math.max(validStart, Math.min(endOffset, textLength))
        
        if (validStart < validEnd) {
          selectAndHighlightText(element, validStart, validEnd, color)
        } else {
          console.warn("Invalid text selection range after validation")
        }
      } else {
        // Highlight from start to end of text
        const validStart = Math.max(0, Math.min(startOffset, textLength))
        if (validStart < textLength) {
          selectAndHighlightText(element, validStart, textLength, color)
        }
      }
    } else if (
      element.nodeType === Node.ELEMENT_NODE &&
      (element as HTMLElement).tagName === "IMG"
    ) {
      selectAndHighlightImage(element, color)
    } else if (element.nodeType === Node.ELEMENT_NODE) {
      ;(element as HTMLElement).style.outline = `2px dashed ${color}`
      ;(element as HTMLElement).style.outlineOffset = "2px"
    }
  } catch (error) {
    console.error("Error in selectAndHighlightElement:", error, {
      xpath,
      startOffset,
      endOffset,
      color
    })
  }
}

/**
 * Specific to selecting text and image
 * @param node
 * @returns string
 */
export const getXPathForElement = (node: Node): string => {
  // for a single element -> /nodeName[@id=''][position]
  // position is required since a parent can have multiple elment of same type -> it will give specificity

  //   base case -> top of the document
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement
    if (element === document.body) return "/html/body"
    if (element === document.documentElement) return "/html"
  }

  const path = []
  const parentNode = node.parentNode

  // html element and the element is having id
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement
    const elementPath = [`//${element.nodeName}`]
    const id = element?.id
    if (id) return `//${element.nodeName}[@id="${id}"]`
    path.push(elementPath.join(""))
  }

  // text node
  if (node.nodeType === Node.TEXT_NODE) {
    path.push("/text()")
  }

  // positioning -> 1 based index
  let index = 1
  let previousSibling = node.previousSibling
  while (previousSibling) {
    if (previousSibling.nodeName === node.nodeName) index++
    previousSibling = previousSibling.previousSibling
  }
  path.push(`[${index}]`)
  return getXPathForElement(parentNode) + path.join("")
}