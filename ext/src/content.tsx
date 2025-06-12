export {}

document.addEventListener("mouseup", () => {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) return

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()

  const existingIcon = document.getElementById("tagxi-icon")
  if (existingIcon) existingIcon.remove()

  const icon = document.createElement("div")
  icon.innerText = "🔖"
  icon.id = "tagxi-icon"
  Object.assign(icon.style, {
    position: "fixed",
    top: `${rect.top - 30}px`,
    left: `${rect.left}px`,
    zIndex: "999999",
    fontSize: "20px",
    background: "#fff",
    padding: "3px",
    borderRadius: "4px",
    cursor: "pointer",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
  })

  document.body.appendChild(icon)

  icon.onclick = () => {
    const existingInput = document.getElementById("tagxi-input")
    if (existingInput) existingInput.remove()

    const input = document.createElement("input")
    input.id = "tagxi-input"
    input.placeholder = "@username"
    Object.assign(input.style, {
      position: "fixed",
      top: `${rect.top - 60}px`,
      left: `${rect.left}px`,
      zIndex: "999999",
      fontSize: "14px",
      padding: "6px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      outline: "none"
    })

    document.body.appendChild(input)
    input.focus()

    input.onkeydown = async (e) => {
      if (e.key === "Enter") {
        const value = input.value
        if (!value) return
        const data = {
          url: window.location.href,
          selection: selection.toString(),
          tag: value,
          timestamp: Date.now()
        }

        chrome.runtime.sendMessage({
          name: "LOG_MESSAGE",
          body: `Saved tag: ${JSON.stringify(data)}`
        })
        icon.remove()
        input.remove()
      }
      if (e.key === "Escape") {
        input.remove()
      }
    }
  }
})