"use client";
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Search, X, User, Loader2, Users, Star } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SearchResult {
  username: string;
  name: string | null;
  image: string | null;
  areFriends: boolean;
}

interface CacheEntry {
  data: SearchResult[];
  timestamp: number;
}

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const requestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const router = useRouter();
  const trpc = useTRPC();
  const [results, setResults] = useState<SearchResult[]>([]);

  // Cache management
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const MAX_CACHE_SIZE = 50;

  const getCachedResults = useCallback(
    (searchQuery: string): SearchResult[] | null => {
      const cached = cacheRef.current.get(searchQuery.toLowerCase());
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
      return null;
    },
    []
  );

  const setCachedResults = useCallback(
    (searchQuery: string, data: SearchResult[]) => {
      // Implement LRU cache
      if (cacheRef.current.size >= MAX_CACHE_SIZE) {
        const firstKey = cacheRef.current.keys().next().value;
        cacheRef.current.delete(firstKey);
      }
      cacheRef.current.set(searchQuery.toLowerCase(), {
        data,
        timestamp: Date.now(),
      });
    },
    []
  );

  const { mutate, isError } = useMutation(
    trpc.search.mutationOptions({
      onSuccess(data, variables) {
        // Prevent race condition by checking if this is still the relevant query
        const isCurrentQuery =
          variables.query.toLowerCase() === query.toLowerCase();
        if (isCurrentQuery) {
          setResults(data);
          setCachedResults(variables.query, data);
          setIsOpen(data.length > 0 || variables.query.length > 0);
          setIsLoading(false);
        }
      },
      onError(error, variables) {
        // Only update state if this is still the relevant query
        const isCurrentQuery =
          variables.query.toLowerCase() === query.toLowerCase();
        if (isCurrentQuery) {
          setIsLoading(false);
          setResults([]);
          setIsOpen(true);
        }
      },
    })
  );

  // Enhanced search with race condition protection
  const performSearch = useCallback(
    (searchQuery: string) => {
      // Generate unique request ID to prevent race conditions
      const currentRequestId = ++requestIdRef.current;

      if (searchQuery.trim() === "") {
        setResults([]);
        setIsOpen(false);
        setIsLoading(false);
        return;
      }

      // Check cache first
      const cached = getCachedResults(searchQuery);
      if (cached) {
        setResults(cached);
        setIsOpen(cached.length > 0 || searchQuery.length > 0);
        setIsLoading(false);
        return;
      }

      // Show loading immediately
      setIsLoading(true);
      setIsOpen(true);

      // Clear previous timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Debounced API call with race condition protection
      debounceRef.current = setTimeout(() => {
        // Double-check if this is still the current request
        if (currentRequestId === requestIdRef.current) {
          mutate({ query: searchQuery });
        }
      }, 200);
    },
    [mutate, getCachedResults]
  );

  // Handle input changes with immediate visual feedback
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      setHasInteracted(true);

      // Immediate UI feedback
      if (value.length > 0) {
        setIsLoading(true);
        setIsOpen(true);
      }

      performSearch(value);
    },
    [performSearch]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => {
            const maxIndex = results.length - 1;
            return prev < maxIndex ? prev + 1 : 0;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => {
            const maxIndex = results.length - 1;
            return prev > 0 ? prev - 1 : maxIndex;
          });
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleUserSelect(results[selectedIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, results, selectedIndex]
  );

  const handleUserSelect = useCallback(
    (user: SearchResult) => {
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();

      router.push(`/u/${user.username}`);
    },
    [router]
  );

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    setHasInteracted(false);
    inputRef.current?.focus();
  }, []);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup timeouts and abort controllers
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoized search state
  const searchState = useMemo(() => {
    if (isLoading) return "loading";
    if (isError) return "error";
    if (query.length === 0) return "empty";
    if (results.length === 0 && hasInteracted) return "no-results";
    return "results";
  }, [isLoading, isError, query.length, results.length, hasInteracted]);

  // Separate friends and non-friends for better UX
  const { friends, nonFriends } = useMemo(() => {
    const friends = results.filter((user) => user.areFriends);
    const nonFriends = results.filter((user) => !user.areFriends);
    return { friends, nonFriends };
  }, [results]);

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Search Input with enhanced styling */}
      <div className="relative">
        <div
          className={cn(
            "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200",
            isFocused ? "text-blue-500" : "text-gray-400"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </div>

        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            if (query.length > 0) setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          placeholder="Search people..."
          className={cn(
            "w-full pl-12 pr-12 py-3 text-sm transition-all duration-200 ease-in-out",
            "bg-white border border-gray-200 rounded-xl",
            "placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/10",
            "hover:border-gray-300 hover:shadow-sm",
            isFocused &&
              "ring-2 ring-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/10"
          )}
          aria-label="Search users"
        />

        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Enhanced Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-96 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
          {searchState === "loading" && (
            <div className="p-6 text-center">
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Searching...</span>
              </div>
            </div>
          )}

          {searchState === "error" && (
            <div className="p-6 text-center text-red-500">
              <p className="text-sm">Something went wrong. Please try again.</p>
            </div>
          )}

          {searchState === "empty" && (
            <div className="p-6 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium mb-1">Start typing to search</p>
              <p className="text-xs text-gray-400">
                Find people by their username
              </p>
            </div>
          )}

          {searchState === "no-results" && (
            <div className="p-6 text-center text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium mb-1">No users found</p>
              <p className="text-xs text-gray-400">
                Try a different search term
              </p>
            </div>
          )}

          {searchState === "results" && (
            <div className="py-2 max-h-96 overflow-y-auto">
              {/* Friends Section */}
              {friends.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    Friends
                  </div>
                  {friends.map((user, index) => (
                    <UserResultItem
                      key={`friend-${user.username}`}
                      user={user}
                      index={index}
                      isSelected={index === selectedIndex}
                      onClick={() => handleUserSelect(user)}
                    />
                  ))}
                </>
              )}

              {/* Non-Friends Section */}
              {nonFriends.length > 0 && (
                <>
                  {friends.length > 0 && (
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      Other Users
                    </div>
                  )}
                  {nonFriends.map((user, index) => (
                    <UserResultItem
                      key={`user-${user.username}`}
                      user={user}
                      index={friends.length + index}
                      isSelected={friends.length + index === selectedIndex}
                      onClick={() => handleUserSelect(user)}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Separate component for user result items
const UserResultItem: React.FC<{
  user: SearchResult;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}> = ({ user, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-4 py-3 text-left transition-all duration-150 ease-in-out",
        "hover:bg-gray-50 focus:outline-none focus:bg-gray-50",
        isSelected && "bg-blue-50 border-r-2 border-blue-500"
      )}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 relative">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || user.username}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
              width={40}
              height={40}
            />
          ) : (
            <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center ring-2 ring-white">
              <User className="h-5 w-5 text-white" />
            </div>
          )}
          {user.areFriends && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
              <Star className="h-2 w-2 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {user.name || user.username}
          </p>
          <p className="text-xs text-gray-500 truncate">@{user.username}</p>
        </div>

        {user.areFriends && (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              Friend
            </span>
          </div>
        )}
      </div>
    </button>
  );
};

export default SearchBar;
