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
 * Scan page and find elements worth tagging
 */
export async function scanPageForTaggableContent(): Promise<ScannableElement[]> {
  console.log("🔍 Starting AI page scan...")
  
  // Select elements that might contain important content
  const selectors = [
    "h1", "h2", "h3", "h4", "h5", "h6", // Headers are usually important
    "p", "article", "section", // Main content
    "div[class*='content']", "div[class*='article']", "div[class*='post']",
    "blockquote", "pre", "code", // Special content
    "li", "td", "th", // List and table items
    "img[alt]", "figure", "figcaption", // Images with descriptions
    "a[href]", "button" // Interactive elements
  ]
  
  const elements = document.querySelectorAll(selectors.join(", "))
  const candidates: { element: Element; text: string; xpath: string }[] = []
  
  // Filter and prepare candidates
  elements.forEach((element) => {
    if (!shouldScanElement(element)) return
    
    const text = getElementText(element)
    
    // Only process elements with meaningful text content
    if (text.length >= 10 && text.length <= 300) { // Adjusted for better performance
      candidates.push({
        element,
        text,
        xpath: getEnhancedXPath(element)
      })
    }
  })
  
  console.log(`📑 Found ${candidates.length} candidates for AI analysis`)
  
  const taggableElements: ScannableElement[] = []
  let aiFailureCount = 0
  let useAI = true
  
  // Process candidates in smaller batches for better performance
  const batchSize = 3 // Even smaller batch size
  for (let i = 0; i < candidates.length && i < 30; i += batchSize) { // Limit total elements
    const batch = candidates.slice(i, i + batchSize)
    
    await Promise.all(
      batch.map(async ({ element, text, xpath }) => {
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
          
          if (isTaggable(result, 0.5)) { // Lower threshold for better results
            taggableElements.push({
              element,
              text,
              xpath,
              confidence: result.scores[0],
              label: result.labels[0]
            })
            
            console.log(
              `✅ Taggable: ${text.slice(0, 50)}... (${result.labels[0]}: ${(result.scores[0] * 100).toFixed(1)}%)`
            )
          }
        } catch (error) {
          console.warn(`Failed to process element: ${text.slice(0, 30)}...`, error)
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
  
  console.log(`🎯 Found ${taggableElements.length} taggable elements`)
  return taggableElements
}

/**
 * Highlight elements with AI suggestions
 */
export function highlightTaggableElements(
  elements: ScannableElement[],
  tagColor: string = "#ffb988"
): void {
  elements.forEach(({ element, confidence, label, text, xpath }) => {
    // Add data attributes for identification
    element.setAttribute("data-tagxi-ai-suggested", "true")
    element.setAttribute("data-tagxi-confidence", confidence.toString())
    element.setAttribute("data-tagxi-label", label)
    element.setAttribute("data-tagxi-text", text)
    element.setAttribute("data-tagxi-xpath", xpath)
    
    // Apply highlighting styles
    const originalStyle = element.getAttribute("style") || ""
    element.setAttribute("data-tagxi-original-style", originalStyle)
    
    // Create a subtle highlight effect
    const elementStyle = element as HTMLElement
    elementStyle.style.outline = `2px dashed ${tagColor}`
    elementStyle.style.outlineOffset = "2px"
    elementStyle.style.position = "relative"
    elementStyle.style.transition = "all 0.3s ease"
    
    // Add a small indicator
    const indicator = document.createElement("div")
    indicator.className = "tagxi-ai-indicator"
    indicator.style.cssText = `
      position: absolute;
      top: -8px;
      right: -8px;
      width: 20px;
      height: 20px;
      background: ${tagColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      color: #000;
      z-index: 9999;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: transform 0.2s ease;
    `
    indicator.textContent = "🤖"
    indicator.title = `AI suggested (${(confidence * 100).toFixed(1)}% confidence) - Click to tag`
    
    // Add hover effect
    indicator.addEventListener("mouseenter", () => {
      indicator.style.transform = "scale(1.1)"
    })
    
    indicator.addEventListener("mouseleave", () => {
      indicator.style.transform = "scale(1)"
    })
    
    // Add click handler for quick tagging
    indicator.addEventListener("click", async (e) => {
      e.stopPropagation()
      await handleAITagSuggestion(element, label, confidence, text, xpath, tagColor)
    })
    
    element.appendChild(indicator)
  })
}

/**
 * Clear AI highlights from the page
 */
export function clearAIHighlights(): void {
  const highlightedElements = document.querySelectorAll("[data-tagxi-ai-suggested]")
  
  highlightedElements.forEach((element) => {
    // Restore original styles
    const originalStyle = element.getAttribute("data-tagxi-original-style") || ""
    element.setAttribute("style", originalStyle)
    
    // Remove data attributes
    element.removeAttribute("data-tagxi-ai-suggested")
    element.removeAttribute("data-tagxi-confidence")
    element.removeAttribute("data-tagxi-label")
    element.removeAttribute("data-tagxi-text")
    element.removeAttribute("data-tagxi-xpath")
    element.removeAttribute("data-tagxi-original-style")
    
    // Remove AI indicators
    const indicators = element.querySelectorAll(".tagxi-ai-indicator")
    indicators.forEach(indicator => indicator.remove())
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
      // Calculate text selection bounds for the element
      const textContent = element.textContent || ""
      const startOffset = 0
      const endOffset = textContent.length
      
      // Create tag data
      const tagData = {
        url: window.location.href,
        tag: username,
        timestamp: Date.now(),
        startContainerXPath: xpath,
        endContainerXPath: xpath,
        startOffset,
        endOffset
      }
      
      // Save the tag
      const response = await sendToBackground({
        name: "save-tag",
        body: tagData
      })
      
      if (response.success) {
        // Remove AI highlight and add user highlight
        element.removeAttribute("data-tagxi-ai-suggested")
        const indicator = element.querySelector(".tagxi-ai-indicator")
        if (indicator) indicator.remove()
        
        // Restore original styles
        const originalStyle = element.getAttribute("data-tagxi-original-style") || ""
        element.setAttribute("style", originalStyle)
        
        // Add user tag highlight with hover functionality
        const htmlElement = element as HTMLElement
        htmlElement.style.outline = `2px solid ${tagColor}`
        htmlElement.style.outlineOffset = "2px"
        htmlElement.style.position = "relative"
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
            left: 10px;
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