import React, { useEffect, useRef } from "react"

type TagInputProps = {
  position: { top: number; left: number }
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  disabled?: boolean
}

const TagInput: React.FC<TagInputProps> = ({ position, onKeyDown, disabled = false }) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus()
    }
  }, [disabled])

  return (
    <div
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 999999
      }}
      className="flex items-center bg-white border border-gray-300 rounded px-1">
      <div className="text-xl text-gray-600 mr-1">
        {disabled ? "⏳" : "🔖"}
      </div>
      <input
        ref={inputRef}
        placeholder={disabled ? "Saving..." : "@username"}
        onKeyDown={onKeyDown}
        disabled={disabled}
        className="text-sm text-black bg-white py-1 px-2 focus:outline-none w-48 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  )
}

export default TagInput