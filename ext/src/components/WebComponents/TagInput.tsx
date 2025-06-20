import React, { useEffect, useRef } from "react"

import "~style.css"

type TagInputProps = {
  position: { top: number; left: number }
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

const TagInput: React.FC<TagInputProps> = ({ position, onKeyDown }) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div
      style={{
        position: "relative",
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 999999
      }}
      className="flex items-center bg-white border border-gray-300 rounded px-1">
      <div className="text-xl text-gray-600 mr-1">🔖</div>
      <input
        ref={inputRef}
        placeholder="@username"
        onKeyDown={onKeyDown}
        className="text-sm text-black bg-white py-1 px-2 focus:outline-none w-48"
      />
    </div>
  )
}

export default TagInput