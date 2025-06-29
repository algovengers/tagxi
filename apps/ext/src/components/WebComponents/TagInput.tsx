import React, { useEffect, useRef, useState } from "react"

type Friend = {
  username: string
  name: string | null
  image: string | null
}

type TagInputProps = {
  position: { top: number; left: number }
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  disabled?: boolean
  friends?: Friend[] // Pre-loaded friends list
}

const TagInput: React.FC<TagInputProps> = ({
  position,
  onKeyDown,
  disabled = false,
  friends = []
}) => {
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([])
  const [inputValue, setInputValue] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter friends when input changes
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus()
    }

    if (inputValue.trim() === "") {
      // Show all friends when input is empty
      setFilteredFriends(friends)
      setShowDropdown(friends.length > 0)
    } else {
      // Filter friends based on input
      const query = inputValue.replace(/^@/, "").toLowerCase()
      const filtered = friends.filter(friend => 
        friend.username.toLowerCase().includes(query) ||
        (friend.name && friend.name.toLowerCase().includes(query))
      )
      setFilteredFriends(filtered)
      setShowDropdown(filtered.length > 0)
    }
    setSelectedIndex(-1)
  }, [inputValue, friends, disabled])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown && filteredFriends.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredFriends.length - 1 ? prev + 1 : 0
        )
        return
      }
      
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredFriends.length - 1
        )
        return
      }
      
      if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault()
        selectFriend(filteredFriends[selectedIndex])
        return
      }
      
      if (e.key === "Escape") {
        setShowDropdown(false)
        setSelectedIndex(-1)
        return
      }
    }
    
    // Pass through to parent handler
    onKeyDown(e)
  }

  const selectFriend = (friend: Friend) => {
    const username = `@${friend.username}`
    setInputValue(username)
    setShowDropdown(false)
    setSelectedIndex(-1)
    
    // Copy to clipboard
    navigator.clipboard.writeText(username).then(() => {
      console.log("✅ Username copied to clipboard:", username)
      
      // Show a brief visual feedback
      const input = inputRef.current
      if (input) {
        const originalBorder = input.style.border
        input.style.border = "2px solid #10b981"
        setTimeout(() => {
          input.style.border = originalBorder
        }, 500)
      }
    }).catch(err => {
      console.error("❌ Failed to copy username:", err)
    })
    
    // Focus back to input
    inputRef.current?.focus()
    
    // Create a synthetic event to trigger the parent's onKeyDown with Enter
    setTimeout(() => {
      if (inputRef.current) {
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true
        }) as any
        
        // Create a React synthetic event
        const syntheticEvent = {
          ...event,
          currentTarget: inputRef.current,
          target: inputRef.current,
          preventDefault: () => event.preventDefault(),
          stopPropagation: () => event.stopPropagation(),
          key: 'Enter'
        }
        
        onKeyDown(syntheticEvent as React.KeyboardEvent<HTMLInputElement>)
      }
    }, 100)
  }

  const handleInputFocus = () => {
    if (friends.length > 0 || inputValue.trim()) {
      setShowDropdown(true)
    }
  }

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay hiding dropdown to allow clicks on dropdown items
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setShowDropdown(false)
        setSelectedIndex(-1)
      }
    }, 150)
  }

  return (
    <div className="flex flex-col bg-white relative">
      <div
        style={{
          position: "fixed",
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 999999
        }}
        className="flex items-center bg-white border border-gray-300 rounded px-1 shadow-lg">
        <div className="text-xl text-gray-600 mr-1">
          {disabled ? "⏳" : "🔖"}
        </div>
        <input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={disabled ? "Saving..." : "@username"}
          disabled={disabled}
          className="text-sm text-black bg-white py-1 px-2 focus:outline-none w-48 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        {/* Friends count indicator */}
        {friends.length > 0 && !disabled && (
          <div className="text-xs text-gray-400 ml-1 px-1">
            {friends.length}👥
          </div>
        )}
      </div>

      {/* Friends Dropdown */}
      {showDropdown && !disabled && (
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: `${position.top + 35}px`,
            left: `${position.left}px`,
            zIndex: 999998
          }}
          className="bg-white border border-gray-300 rounded-lg shadow-xl max-h-64 overflow-y-auto w-64">
          
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                👥 {inputValue.trim() ? `Search: "${inputValue.replace(/^@/, "")}"` : "Your Friends"}
              </span>
            </div>
          </div>

          {/* Friends List */}
          {filteredFriends.length > 0 ? (
            <div className="py-1">
              {filteredFriends.map((friend, index) => (
                <div
                  key={friend.username}
                  onClick={() => selectFriend(friend)}
                  className={`px-3 py-2 cursor-pointer transition-colors duration-150 flex items-center gap-3 group ${
                    index === selectedIndex 
                      ? "bg-blue-50 border-r-2 border-blue-500" 
                      : "hover:bg-gray-50"
                  }`}>
                  
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {friend.image ? (
                      <img
                        src={friend.image}
                        alt={friend.username}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      @{friend.username}
                    </div>
                    {friend.name && (
                      <div className="text-xs text-gray-500 truncate">
                        {friend.name}
                      </div>
                    )}
                  </div>
                  
                  {/* Copy Icon */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : friends.length === 0 ? (
            <div className="px-3 py-4 text-center text-gray-500 text-sm">
              <div className="mb-2">👥</div>
              <div>No friends found</div>
              <div className="text-xs text-gray-400 mt-1">
                Add friends to see them here
              </div>
            </div>
          ) : (
            <div className="px-3 py-4 text-center text-gray-500 text-sm">
              <div className="mb-2">🔍</div>
              <div>No friends match "{inputValue.replace(/^@/, "")}"</div>
              <div className="text-xs text-gray-400 mt-1">
                Try a different search term
              </div>
            </div>
          )}

          {/* Footer */}
          {filteredFriends.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-500 text-center">
                ↑↓ Navigate • Enter to select • Click to copy
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TagInput