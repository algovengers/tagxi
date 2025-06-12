import { useEffect, useState } from "react"
import "~style.css"
function Popup() {
  const [currentTab, setCurrentTab] = useState("")

  async function getCurrentUrl() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    setCurrentTab(tab.url)
  }

  useEffect(() => {
    getCurrentUrl()
  }, [])

  return (
    <div style={{ width: "12rem" }}>
      <h2 className="text-red-400">Hello</h2>
      <h4>{currentTab}</h4>
    </div>
  )
}

export default Popup
