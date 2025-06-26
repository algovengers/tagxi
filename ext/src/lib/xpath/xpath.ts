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
  color = "yellow"
) => {
  const textNode = element as Text
  const before = textNode.splitText(start)
  before.splitText(end - start)
  const wrapper = document.createElement("mark")
  wrapper.style.backgroundColor = color
  wrapper.textContent = before.textContent
  before.replaceWith(wrapper)
}

const selectAndHighlightImage = (element: Node) => {
  if (
    element &&
    element.nodeType === Node.ELEMENT_NODE &&
    (element as HTMLElement).tagName === "IMG"
  ) {
    const img = element as HTMLImageElement
    img.style.border = "3px solid red"
    img.style.borderRadius = "4px"
  }
}

export const selectAndHighlightElement = (
  xpath: string,
  startOffset: number,
  endOffset?: number
) => {
  const element = getElementFromXpath(xpath)

  if (!element) return
  if (element.nodeType === Node.TEXT_NODE) {
    if (typeof startOffset === "number" && typeof endOffset === "number") {
      selectAndHighlightText(element, startOffset, endOffset)
    } else {
      const textContentLength = element.textContent?.length
        ? element.textContent.length
        : 0
      selectAndHighlightText(element, startOffset, textContentLength)
    }
  } else if (
    element.nodeType === Node.ELEMENT_NODE &&
    (element as HTMLElement).tagName === "IMG"
  ) {
    selectAndHighlightImage(element)
  } else if (element.nodeType === Node.ELEMENT_NODE) {
    ;(element as HTMLElement).style.outline = "2px dashed blue"
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
