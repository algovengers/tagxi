import Avatar from "boring-avatars"
import TagxiHeroImage from "data-base64:assets/tagxi-hero.png"
import { BellIcon, ChevronRight } from "lucide-react"
import React from "react"

import { Card, getEllipsedText } from "~components/Card"
import InteractiveText from "~components/InteractiveText"
import { Stack } from "~components/Stack"

// Skeleton Loading Components
const SkeletonCard = () => (
  <Card className="w-24 animate-pulse">
    <div className="p-3 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      <div className="h-2 bg-gray-200 rounded w-full"></div>
      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
      <div className="h-2 bg-gray-200 rounded w-1/3 mt-2"></div>
    </div>
  </Card>
)

const SkeletonCollectibleCard = () => (
  <Card className="w-24 animate-pulse">
    <div className="bg-gray-200 h-16 w-full rounded-t"></div>
    <div className="p-2">
      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
    </div>
  </Card>
)

// Type definitions
interface Tag {
  id: number
  content: string
  by: string
  time: string
}

interface Collectible {
  id: number
  name: string
  image: string
}

interface UserStats {
  tagsMade: number
  tagsReceived: number
}

interface HomeProps {
  username: string
  userStats: UserStats
  recentTags: Tag[]
  collectibles: Collectible[]
  onNotificationClick?: () => void
  onProfileClick?: () => void
  onTagsPageClick?: () => void
  onMemoriesPageClick?: () => void
  onTagClick?: (tag: Tag) => void
  onCollectibleClick?: (collectible: Collectible) => void
}

const Home: React.FC<HomeProps> = ({
  username,
  userStats,
  recentTags,
  collectibles,
  onNotificationClick,
  onProfileClick,
  onTagsPageClick,
  onMemoriesPageClick,
  onTagClick,
  onCollectibleClick
}) => {
  const handleTagsPageClick = () => {
    if (onTagsPageClick) {
      onTagsPageClick()
    } else {
      chrome.tabs.create({ url: "https://tagxi.xyz/page-tags" })
    }
  }

  const handleMemoriesPageClick = () => {
    if (onMemoriesPageClick) {
      onMemoriesPageClick()
    } else {
      chrome.tabs.create({ url: "https://tagxi.xyz/memories" })
    }
  }

  return (
    <div className="w-[22rem] pb-2 bg-gradient-to-tr from-[#f9fbfc] to-[#f9fbfc] overflow-hidden font-sans relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 p-4">
        <span className="font-bold text-xl text-gray-800">TagXi</span>

        <div className="flex gap-2 items-center">
          <button 
            className="bg-white hover:bg-gray-100 rounded-full p-2 shadow-sm"
            onClick={onNotificationClick}
          >
            <BellIcon color="black" size={18} />
          </button>
          <button 
            className="bg-white hover:bg-gray-100 rounded-full p-2 shadow-sm"
            onClick={onProfileClick}
          >
            <Avatar name="arnab" size={18} />
          </button>
        </div>
      </div>

      <div className="-mt-8 flex justify-center items-center">
        <div className="flex flex-col justify-center items-center gap-2">
          <img
            src={TagxiHeroImage}
            alt="tagxi-hero-image"
            className="w-[5.5rem] aspect-9/11"
          />

          <InteractiveText
            text={getEllipsedText(username, "MIDDLE")}
            alternateTextToCopy={username}
          />
        </div>
      </div>

      {/* Tag Stats */}
      <div className="flex justify-around text-sm my-4">
        <div className="text-center">
          <p className="text-gray-500">Tags Made</p>
          <p className="font-bold text-gray-800">{userStats.tagsMade}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Tags Received</p>
          <p className="font-bold text-gray-800">{userStats.tagsReceived}</p>
        </div>
      </div>

      <div className="px-4 mt-6">
        <Stack.Header
          title="Tags on this Page"
          action={
            <button
              onClick={handleTagsPageClick}
              className="p-1 rounded-full hover:bg-gray-100">
              <ChevronRight size={16} />
            </button>
          }
        />

        <Stack>
          {recentTags.length > 0 ? (
            recentTags.map((tag) => (
              <Card
                key={tag.id}
                className="w-24 cursor-pointer hover:bg-gray-100"
              >
                <Card.Header
                  name={tag.by}
                  title={getEllipsedText(tag.by, "MIDDLE")}
                />
                <Card.Body>{getEllipsedText(tag.content, "LAST")}</Card.Body>
                <Card.Footer>{tag.time}</Card.Footer>
              </Card>
            ))
          ) : (
            // Show skeleton loading for tags
            Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCard key={`tag-skeleton-${index}`} />
            ))
          )}
        </Stack>
      </div>

      <div className="px-4 mt-6">
        <Stack.Header
          title="Memories"
          action={
            <button
              onClick={handleMemoriesPageClick}
              className="p-1 rounded-full hover:bg-gray-100">
              <ChevronRight size={16} />
            </button>
          }
        />

        <Stack>
          {collectibles.length > 0 ? (
            collectibles.map((item) => (
              <Card
                key={item.id}
                className="w-24 cursor-pointer hover:bg-gray-100"
              >
                <Card.ImageCover src={item.image} alt={item.name} />
                <Card.Footer>
                  <div className="flex items-center gap-1 mt-1">
                    <p className="text-[10px] text-gray-600 truncate">
                      {item.name}
                    </p>
                  </div>
                </Card.Footer>
              </Card>
            ))
          ) : (
            // Show skeleton loading for collectibles
            Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCollectibleCard key={`collectible-skeleton-${index}`} />
            ))
          )}
        </Stack>
      </div>
    </div>
  )
}

export default Home