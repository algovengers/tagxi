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
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isSelectingRef = useRef(false) // Track if we're in the middle of selecting

  // Filter friends when input changes
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus()
    }

    if (inputValue.trim() === "" && !selectedFriend) {
      // Show all friends when input is empty and no friend selected
      setFilteredFriends(friends)
      setShowDropdown(friends.length > 0)
    } else if (!selectedFriend) {
      // Filter friends based on input only if no friend is selected
      const query = inputValue.replace(/^@/, "").toLowerCase()
      const filtered = friends.filter(friend => 
        friend.username.toLowerCase().includes(query) ||
        (friend.name && friend.name.toLowerCase().includes(query))
      )
      setFilteredFriends(filtered)
      setShowDropdown(filtered.length > 0)
    } else {
      // Hide dropdown when friend is selected
      setShowDropdown(false)
    }
    setSelectedIndex(-1)
  }, [inputValue, friends, disabled, selectedFriend])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    // Clear selected friend if user starts typing again
    if (selectedFriend && value !== selectedFriend.username) {
      setSelectedFriend(null)
    }
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
      
      if (e.key === "Escape") {
        setShowDropdown(false)
        setSelectedIndex(-1)
        return
      }
      
      if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault()
        selectFriend(filteredFriends[selectedIndex])
        return
      }
    }
    
    // Pass through to parent handler for Enter key and other keys
    onKeyDown(e)
  }

  const selectFriend = (friend: Friend) => {
    // Set flag to prevent blur from closing dropdown
    isSelectingRef.current = true
    
    setSelectedFriend(friend)
    setInputValue(friend.username) // Show username without @
    setShowDropdown(false)
    setSelectedIndex(-1)
    
    // Focus back to input
    inputRef.current?.focus()
    
    // Reset the selecting flag after a short delay
    setTimeout(() => {
      isSelectingRef.current = false
    }, 100)
  }

  const handleSendTag = () => {
    if (selectedFriend || inputValue.trim()) {
      // Create a synthetic Enter key event to trigger tagging
      const username = selectedFriend ? selectedFriend.username : inputValue.trim()
      
      // Update input value to ensure it has the correct username
      setInputValue(username)
      
      // Create synthetic event
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
      }, 50)
    }
  }

  const handleInputFocus = () => {
    if (!selectedFriend && (friends.length > 0 || inputValue.trim())) {
      setShowDropdown(true)
    }
  }

  const handleInputBlur = (e: React.FocusEvent) => {
    // Don't close dropdown if we're in the middle of selecting a friend
    if (isSelectingRef.current) {
      return
    }
    
    // Delay hiding dropdown to allow clicks on dropdown items
    setTimeout(() => {
      // Check if the newly focused element is within our dropdown
      const activeElement = document.activeElement
      if (!dropdownRef.current?.contains(activeElement) && !isSelectingRef.current) {
        setShowDropdown(false)
        setSelectedIndex(-1)
      }
    }, 150)
  }

  // Handle mouse down on dropdown to prevent blur
  const handleDropdownMouseDown = (e: React.MouseEvent) => {
    // Prevent the input from losing focus when clicking on dropdown
    e.preventDefault()
  }

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[1]?.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }
    }
  }, [selectedIndex])

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
          placeholder={disabled ? "Saving..." : selectedFriend ? selectedFriend.username : "username"}
          disabled={disabled}
          className="text-sm text-black bg-white py-1 px-2 focus:outline-none w-40 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        {/* Send Button */}
        <button
          onClick={handleSendTag}
          disabled={disabled || (!selectedFriend && !inputValue.trim())}
          className="ml-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Send tag"
        >
          ➤
        </button>
        
        {/* Friends count indicator */}
        {friends.length > 0 && !disabled && !selectedFriend && (
          <div className="text-xs text-gray-400 ml-1 px-1">
            {friends.length}👥
          </div>
        )}
      </div>

      {/* Friends Dropdown */}
      {showDropdown && !disabled && !selectedFriend && (
        <div
          ref={dropdownRef}
          onMouseDown={handleDropdownMouseDown} // Prevent blur when clicking dropdown
          style={{
            position: "fixed",
            top: `${position.top + 35}px`,
            left: `${position.left}px`,
            zIndex: 999998
          }}
          className="bg-white border border-gray-300 rounded-lg shadow-xl max-h-64 overflow-y-auto w-64">
          
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 sticky top-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                👥 {inputValue.trim() ? `Search: "${inputValue.replace(/^@/, "")}"` : "Your Friends"}
              </span>
              <span className="text-xs text-gray-500">
                Click to select
              </span>
            </div>
          </div>

          {/* Friends List */}
          {filteredFriends.length > 0 ? (
            <div className="py-1">
              {filteredFriends.map((friend, index) => (
                <div
                  key={friend.username}
                  onMouseDown={(e) => {
                    // Prevent blur and handle selection
                    e.preventDefault()
                    selectFriend(friend)
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-3 py-2 cursor-pointer transition-all duration-150 flex items-center gap-3 group ${
                    index === selectedIndex 
                      ? "bg-blue-50 border-r-2 border-blue-500 transform scale-[1.02]" 
                      : "hover:bg-gray-50 hover:transform hover:scale-[1.01]"
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
                      {friend.username}
                    </div>
                    {friend.name && (
                      <div className="text-xs text-gray-500 truncate">
                        {friend.name}
                      </div>
                    )}
                  </div>
                  
                  {/* Selection Indicator */}
                  <div className={`flex-shrink-0 transition-all duration-200 ${
                    index === selectedIndex 
                      ? "opacity-100 transform scale-110" 
                      : "opacity-0 group-hover:opacity-60"
                  }`}>
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : friends.length === 0 ? (
            <div className="px-3 py-6 text-center text-gray-500 text-sm">
              <div className="mb-3">
                <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="font-medium">No friends found</div>
              <div className="text-xs text-gray-400 mt-1">
                Add friends to see them here
              </div>
            </div>
          ) : (
            <div className="px-3 py-6 text-center text-gray-500 text-sm">
              <div className="mb-3">
                <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="font-medium">No friends match "{inputValue.replace(/^@/, "")}"</div>
              <div className="text-xs text-gray-400 mt-1">
                Try a different search term
              </div>
            </div>
          )}

          {/* Footer */}
          {filteredFriends.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 sticky bottom-0">
              <div className="text-xs text-gray-500 text-center flex items-center justify-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.121 2.122" />
                  </svg>
                  Click to select
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Friend Indicator */}
      {selectedFriend && (
        <div
          style={{
            position: "fixed",
            top: `${position.top + 35}px`,
            left: `${position.left}px`,
            zIndex: 999998
          }}
          className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-3 w-64">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {selectedFriend.image ? (
                <img
                  src={selectedFriend.image}
                  alt={selectedFriend.username}
                  className="w-8 h-8 rounded-full object-cover border border-green-300"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {selectedFriend.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-green-900 text-sm">
                Selected: {selectedFriend.username}
              </div>
              {selectedFriend.name && (
                <div className="text-xs text-green-700">
                  {selectedFriend.name}
                </div>
              )}
            </div>
            
            {/* Clear Selection */}
            <button
              onClick={() => {
                setSelectedFriend(null)
                setInputValue("")
                inputRef.current?.focus()
              }}
              className="flex-shrink-0 text-green-600 hover:text-green-800 transition-colors"
              title="Clear selection"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TagInput