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
  color = "yellow",
  taggedBy?: string,
  message?: string
) => {
  const textNode = element as Text
  const before = textNode.splitText(start)
  before.splitText(end - start)
  const wrapper = document.createElement("mark")
  wrapper.style.backgroundColor = color
  wrapper.textContent = before.textContent

  // Add hover functionality for user-tagged content
  if (taggedBy) {
    wrapper.setAttribute("data-tagxi-tagged-by", taggedBy)
    wrapper.style.cursor = "pointer"
    wrapper.style.position = "relative"

    // Create hover tooltip
    const createTooltip = () => {
      const tooltip = document.createElement("div")
      tooltip.className = "tagxi-hover-tooltip"
      tooltip.style.cssText = `
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 10px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 500;
        z-index: 10000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        margin-bottom: 8px;
        max-width: 300px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `

      // Add username with styling
      const usernameDiv = document.createElement("div")
      usernameDiv.style.cssText = `
        font-weight: 600;
        font-size: 13px;
        margin-bottom: 5px;
        display: flex;
        align-items: center;
      `
      const userIcon = document.createElement("span")
      userIcon.textContent = "👤 "
      userIcon.style.marginRight = "5px"

      usernameDiv.appendChild(userIcon)
      usernameDiv.appendChild(document.createTextNode(`@${taggedBy}`))
      tooltip.appendChild(usernameDiv)

      // Add message if available
      if (message && message.trim()) {
        const messageDiv = document.createElement("div")
        messageDiv.style.cssText = `
          color: rgba(255, 255, 255, 0.9);
          font-weight: normal;
          margin-top: 4px;
          line-height: 1.4;
          white-space: normal;
          word-break: break-word;
        `
        messageDiv.textContent = message
        tooltip.appendChild(messageDiv)
      }

      // Add arrow
      const arrow = document.createElement("div")
      arrow.style.cssText = `
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid rgba(0, 0, 0, 0.9);
      `
      tooltip.appendChild(arrow)

      return tooltip
    }

    let tooltip: HTMLElement | null = null

    wrapper.addEventListener("mouseenter", () => {
      tooltip = createTooltip()
      wrapper.appendChild(tooltip)
      // Trigger reflow and show tooltip
      requestAnimationFrame(() => {
        if (tooltip) tooltip.style.opacity = "1"
      })
    })

    wrapper.addEventListener("mouseleave", () => {
      if (tooltip) {
        tooltip.style.opacity = "0"
        setTimeout(() => {
          if (tooltip && tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip)
          }
          tooltip = null
        }, 200)
      }
    })
  }

  before.replaceWith(wrapper)
}

const selectAndHighlightImage = (
  element: Node,
  taggedBy?: string,
  message?: string
) => {
  if (
    element &&
    element.nodeType === Node.ELEMENT_NODE &&
    (element as HTMLElement).tagName === "IMG"
  ) {
    const img = element as HTMLImageElement
    img.style.border = "3px solid red"
    img.style.borderRadius = "4px"
    img.style.position = "relative"

    // Add hover functionality for user-tagged content
    if (taggedBy) {
      img.setAttribute("data-tagxi-tagged-by", taggedBy)
      img.style.cursor = "pointer"

      let tooltip: HTMLElement | null = null

      const createTooltip = () => {
        const tooltip = document.createElement("div")
        tooltip.className = "tagxi-hover-tooltip"
        tooltip.style.cssText = `
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translate(-50%, -100%);
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          z-index: 10000;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease;
          max-width: 300px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `

        // Add username with styling
        const usernameDiv = document.createElement("div")
        usernameDiv.style.cssText = `
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
        `
        const userIcon = document.createElement("span")
        userIcon.textContent = "👤 "
        userIcon.style.marginRight = "5px"

        usernameDiv.appendChild(userIcon)
        usernameDiv.appendChild(document.createTextNode(`@${taggedBy}`))
        tooltip.appendChild(usernameDiv)

        // Add message if available
        if (message && message.trim()) {
          const messageDiv = document.createElement("div")
          messageDiv.style.cssText = `
            color: rgba(255, 255, 255, 0.9);
            font-weight: normal;
            margin-top: 4px;
            line-height: 1.4;
            white-space: normal;
            word-break: break-word;
          `
          messageDiv.textContent = message
          tooltip.appendChild(messageDiv)
        }

        // Add arrow
        const arrow = document.createElement("div")
        arrow.style.cssText = `
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid rgba(0, 0, 0, 0.9);
        `
        tooltip.appendChild(arrow)

        return tooltip
      }

      img.addEventListener("mouseenter", () => {
        tooltip = createTooltip()
        img.parentElement?.appendChild(tooltip)
        requestAnimationFrame(() => {
          if (tooltip) tooltip.style.opacity = "1"
        })
      })

      img.addEventListener("mouseleave", () => {
        if (tooltip) {
          tooltip.style.opacity = "0"
          setTimeout(() => {
            if (tooltip && tooltip.parentNode) {
              tooltip.parentNode.removeChild(tooltip)
            }
            tooltip = null
          }, 200)
        }
      })
    }
  }
}

// FIXED: Updated function signature to include message parameter
export const selectAndHighlightElement = (
  xpath: string,
  startOffset: number,
  endOffset?: number,
  color?: string,
  taggedBy?: string,
  message?: string
) => {
  const element = getElementFromXpath(xpath)

  if (!element) return

  // Use default color if not provided (backward compatibility)
  const highlightColor = color || "yellow"

  if (element.nodeType === Node.TEXT_NODE) {
    if (typeof startOffset === "number" && typeof endOffset === "number") {
      selectAndHighlightText(
        element,
        startOffset,
        endOffset,
        highlightColor,
        taggedBy,
        message
      )
    } else {
      const textContentLength = element.textContent?.length
        ? element.textContent.length
        : 0
      selectAndHighlightText(
        element,
        startOffset,
        textContentLength,
        highlightColor,
        taggedBy,
        message
      )
    }
  } else if (
    element.nodeType === Node.ELEMENT_NODE &&
    (element as HTMLElement).tagName === "IMG"
  ) {
    selectAndHighlightImage(element, taggedBy, message)
  } else if (element.nodeType === Node.ELEMENT_NODE) {
    const htmlElement = element as HTMLElement
    htmlElement.style.outline = "2px dashed blue"
    htmlElement.style.position = "relative"

    // Add hover functionality for user-tagged content
    if (taggedBy) {
      htmlElement.setAttribute("data-tagxi-tagged-by", taggedBy)
      htmlElement.style.cursor = "pointer"

      let tooltip: HTMLElement | null = null

      const createTooltip = () => {
        const tooltip = document.createElement("div")
        tooltip.className = "tagxi-hover-tooltip"
        tooltip.style.cssText = `
          position: absolute;
          top: -10px;
          left: 10px;
          transform: translateY(-100%);
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          z-index: 10000;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease;
          max-width: 300px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `

        // Add username with styling
        const usernameDiv = document.createElement("div")
        usernameDiv.style.cssText = `
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
        `
        const userIcon = document.createElement("span")
        userIcon.textContent = "👤 "
        userIcon.style.marginRight = "5px"

        usernameDiv.appendChild(userIcon)
        usernameDiv.appendChild(document.createTextNode(`@${taggedBy}`))
        tooltip.appendChild(usernameDiv)

        // Add message if available
        console.log("Message", message)
        if (message && message.trim()) {
          const messageDiv = document.createElement("div")
          messageDiv.style.cssText = `
            color: rgba(255, 255, 255, 0.9);
            font-weight: normal;
            margin-top: 4px;
            line-height: 1.4;
            white-space: normal;
            word-break: break-word;
          `
          messageDiv.textContent = message
          tooltip.appendChild(messageDiv)
        }

        // Add arrow
        const arrow = document.createElement("div")
        arrow.style.cssText = `
          position: absolute;
          bottom: -6px;
          left: 20px;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid rgba(0, 0, 0, 0.9);
        `
        tooltip.appendChild(arrow)

        return tooltip
      }

      htmlElement.addEventListener("mouseenter", () => {
        tooltip = createTooltip()
        htmlElement.appendChild(tooltip)
        requestAnimationFrame(() => {
          if (tooltip) tooltip.style.opacity = "1"
        })
      })

      htmlElement.addEventListener("mouseleave", () => {
        if (tooltip) {
          tooltip.style.opacity = "0"
          setTimeout(() => {
            if (tooltip && tooltip.parentNode) {
              tooltip.parentNode.removeChild(tooltip)
            }
            tooltip = null
          }, 200)
        }
      })
    }
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
