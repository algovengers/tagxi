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
  const [currentTag, setCurrentTag] = useState<{
    start: number
    end: number
    query: string
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isSelectingRef = useRef(false) // Track if we're in the middle of selecting

  // Function to find the current @ tag being typed
  const findCurrentTag = (text: string, cursorPos: number) => {
    let atIndex = -1
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (text[i] === "@") {
        atIndex = i
        break
      }
      if (text[i] === " ") {
        break // Space before @ means we're not in a tag
      }
    }

    if (atIndex === -1) return null

    let endIndex = text.length
    for (let i = atIndex + 1; i < text.length; i++) {
      if (text[i] === " ") {
        endIndex = i
        break
      }
    }

    const tagContent = text.slice(atIndex + 1, endIndex)

    return {
      start: atIndex,
      end: endIndex,
      query: tagContent
    }
  }

  // Function to find all complete @ tags in the message
  const findAllTags = (text: string) => {
    const tags: string[] = []
    const regex = /@(\w+)/g
    let match

    while ((match = regex.exec(text)) !== null) {
      tags.push(match[1]) // Push username without @
    }

    return tags
  }

  // Function to check if message has at least one complete friend tag
  const hasValidFriendTag = (text: string) => {
    const allTags = findAllTags(text)
    const friendUsernames = friends.map((f) => f.username)
    return allTags.some((tag) => friendUsernames.includes(tag))
  }

  // Filter friends when input changes
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus()
    }

    const cursorPos = inputRef.current?.selectionStart || inputValue.length
    const tag = findCurrentTag(inputValue, cursorPos)
    setCurrentTag(tag)

    if (tag && tag.query.length > 0 && !selectedFriend) {
      // Get already tagged friends to exclude them
      const alreadyTagged = findAllTags(inputValue)

      // Filter friends based on the tag query and exclude already tagged friends
      const query = tag.query.toLowerCase()
      const filtered = friends.filter(
        (friend) =>
          !alreadyTagged.includes(friend.username) && // Exclude already tagged friends
          (friend.username.toLowerCase().includes(query) ||
            (friend.name && friend.name.toLowerCase().includes(query)))
      )
      setFilteredFriends(filtered)
      setShowDropdown(filtered.length > 0)
    } else {
      // Hide dropdown when not in a tag or friend is selected
      setShowDropdown(false)
      setFilteredFriends([])
    }
    setSelectedIndex(-1)
  }, [inputValue, friends, disabled, selectedFriend])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // Clear selected friend when user types
    if (selectedFriend) {
      setSelectedFriend(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown && filteredFriends.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredFriends.length - 1 ? prev + 1 : 0
        )
        return
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) =>
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
    if (!currentTag) return

    // Set flag to prevent blur from closing dropdown
    isSelectingRef.current = true

    // Replace the current tag with the selected friend's username
    const newValue =
      inputValue.slice(0, currentTag.start + 1) + // Keep text before @ and the @
      friend.username + // Insert friend's username
      inputValue.slice(currentTag.end) // Keep text after the tag

    setSelectedFriend(friend)
    setInputValue(newValue)
    setShowDropdown(false)
    setSelectedIndex(-1)

    // Set cursor position after the inserted username
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = currentTag.start + 1 + friend.username.length
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
        inputRef.current.focus()
      }
      isSelectingRef.current = false
    }, 10)
  }

  const handleSendTag = () => {
    if (inputValue.trim()) {
      // Create synthetic event to send the current message
      setTimeout(() => {
        if (inputRef.current) {
          const event = new KeyboardEvent("keydown", {
            key: "Enter",
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
            key: "Enter"
          }

          onKeyDown(syntheticEvent as React.KeyboardEvent<HTMLInputElement>)
        }
      }, 50)
    }
  }

  const handleInputFocus = () => {
    // Check if we're currently in a tag when focusing
    const cursorPos = inputRef.current?.selectionStart || inputValue.length
    const tag = findCurrentTag(inputValue, cursorPos)
    if (tag && tag.query.length > 0) {
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
      if (
        !dropdownRef.current?.contains(activeElement) &&
        !isSelectingRef.current
      ) {
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

  // Handle cursor movement to detect if we're in a tag
  const handleInputClick = () => {
    setTimeout(() => {
      const cursorPos = inputRef.current?.selectionStart || inputValue.length
      const tag = findCurrentTag(inputValue, cursorPos)
      setCurrentTag(tag)

      if (tag && tag.query.length > 0) {
        // Get already tagged friends to exclude them
        const alreadyTagged = findAllTags(inputValue)

        // Filter friends for this tag and exclude already tagged friends
        const query = tag.query.toLowerCase()
        const filtered = friends.filter(
          (friend) =>
            !alreadyTagged.includes(friend.username) && // Exclude already tagged friends
            (friend.username.toLowerCase().includes(query) ||
              (friend.name && friend.name.toLowerCase().includes(query)))
        )
        setFilteredFriends(filtered)
        setShowDropdown(filtered.length > 0)
      } else {
        setShowDropdown(false)
      }
    }, 10)
  }

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[1]?.children[
        selectedIndex
      ] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
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
          {disabled ? "⏳" : "💬"}
        </div>
        <input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onClick={handleInputClick}
          onKeyUp={handleInputClick} // Also handle key movements
          placeholder={
            disabled
              ? "Saving..."
              : "Type your message... use @username to tag (required)"
          }
          disabled={disabled}
          className="text-sm text-black bg-white py-1 px-2 focus:outline-none w-64 disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Tag requirement indicator */}
        {inputValue.trim() && !hasValidFriendTag(inputValue) && (
          <div className="text-xs text-red-500 ml-1 px-1 flex items-center">
            ⚠️
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSendTag}
          disabled={
            disabled || !inputValue.trim() || !hasValidFriendTag(inputValue)
          }
          className="ml-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title={
            !inputValue.trim()
              ? "Type a message"
              : !hasValidFriendTag(inputValue)
                ? "Add at least one friend tag (@username)"
                : "Send message"
          }>
          ➤
        </button>

        {/* Friends count indicator - only show when in a tag */}
        {friends.length > 0 && !disabled && currentTag && (
          <div className="text-xs text-gray-400 ml-1 px-1">
            {friends.length}👥
          </div>
        )}
      </div>

      {/* Friends Dropdown */}
      {showDropdown && !disabled && currentTag && (
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
                👥 Tag: "{currentTag.query}"
              </span>
              <span className="text-xs text-gray-500">Click to select</span>
            </div>
          </div>

          {/* Friends List */}
          {filteredFriends.length > 0 ? (
            <div className="py-1">
              {filteredFriends.map((friend, index) => (
                <div
                  key={friend.username}
                  onClick={(e) => {
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
                      @{friend.username}
                    </div>
                    {friend.name && (
                      <div className="text-xs text-gray-500 truncate">
                        {friend.name}
                      </div>
                    )}
                  </div>

                  {/* Selection Indicator */}
                  <div
                    className={`flex-shrink-0 transition-all duration-200 ${
                      index === selectedIndex
                        ? "opacity-100 transform scale-110"
                        : "opacity-0 group-hover:opacity-60"
                    }`}>
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-6 text-center text-gray-500 text-sm">
              <div className="mb-3">
                <svg
                  className="w-12 h-12 mx-auto text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div className="font-medium">
                No friends match "{currentTag.query}"
              </div>
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
                  <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                    ↑↓
                  </kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.121 2.122"
                    />
                  </svg>
                  Click to select
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TagInput
