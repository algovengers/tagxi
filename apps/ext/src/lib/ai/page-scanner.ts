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
        if (text.length > 10 && !text.match(/^\s*$/)) {
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
 * Enhanced content quality scoring
 */
function getContentQualityScore(text: string, element: Element): number {
  let score = 0
  
  // Text length scoring (optimal range: 20-150 characters)
  if (text.length >= 20 && text.length <= 150) {
    score += 0.3
  } else if (text.length > 150 && text.length <= 300) {
    score += 0.2
  } else if (text.length < 20) {
    score -= 0.2
  }
  
  // Element type scoring
  const tagName = element.tagName.toLowerCase()
  const tagScores = {
    'h1': 0.4, 'h2': 0.35, 'h3': 0.3, 'h4': 0.25, 'h5': 0.2, 'h6': 0.15,
    'p': 0.25, 'article': 0.3, 'section': 0.2,
    'blockquote': 0.3, 'pre': 0.25, 'code': 0.2,
    'strong': 0.15, 'em': 0.1, 'b': 0.1, 'i': 0.05,
    'a': 0.15, 'button': 0.2,
    'li': 0.1, 'td': 0.05, 'th': 0.1,
    'figcaption': 0.2, 'caption': 0.15,
    'span': 0.05, 'div': 0.05
  }
  score += tagScores[tagName] || 0
  
  // Content characteristics
  const hasNumbers = /\d/.test(text)
  const hasCapitalization = /[A-Z]{2,}/.test(text)
  const hasSpecialChars = /[!?:;]/.test(text)
  const hasCodeSyntax = /[{}[\]();]/.test(text)
  const hasUrls = /https?:\/\//.test(text)
  
  if (hasNumbers) score += 0.05
  if (hasCapitalization) score += 0.1
  if (hasSpecialChars) score += 0.05
  if (hasCodeSyntax) score += 0.15
  if (hasUrls) score += 0.1
  
  // Position scoring (elements higher on page are often more important)
  const rect = element.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const relativePosition = rect.top / viewportHeight
  
  if (relativePosition < 0.3) score += 0.1 // Top 30% of viewport
  else if (relativePosition < 0.6) score += 0.05 // Middle 30%
  
  // Class and ID hints
  const className = element.className.toLowerCase()
  const id = element.id.toLowerCase()
  const classIdText = `${className} ${id}`
  
  const positiveHints = ['content', 'main', 'article', 'important', 'highlight', 'feature', 'title', 'heading']
  const negativeHints = ['ad', 'advertisement', 'sidebar', 'footer', 'nav', 'menu', 'cookie', 'popup']
  
  positiveHints.forEach(hint => {
    if (classIdText.includes(hint)) score += 0.1
  })
  
  negativeHints.forEach(hint => {
    if (classIdText.includes(hint)) score -= 0.2
  })
  
  return Math.max(0, Math.min(1, score)) // Clamp between 0 and 1
}

/**
 * Scan page and find elements worth tagging - focusing on text content with enhanced quality scoring
 */
export async function scanPageForTaggableContent(): Promise<ScannableElement[]> {
  console.log("🔍 Starting enhanced AI page scan...")
  
  // Enhanced selectors with priority ordering
  const highPrioritySelectors = [
    "h1", "h2", "h3", // Main headings
    "article", "section", // Main content areas
    "blockquote", "pre", "code", // Special content
    "p:not([class*='ad']):not([class*='footer']):not([class*='nav'])" // Clean paragraphs
  ]
  
  const mediumPrioritySelectors = [
    "h4", "h5", "h6", // Sub-headings
    "figcaption", "caption", // Captions
    "strong", "em", "b", // Emphasized text
    "a[href]:not([class*='nav']):not([class*='menu'])", // Content links
    "button:not([class*='nav']):not([class*='menu'])" // Action buttons
  ]
  
  const lowPrioritySelectors = [
    "li", "td", "th", // List and table items
    "span", "div", // Generic containers
    "i" // Italic text
  ]
  
  const allSelectors = [...highPrioritySelectors, ...mediumPrioritySelectors, ...lowPrioritySelectors]
  const elements = document.querySelectorAll(allSelectors.join(", "))
  
  const candidates: { 
    element: Element; 
    textNode: Text | null; 
    text: string; 
    xpath: string; 
    qualityScore: number;
    priority: number;
  }[] = []
  
  // Process elements with quality scoring
  elements.forEach((element, index) => {
    if (!shouldScanElement(element)) return
    
    // Determine priority based on selector type
    let priority = 0
    const tagName = element.tagName.toLowerCase()
    if (highPrioritySelectors.some(sel => sel.includes(tagName))) priority = 3
    else if (mediumPrioritySelectors.some(sel => sel.includes(tagName))) priority = 2
    else priority = 1
    
    // For div elements, try to find the best text node inside
    if (element.tagName === "DIV") {
      const textNodeInfo = getBestTextNode(element)
      if (textNodeInfo && textNodeInfo.text.length >= 20 && textNodeInfo.text.length <= 400) {
        const qualityScore = getContentQualityScore(textNodeInfo.text, element)
        if (qualityScore > 0.2) { // Only include decent quality content
          candidates.push({
            element,
            textNode: textNodeInfo.textNode,
            text: textNodeInfo.text,
            xpath: getEnhancedXPath(textNodeInfo.textNode),
            qualityScore,
            priority
          })
        }
      }
    } else {
      // For other elements, use their direct text content
      const text = getElementText(element)
      
      // Only process elements with meaningful text content
      if (text.length >= 15 && text.length <= 400) {
        const qualityScore = getContentQualityScore(text, element)
        if (qualityScore > 0.15) { // Only include decent quality content
          // Try to find a text node within the element for better highlighting
          const textNodeInfo = getBestTextNode(element)
          candidates.push({
            element,
            textNode: textNodeInfo?.textNode || null,
            text: textNodeInfo?.text || text,
            xpath: getEnhancedXPath(textNodeInfo?.textNode || element),
            qualityScore,
            priority
          })
        }
      }
    }
  })
  
  // Sort candidates by quality score and priority, then limit to top candidates
  candidates.sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority
    return b.qualityScore - a.qualityScore
  })
  
  const topCandidates = candidates.slice(0, 25) // Limit to top 25 candidates
  
  console.log(`📑 Found ${topCandidates.length} high-quality candidates for AI analysis`)
  
  const taggableElements: ScannableElement[] = []
  let aiFailureCount = 0
  let useAI = true
  
  // Process candidates in smaller batches for better performance
  const batchSize = 5
  for (let i = 0; i < topCandidates.length; i += batchSize) {
    const batch = topCandidates.slice(i, i + batchSize)
    
    await Promise.all(
      batch.map(async ({ element, textNode, text, xpath, qualityScore, priority }) => {
        try {
          let result
          
          if (useAI) {
            try {
              // Try AI classification first with enhanced labels
              result = await classifyContent(text)
            } catch (aiError) {
              console.warn(`AI classification failed for: "${text.slice(0, 30)}...", switching to fallback`)
              aiFailureCount++
              if (aiFailureCount > 3) {
                useAI = false // Disable AI after multiple failures
              }
              result = fallbackClassifier(text, [
                "important information",
                "notable content", 
                "actionable item",
                "key insight",
                "educational content",
                "news or update",
                "technical documentation",
                "skip"
              ])
            }
          } else {
            // Use enhanced rule-based fallback
            result = fallbackClassifier(text, [
              "important information",
              "notable content", 
              "actionable item",
              "key insight",
              "educational content",
              "news or update",
              "technical documentation",
              "skip"
            ])
          }
          
          // Adjust threshold based on quality score and priority
          let threshold = 0.4
          if (priority === 3) threshold = 0.3 // Lower threshold for high priority elements
          else if (priority === 2) threshold = 0.4
          else threshold = 0.5 // Higher threshold for low priority elements
          
          // Boost confidence for high-quality content
          const adjustedConfidence = result.scores[0] + (qualityScore * 0.2)
          
          if (isTaggable(result, threshold) || adjustedConfidence > threshold) {
            taggableElements.push({
              element: textNode || element, // Prefer text node for highlighting
              text,
              xpath,
              confidence: adjustedConfidence,
              label: result.labels[0]
            })
            
            console.log(
              `✅ Taggable (Q:${qualityScore.toFixed(2)}, P:${priority}): ${text.slice(0, 50)}... (${result.labels[0]}: ${(adjustedConfidence * 100).toFixed(1)}%)`
            )
          }
        } catch (error) {
          console.warn(`Failed to process text: ${text.slice(0, 30)}...`, error)
        }
      })
    )
    
    // Shorter delay between batches for better responsiveness
    if (i + batchSize < topCandidates.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  if (aiFailureCount > 0) {
    console.log(`⚠️ AI failed ${aiFailureCount} times, ${useAI ? 'continuing with AI' : 'switched to rule-based fallback'}`)
  }
  
  // Sort final results by confidence
  taggableElements.sort((a, b) => b.confidence - a.confidence)
  
  console.log(`🎯 Found ${taggableElements.length} high-quality taggable elements`)
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
        transition: all 0.3s ease;
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
      elementStyle.style.transition = "all 0.3s ease"
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
    
    // Add a small indicator with enhanced styling
    const indicator = document.createElement("div")
    indicator.className = "tagxi-ai-indicator"
    indicator.style.cssText = `
      position: absolute;
      top: -10px;
      right: -10px;
      width: 20px;
      height: 20px;
      background: linear-gradient(135deg, ${tagColor}, ${tagColor}dd);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      color: #000;
      z-index: 9999;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
      border: 2px solid white;
    `
    indicator.textContent = "🤖"
    indicator.title = `AI suggested: ${label} (${(confidence * 100).toFixed(1)}% confidence) - Click to tag`
    
    // Add enhanced hover effects
    indicator.addEventListener("mouseenter", () => {
      indicator.style.transform = "scale(1.2)"
      indicator.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)"
      const elementStyle = targetElement as HTMLElement
      elementStyle.style.backgroundColor = `${tagColor}60`
      elementStyle.style.transform = "scale(1.02)"
    })
    
    indicator.addEventListener("mouseleave", () => {
      indicator.style.transform = "scale(1)"
      indicator.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)"
      const elementStyle = targetElement as HTMLElement
      elementStyle.style.backgroundColor = `${tagColor}40`
      elementStyle.style.transform = "scale(1)"
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
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    backdrop-filter: blur(4px);
  `
  
  const modalContent = document.createElement("div")
  modalContent.style.cssText = `
    background: white;
    padding: 28px;
    border-radius: 16px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
    max-width: 450px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    transform: scale(0.9);
    animation: modalAppear 0.3s ease forwards;
  `
  
  // Add animation keyframes
  const style = document.createElement("style")
  style.textContent = `
    @keyframes modalAppear {
      to {
        transform: scale(1);
      }
    }
  `
  document.head.appendChild(style)
  
  modalContent.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 700; color: #1a1a1a; display: flex; align-items: center; gap: 8px;">
        🤖 AI Tag Suggestion
        <span style="background: ${tagColor}30; color: ${tagColor}; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
          ${label}
        </span>
      </h3>
      <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.5;">
        AI classified this content with <strong>${(confidence * 100).toFixed(1)}% confidence</strong>
      </p>
    </div>
    
    <div style="margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 12px; border-left: 4px solid ${tagColor};">
      <p style="margin: 0; font-size: 14px; color: #495057; line-height: 1.5; font-style: italic;">
        "${text.slice(0, 200)}${text.length > 200 ? '...' : ''}"
      </p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 10px; font-weight: 600; color: #1a1a1a; font-size: 14px;">
        Tag someone:
      </label>
      <input 
        type="text" 
        id="tagxi-ai-username-input"
        placeholder="@username"
        style="width: 100%; padding: 12px 16px; border: 2px solid #e1e5e9; border-radius: 10px; font-size: 14px; outline: none; transition: all 0.2s; background: #fafbfc;"
      />
    </div>
    
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button 
        id="tagxi-ai-cancel-btn"
        style="padding: 10px 20px; border: 2px solid #e1e5e9; background: white; border-radius: 8px; cursor: pointer; font-size: 14px; color: #6c757d; transition: all 0.2s; font-weight: 500;"
      >
        Cancel
      </button>
      <button 
        id="tagxi-ai-tag-btn"
        style="padding: 10px 20px; border: none; background: linear-gradient(135deg, ${tagColor}, ${tagColor}dd); color: #000; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s; box-shadow: 0 2px 8px ${tagColor}40;"
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
  
  // Add enhanced input styling on focus
  input.addEventListener("focus", () => {
    input.style.borderColor = tagColor
    input.style.backgroundColor = "#ffffff"
    input.style.boxShadow = `0 0 0 3px ${tagColor}20`
  })
  
  input.addEventListener("blur", () => {
    input.style.borderColor = "#e1e5e9"
    input.style.backgroundColor = "#fafbfc"
    input.style.boxShadow = "none"
  })
  
  // Add enhanced button hover effects
  tagBtn.addEventListener("mouseenter", () => {
    tagBtn.style.transform = "translateY(-2px)"
    tagBtn.style.boxShadow = `0 4px 16px ${tagColor}60`
  })
  
  tagBtn.addEventListener("mouseleave", () => {
    tagBtn.style.transform = "translateY(0)"
    tagBtn.style.boxShadow = `0 2px 8px ${tagColor}40`
  })
  
  cancelBtn.addEventListener("mouseenter", () => {
    cancelBtn.style.backgroundColor = "#f8f9fa"
    cancelBtn.style.borderColor = "#adb5bd"
  })
  
  cancelBtn.addEventListener("mouseleave", () => {
    cancelBtn.style.backgroundColor = "white"
    cancelBtn.style.borderColor = "#e1e5e9"
  })
  
  const closeModal = () => {
    modal.style.opacity = "0"
    modalContent.style.transform = "scale(0.9)"
    setTimeout(() => {
      document.body.removeChild(modal)
      document.head.removeChild(style)
    }, 200)
  }
  
  const handleTag = async () => {
    const username = input.value.trim().replace(/^@/, "") // Remove @ if present
    
    if (!username) {
      input.style.borderColor = "#dc3545"
      input.style.boxShadow = "0 0 0 3px #dc354520"
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
        
        // Convert AI highlight to user highlight with enhanced styling
        const htmlElement = element as HTMLElement
        htmlElement.style.backgroundColor = tagColor
        htmlElement.style.border = `2px solid ${tagColor}`
        htmlElement.style.borderRadius = "6px"
        htmlElement.style.padding = "4px 6px"
        htmlElement.style.cursor = "pointer"
        htmlElement.style.transition = "all 0.3s ease"
        htmlElement.setAttribute("data-tagxi-tagged-by", username)
        
        // Add enhanced hover tooltip for the newly tagged content
        let tooltip: HTMLElement | null = null
        
        const createTooltip = () => {
          const tooltip = document.createElement("div")
          tooltip.className = "tagxi-hover-tooltip"
          tooltip.style.cssText = `
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.8));
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          `
          tooltip.textContent = `👤 Tagged by @${username}`
          
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
        
        htmlElement.addEventListener("mouseenter", () => {
          tooltip = createTooltip()
          htmlElement.appendChild(tooltip)
          htmlElement.style.transform = "scale(1.02)"
          requestAnimationFrame(() => {
            if (tooltip) tooltip.style.opacity = "1"
          })
        })
        
        htmlElement.addEventListener("mouseleave", () => {
          htmlElement.style.transform = "scale(1)"
          if (tooltip) {
            tooltip.style.opacity = "0"
            setTimeout(() => {
              if (tooltip && tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip)
              }
              tooltip = null
            }, 300)
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