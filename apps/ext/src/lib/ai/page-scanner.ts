import { getXPathForElement } from "~lib/xpath/xpath"
import { classifyContent, isTaggable } from "./classifier"

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
  // Use existing xpath function but with fallback
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
    "p", "h1", "h2", "h3", "h4", "h5", "h6",
    "article", "section", "div[class*='content']",
    "div[class*='article']", "div[class*='post']",
    "blockquote", "pre", "code",
    "li", "td", "th",
    "img[alt]", "figure", "figcaption",
    "a[href]", "button"
  ]
  
  const elements = document.querySelectorAll(selectors.join(", "))
  const candidates: { element: Element; text: string; xpath: string }[] = []
  
  // Filter and prepare candidates
  elements.forEach((element) => {
    if (!shouldScanElement(element)) return
    
    const text = getElementText(element)
    
    // Only process elements with meaningful text content
    if (text.length >= 15 && text.length <= 500) {
      candidates.push({
        element,
        text,
        xpath: getEnhancedXPath(element)
      })
    }
  })
  
  console.log(`📑 Found ${candidates.length} candidates for AI analysis`)
  
  const taggableElements: ScannableElement[] = []
  
  // Process candidates in batches to avoid overwhelming the model
  const batchSize = 10
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize)
    
    await Promise.all(
      batch.map(async ({ element, text, xpath }) => {
        try {
          const result = await classifyContent(text, [
            "important information",
            "notable content", 
            "actionable item",
            "key insight",
            "skip"
          ])
          
          if (isTaggable(result, 0.7)) {
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
          console.warn(`Failed to classify element: ${text.slice(0, 30)}...`, error)
        }
      })
    )
    
    // Small delay between batches to prevent blocking
    if (i + batchSize < candidates.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
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
  elements.forEach(({ element, confidence, label }) => {
    // Add data attributes for identification
    element.setAttribute("data-tagxi-ai-suggested", "true")
    element.setAttribute("data-tagxi-confidence", confidence.toString())
    element.setAttribute("data-tagxi-label", label)
    
    // Apply highlighting styles
    const originalStyle = element.getAttribute("style") || ""
    element.setAttribute("data-tagxi-original-style", originalStyle)
    
    // Create a subtle highlight effect
    // @ts-ignore
    element.style.outline = `2px dashed ${tagColor}`
    // @ts-ignore
    element.style.outlineOffset = "2px"
    // @ts-ignore
    element.style.position = "relative"
    // @ts-ignore
    element.style.transition = "all 0.3s ease"
    
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
    `
    indicator.textContent = "🤖"
    indicator.title = `AI suggested (${(confidence * 100).toFixed(1)}% confidence)`
    
    // Add click handler for quick tagging
    indicator.addEventListener("click", (e) => {
      e.stopPropagation()
      handleAITagSuggestion(element, label, confidence)
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
    element.removeAttribute("data-tagxi-original-style")
    
    // Remove AI indicators
    const indicators = element.querySelectorAll(".tagxi-ai-indicator")
    indicators.forEach(indicator => indicator.remove())
  })
  
  console.log("🧹 Cleared AI highlights")
}

/**
 * Handle AI tag suggestion click
 */
function handleAITagSuggestion(
  element: Element,
  label: string,
  confidence: number
): void {
  console.log(`🏷️ AI tag suggestion clicked:`, { element, label, confidence })
  
  // You can integrate this with your existing tagging system
  // For now, we'll just show a simple prompt
  const username = prompt(`AI suggests tagging this ${label} content.\nEnter username to tag:`)
  
  if (username) {
    // Here you would integrate with your existing tagging logic
    console.log(`Tagging with username: ${username}`)
    
    // Remove the AI highlight since it's now being tagged
    element.removeAttribute("data-tagxi-ai-suggested")
    const indicator = element.querySelector(".tagxi-ai-indicator")
    if (indicator) indicator.remove()
  }
}