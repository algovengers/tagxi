import React from "react"

type TagButtonProps = {
  position: { top: number; left: number }
  onClick: () => void
}

const TagButton: React.FC<TagButtonProps> = ({ position, onClick }) => {

  return (
    <button
      onClick={onClick}
      id="tagxi-icon"
      style={{
        position: "relative",
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 999999
      }}
      className="text-xl bg-white p-1 rounded cursor-pointer shadow"
    >
      🔖
    </button>
  )
}

export default TagButton
