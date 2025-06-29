import { getXPathForElement } from "~lib/xpath/xpath"
import { classifyContent, isTaggable, fallbackClassifier } from "./classifier"
import { sendToBackground } from "@plasmohq/messaging"
import { showToast } from "~components/WebComponents/Toast"

export interface ScannableElement {
  element: Element
  text: string
  xpath: string
  confidence: number
  label: string
}

/**
 * Enhanced XPath generator with better specificity
 */
function getEnhancedXPath(element: Element): string {
  try {
    return getXPathForElement(element as Node)
  } catch (error) {
    console.warn("Failed to generate XPath, using fallback:", error)
    return generateFallbackXPath(element)
  }
}

/**
 * Fallback XPath generator
 */
function generateFallbackXPath(element: Element): string {
  if (element.id) return `//*[@id="${element.id}"]`
  
  const parts: string[] = []
  let currentElement: Element | null = element
  
  while (currentElement && currentElement.nodeType === 1) {
    let index = 0
    let sibling = currentElement.previousElementSibling
    
    while (sibling) {
      if (sibling.nodeName === currentElement.nodeName) index++
      sibling = sibling.previousElementSibling
    }
    
    const part = `${currentElement.nodeName.toLowerCase()}[${index + 1}]`
    parts.unshift(part)
    currentElement = currentElement.parentElement
  }
  
  return "/" + parts.join("/")
}

/**
 * Get text content from element with smart extraction
 */
function getElementText(element: Element): string {
  if (element instanceof HTMLImageElement) {
    return element.alt || element.title || element.src.split('/').pop() || ""
  }
  
  if (element instanceof HTMLInputElement) {
    return element.placeholder || element.value || ""
  }
  
  if (element instanceof HTMLAnchorElement) {
    return element.textContent?.trim() || element.href
  }
  
  return element.textContent?.trim() || ""
}

/**
 * Check if element should be scanned
 */
function shouldScanElement(element: Element): boolean {
  // Skip hidden elements
  const style = window.getComputedStyle(element)
  if (style.display === "none" || style.visibility === "hidden") {
    return false
  }
  
  // Skip script and style elements
  if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(element.tagName)) {
    return false
  }
  
  // Skip elements that are too small
  const rect = element.getBoundingClientRect()
  if (rect.width < 10 || rect.height < 10) {
    return false
  }
  
  return true
}

/**
 * Find text nodes within an element for precise highlighting
 */
function findTextNodesInElement(element: Element): Text[] {
  const textNodes: Text[] = []
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Only accept text nodes with meaningful content
        const text = node.textContent?.trim() || ""
        if (text.length > 5 && !text.match(/^\s*$/)) {
          return NodeFilter.FILTER_ACCEPT
        }
        return NodeFilter.FILTER_REJECT
      }
    }
  )
  
  let node
  while (node = walker.nextNode()) {
    textNodes.push(node as Text)
  }
  
  return textNodes
}

/**
 * Get the best text node for highlighting from an element
 */
function getBestTextNode(element: Element): { textNode: Text; text: string } | null {
  const textNodes = findTextNodesInElement(element)
  
  if (textNodes.length === 0) {
    return null
  }
  
  // Find the longest meaningful text node
  let bestNode = textNodes[0]
  let bestText = bestNode.textContent?.trim() || ""
  
  for (const node of textNodes) {
    const text = node.textContent?.trim() || ""
    if (text.length > bestText.length) {
      bestNode = node
      bestText = text
    }
  }
  
  return { textNode: bestNode, text: bestText }
}

/**
 * Scan page and find elements worth tagging - focusing on text content
 */
export async function scanPageForTaggableContent(): Promise<ScannableElement[]> {
  console.log("🔍 Starting AI page scan (text-focused)...")
  
  // Select elements that contain meaningful text content
  const selectors = [
    "h1", "h2", "h3", "h4", "h5", "h6", // Headers are usually important
    "p", "article", "section", // Main content
    "blockquote", "pre", "code", // Special content
    "li", "td", "th", // List and table items
    "figcaption", "caption", // Captions
    "a[href]", "button", // Interactive elements with text
    "span", "strong", "em", "b", "i", // Inline text elements
    "div" // Include divs but we'll extract text nodes from them
  ]
  
  const elements = document.querySelectorAll(selectors.join(", "))
  const candidates: { element: Element; textNode: Text; text: string; xpath: string }[] = []
  
  // Filter and prepare candidates - focus on text nodes
  elements.forEach((element) => {
    if (!shouldScanElement(element)) return
    
    // For div elements, try to find the best text node inside
    if (element.tagName === "DIV") {
      const textNodeInfo = getBestTextNode(element)
      if (textNodeInfo && textNodeInfo.text.length >= 15 && textNodeInfo.text.length <= 300) {
        candidates.push({
          element,
          textNode: textNodeInfo.textNode,
          text: textNodeInfo.text,
          xpath: getEnhancedXPath(textNodeInfo.textNode)
        })
      }
    } else {
      // For other elements, use their direct text content
      const text = getElementText(element)
      
      // Only process elements with meaningful text content
      if (text.length >= 15 && text.length <= 300) {
        // Try to find a text node within the element for better highlighting
        const textNodeInfo = getBestTextNode(element)
        if (textNodeInfo) {
          candidates.push({
            element,
            textNode: textNodeInfo.textNode,
            text: textNodeInfo.text,
            xpath: getEnhancedXPath(textNodeInfo.textNode)
          })
        } else {
          // Fallback to the element itself if no text nodes found
          candidates.push({
            element,
            textNode: null,
            text,
            xpath: getEnhancedXPath(element)
          })
        }
      }
    }
  })
  
  console.log(`📑 Found ${candidates.length} text-focused candidates for AI analysis`)
  
  const taggableElements: ScannableElement[] = []
  let aiFailureCount = 0
  let useAI = true
  
  // Process candidates in smaller batches for better performance
  const batchSize = 3
  for (let i = 0; i < candidates.length && i < 30; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize)
    
    await Promise.all(
      batch.map(async ({ element, textNode, text, xpath }) => {
        try {
          let result
          
          if (useAI) {
            try {
              // Try AI classification first
              result = await classifyContent(text)
            } catch (aiError) {
              console.warn(`AI classification failed, switching to fallback mode`)
              aiFailureCount++
              useAI = false // Disable AI for remaining elements
              result = fallbackClassifier(text)
            }
          } else {
            // Use rule-based fallback
            result = fallbackClassifier(text)
          }
          
          if (isTaggable(result, 0.5)) {
            taggableElements.push({
              element: textNode || element, // Prefer text node for highlighting
              text,
              xpath,
              confidence: result.scores[0],
              label: result.labels[0]
            })
            
            console.log(
              `✅ Taggable text: ${text.slice(0, 50)}... (${result.labels[0]}: ${(result.scores[0] * 100).toFixed(1)}%)`
            )
          }
        } catch (error) {
          console.warn(`Failed to process text: ${text.slice(0, 30)}...`, error)
        }
      })
    )
    
    // Longer delay between batches to prevent overwhelming
    if (i + batchSize < candidates.length && i < 27) {
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  }
  
  if (aiFailureCount > 0) {
    console.log(`⚠️ AI failed, used rule-based fallback for remaining elements`)
  }
  
  console.log(`🎯 Found ${taggableElements.length} taggable text elements`)
  return taggableElements
}

/**
 * Highlight text elements with AI suggestions - improved for text nodes
 */
export function highlightTaggableElements(
  elements: ScannableElement[],
  tagColor: string = "#ffb988"
): void {
  elements.forEach(({ element, confidence, label, text, xpath }) => {
    let targetElement: Element
    
    // If element is a text node, we need to wrap it for highlighting
    if (element.nodeType === Node.TEXT_NODE) {
      const textNode = element as Text
      const wrapper = document.createElement("span")
      wrapper.style.cssText = `
        background-color: ${tagColor}40;
        border-radius: 3px;
        padding: 2px 4px;
        position: relative;
        display: inline;
      `
      
      // Wrap the text node
      const parent = textNode.parentNode
      if (parent) {
        parent.insertBefore(wrapper, textNode)
        wrapper.appendChild(textNode)
        targetElement = wrapper
      } else {
        return // Skip if no parent
      }
    } else {
      targetElement = element as Element
      
      // Apply highlighting styles to the element
      const elementStyle = targetElement as HTMLElement
      elementStyle.style.backgroundColor = `${tagColor}40`
      elementStyle.style.borderRadius = "3px"
      elementStyle.style.padding = "2px 4px"
      elementStyle.style.position = "relative"
      elementStyle.style.display = "inline-block"
    }
    
    // Add data attributes for identification
    targetElement.setAttribute("data-tagxi-ai-suggested", "true")
    targetElement.setAttribute("data-tagxi-confidence", confidence.toString())
    targetElement.setAttribute("data-tagxi-label", label)
    targetElement.setAttribute("data-tagxi-text", text)
    targetElement.setAttribute("data-tagxi-xpath", xpath)
    
    // Store original styles
    const originalStyle = targetElement.getAttribute("style") || ""
    targetElement.setAttribute("data-tagxi-original-style", originalStyle)
    
    // Add transition effect
    const elementStyle = targetElement as HTMLElement
    elementStyle.style.transition = "all 0.3s ease"
    
    // Add a small indicator
    const indicator = document.createElement("div")
    indicator.className = "tagxi-ai-indicator"
    indicator.style.cssText = `
      position: absolute;
      top: -8px;
      right: -8px;
      width: 18px;
      height: 18px;
      background: ${tagColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: bold;
      color: #000;
      z-index: 9999;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: transform 0.2s ease;
      border: 2px solid white;
    `
    indicator.textContent = "🤖"
    indicator.title = `AI suggested (${(confidence * 100).toFixed(1)}% confidence) - Click to tag`
    
    // Add hover effect
    indicator.addEventListener("mouseenter", () => {
      indicator.style.transform = "scale(1.1)"
      elementStyle.style.backgroundColor = `${tagColor}60`
    })
    
    indicator.addEventListener("mouseleave", () => {
      indicator.style.transform = "scale(1)"
      elementStyle.style.backgroundColor = `${tagColor}40`
    })
    
    // Add click handler for quick tagging
    indicator.addEventListener("click", async (e) => {
      e.stopPropagation()
      await handleAITagSuggestion(targetElement, label, confidence, text, xpath, tagColor)
    })
    
    targetElement.appendChild(indicator)
  })
}

/**
 * Clear AI highlights from the page - improved for text nodes
 */
export function clearAIHighlights(): void {
  const highlightedElements = document.querySelectorAll("[data-tagxi-ai-suggested]")
  
  highlightedElements.forEach((element) => {
    // Remove AI indicators first
    const indicators = element.querySelectorAll(".tagxi-ai-indicator")
    indicators.forEach(indicator => indicator.remove())
    
    // If this is a wrapper we created for a text node, unwrap it
    if (element.tagName === "SPAN" && element.hasAttribute("data-tagxi-ai-suggested")) {
      const parent = element.parentNode
      const textNode = element.firstChild
      
      if (parent && textNode && textNode.nodeType === Node.TEXT_NODE) {
        parent.insertBefore(textNode, element)
        parent.removeChild(element)
        return
      }
    }
    
    // Otherwise, restore original styles
    const originalStyle = element.getAttribute("data-tagxi-original-style") || ""
    element.setAttribute("style", originalStyle)
    
    // Remove data attributes
    element.removeAttribute("data-tagxi-ai-suggested")
    element.removeAttribute("data-tagxi-confidence")
    element.removeAttribute("data-tagxi-label")
    element.removeAttribute("data-tagxi-text")
    element.removeAttribute("data-tagxi-xpath")
    element.removeAttribute("data-tagxi-original-style")
  })
  
  console.log("🧹 Cleared AI highlights")
}

/**
 * Handle AI tag suggestion click with enhanced functionality
 */
async function handleAITagSuggestion(
  element: Element,
  label: string,
  confidence: number,
  text: string,
  xpath: string,
  tagColor: string
): Promise<void> {
  console.log(`🏷️ AI tag suggestion clicked:`, { element, label, confidence })
  
  // Create a more sophisticated input modal
  const modal = document.createElement("div")
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `
  
  const modalContent = document.createElement("div")
  modalContent.style.cssText = `
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  `
  
  modalContent.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #333;">
        🤖 AI Tag Suggestion
      </h3>
      <p style="margin: 0; color: #666; font-size: 14px;">
        AI classified this as <strong>${label}</strong> content (${(confidence * 100).toFixed(1)}% confidence)
      </p>
    </div>
    
    <div style="margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid ${tagColor};">
      <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.4;">
        "${text.slice(0, 150)}${text.length > 150 ? '...' : ''}"
      </p>
    </div>
    
    <div style="margin-bottom: 16px;">
      <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333; font-size: 14px;">
        Tag someone:
      </label>
      <input 
        type="text" 
        id="tagxi-ai-username-input"
        placeholder="@username"
        style="width: 100%; padding: 10px 12px; border: 2px solid #e1e5e9; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s;"
      />
    </div>
    
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button 
        id="tagxi-ai-cancel-btn"
        style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-size: 14px; color: #666; transition: all 0.2s;"
      >
        Cancel
      </button>
      <button 
        id="tagxi-ai-tag-btn"
        style="padding: 8px 16px; border: none; background: ${tagColor}; color: #000; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s;"
      >
        Tag Content
      </button>
    </div>
  `
  
  modal.appendChild(modalContent)
  document.body.appendChild(modal)
  
  // Focus the input
  const input = modal.querySelector("#tagxi-ai-username-input") as HTMLInputElement
  const tagBtn = modal.querySelector("#tagxi-ai-tag-btn") as HTMLButtonElement
  const cancelBtn = modal.querySelector("#tagxi-ai-cancel-btn") as HTMLButtonElement
  
  input.focus()
  
  // Add input styling on focus
  input.addEventListener("focus", () => {
    input.style.borderColor = tagColor
  })
  
  input.addEventListener("blur", () => {
    input.style.borderColor = "#e1e5e9"
  })
  
  // Add button hover effects
  tagBtn.addEventListener("mouseenter", () => {
    tagBtn.style.opacity = "0.9"
    tagBtn.style.transform = "translateY(-1px)"
  })
  
  tagBtn.addEventListener("mouseleave", () => {
    tagBtn.style.opacity = "1"
    tagBtn.style.transform = "translateY(0)"
  })
  
  cancelBtn.addEventListener("mouseenter", () => {
    cancelBtn.style.backgroundColor = "#f5f5f5"
  })
  
  cancelBtn.addEventListener("mouseleave", () => {
    cancelBtn.style.backgroundColor = "white"
  })
  
  const closeModal = () => {
    document.body.removeChild(modal)
  }
  
  const handleTag = async () => {
    const username = input.value.trim().replace(/^@/, "") // Remove @ if present
    
    if (!username) {
      input.style.borderColor = "#e74c3c"
      input.focus()
      return
    }
    
    tagBtn.disabled = true
    tagBtn.textContent = "Tagging..."
    tagBtn.style.opacity = "0.7"
    
    try {
      // For text nodes, we need to calculate proper offsets
      let startOffset = 0
      let endOffset = text.length
      
      // If we're dealing with a text node wrapper, get the actual text node
      let targetXPath = xpath
      if (element.tagName === "SPAN" && element.firstChild?.nodeType === Node.TEXT_NODE) {
        const textNode = element.firstChild as Text
        targetXPath = getEnhancedXPath(textNode)
        endOffset = textNode.textContent?.length || text.length
      }
      
      // Create tag data
      const tagData = {
        url: window.location.href,
        tag: username,
        timestamp: Date.now(),
        startContainerXPath: targetXPath,
        endContainerXPath: targetXPath,
        startOffset,
        endOffset
      }
      
      // Save the tag
      const response = await sendToBackground({
        name: "save-tag",
        body: tagData
      })
      
      if (response.success) {
        // Remove AI highlight
        element.removeAttribute("data-tagxi-ai-suggested")
        const indicator = element.querySelector(".tagxi-ai-indicator")
        if (indicator) indicator.remove()
        
        // Convert AI highlight to user highlight
        const htmlElement = element as HTMLElement
        htmlElement.style.backgroundColor = tagColor
        htmlElement.style.border = `2px solid ${tagColor}`
        htmlElement.style.borderRadius = "4px"
        htmlElement.style.padding = "2px 4px"
        htmlElement.style.cursor = "pointer"
        htmlElement.setAttribute("data-tagxi-tagged-by", username)
        
        // Add hover tooltip for the newly tagged content
        let tooltip: HTMLElement | null = null
        
        const createTooltip = () => {
          const tooltip = document.createElement("div")
          tooltip.className = "tagxi-hover-tooltip"
          tooltip.style.cssText = `
            position: absolute;
            top: -35px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
          `
          tooltip.textContent = `👤 Tagged by @${username}`
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
        
        showToast("success", `✅ Tagged content for @${username}`)
        closeModal()
      } else {
        showToast("danger", "Failed to save tag")
        tagBtn.disabled = false
        tagBtn.textContent = "Tag Content"
        tagBtn.style.opacity = "1"
      }
    } catch (error) {
      console.error("Error saving AI tag:", error)
      showToast("danger", "Error saving tag")
      tagBtn.disabled = false
      tagBtn.textContent = "Tag Content"
      tagBtn.style.opacity = "1"
    }
  }
  
  // Event listeners
  cancelBtn.addEventListener("click", closeModal)
  tagBtn.addEventListener("click", handleTag)
  
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleTag()
    } else if (e.key === "Escape") {
      closeModal()
    }
  })
  
  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal()
    }
  })
}