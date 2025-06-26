import React, { useEffect, useState } from "react"

type TagButtonProps = {
  position: { top: number; left: number }
  onClick: () => void
}

const TagButton: React.FC<TagButtonProps> = ({ position, onClick }) => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setShow(true))
  }, [])

  return (
    <button
      onClick={onClick}
      id="tagxi-icon"
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 999999
      }}
      className={`flex items-center bg-white border border-gray-300 rounded px-1 
        transition-all duration-75 ease-out 
        ${show ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`}>
      🔖
    </button>
  )
}

export default TagButton
