import React, { useState } from "react"

import "~style.css"

import Avatar from "boring-avatars"
import TagxiHeroImage from "data-base64:assets/tagxi-hero.png"
import {
  ArrowUpDown,
  BellIcon,
  ChevronRight,
  CopyCheckIcon,
  CopyIcon,
  Download,
  Send
} from "lucide-react"

const username = "@arnab20k"
const tagsMade = 2000
const tagsReceived = 1450

const recentTags = [
  { id: 1, content: "Loved this API snippet!", by: "Sara", site: "dev.to" },
  { id: 2, content: "Bookmark this docs line", by: "Me", site: "notion.so" },
  { id: 3, content: "Check this bugfix idea", by: "Ravi", site: "github.com" }
]

const collectibles = [
  { id: 1, name: "Tag of the Month", icon: "🏆" },
  { id: 2, name: "First Tag", icon: "🎉" },
  { id: 3, name: "React Pro", icon: "⚛️" }
]

const Popup = () => {
  const [copiedUsername, setUsernameCopied] = useState(false)

  const handleUsernameCopy = () => {
    navigator.clipboard.writeText(username)
    setUsernameCopied(true)
    setTimeout(() => setUsernameCopied(false), 2000)
  }

  return (
    <div className="w-[22rem] bg-gradient-to-tr from-[#f9fbfc] to-[#f9fbfc] overflow-hidden font-sans relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 p-4">
        <span className="font-bold text-xl text-gray-800">TagXi</span>

        <div className="flex gap-2 items-center">
          <button className="bg-white hover:bg-gray-100 rounded-full p-2 shadow-sm">
            <BellIcon color="black" size={18} />
          </button>
          <button className="bg-white hover:bg-gray-100 rounded-full p-2 shadow-sm">
            <Avatar name="arnab" size={18} />
          </button>
        </div>
      </div>

      {/* Avatar & Username */}
      <div className="-mt-8 flex justify-center items-center">
        <div className="flex flex-col justify-center items-center gap-2">
          <img
            src={TagxiHeroImage}
            alt="tagxi-hero-image"
            className="w-[5.5rem] aspect-9/11"
          />

          <div
            onClick={handleUsernameCopy}
            className="flex items-center gap-2 group cursor-pointer rounded-lg px-2 py-1 transition-colors hover:bg-gray-200">
            <p className="text-gray-500 font-bold group-hover:text-gray-700">
              {username}
            </p>
            {copiedUsername ? (
              <CopyCheckIcon size={12} className="stroke-black" />
            ) : (
              <CopyIcon
                size={12}
                className="stroke-black group-hover:stroke-gray-600"
              />
            )}
          </div>
        </div>
      </div>

      {/* Tag Stats */}
      <div className="flex justify-around text-sm my-4">
        <div className="text-center">
          <p className="text-gray-500">Tags Made</p>
          <p className="font-bold text-gray-800">{tagsMade}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Tags Received</p>
          <p className="font-bold text-gray-800">{tagsReceived}</p>
        </div>
      </div>

      {/* Recent Tags */}
      <div className="px-4 mt-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-700 font-medium">Tags on this Page</p>
          <button
            onClick={() => {
              chrome.tabs.create({ url: "https://tagxi.xyz/page-tags" }) // or your route
            }}
            className="p-1 rounded-full hover:bg-gray-100 transition">
            <ChevronRight size={16} className="stroke-gray-600" />
          </button>
        </div>

        <div className="space-y-2">
          {recentTags.map((tag) => (
            <div
              key={tag.id}
              className="flex justify-between items-center bg-white rounded-lg p-2 shadow-sm">
              <div className="flex flex-col">
                <p className="text-gray-800 text-sm">{tag.content}</p>
                <p className="text-xs text-gray-400">
                  by {tag.by} on {tag.site}
                </p>
              </div>
              <Download size={14} className="stroke-gray-500" />
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-700 font-medium">Memories</p>
          <button
            onClick={() => {
              chrome.tabs.create({ url: "https://tagxi.xyz/memories" }) // replace with your route
            }}
            className="p-1 rounded-full hover:bg-gray-100 transition">
            <ChevronRight size={16} className="stroke-gray-600" />
          </button>
        </div>

        <div className="flex gap-3">
          {collectibles.map((item) => (
            <div
              key={item.id}
              className="flex flex-col items-center bg-white rounded-xl p-2 shadow-sm w-16">
              <span className="text-xl">{item.icon}</span>
              <p className="text-[10px] text-center mt-1 text-gray-600">
                {item.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Popup
