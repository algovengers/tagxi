import React, { useState } from "react"

import "~style.css"

import Avatar from "boring-avatars"
import TagxiHeroImage from "data-base64:assets/tagxi-hero.png"
import { BellIcon, ChevronRight } from "lucide-react"

import { Card, getEllipsedText } from "~components/Card"
import InteractiveText from "~components/InteractiveText"
import { Stack } from "~components/Stack"

const username = "@arnab20k"
const tagsMade = 2000
const tagsReceived = 1450

const recentTags = [
  {
    id: 1,
    content:
      "Loved this really detailed and insightful API snippet for handling auth flows!",
    by: "SaraJonathanCarmichaelTheThird",
    time: "18mins ago"
  },
  {
    id: 2,
    content:
      "Bookmark this super important documentation line for later reference in the project",
    by: "MeTheCodeWizardFromBangalore",
    time: "18mins ago"
  },
  {
    id: 3,
    content:
      "Check this clever bugfix idea for async data syncing in background workers!",
    by: "RaviRamanujanTheDebuggingChampion",
    time: "18mins ago"
  }
]

const collectibles = [
  { id: 1, name: "Tag of the Month", image: "https://picsum.photos/200" },
  { id: 2, name: "First Tag", image: "https://picsum.photos/200" },
  { id: 3, name: "React Pro", image: "https://picsum.photos/200" }
]

const Popup = () => {
  return (
    <div className="w-[22rem] pb-2 bg-gradient-to-tr from-[#f9fbfc] to-[#f9fbfc] overflow-hidden font-sans relative">
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
          <p className="font-bold text-gray-800">{tagsMade}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Tags Received</p>
          <p className="font-bold text-gray-800">{tagsReceived}</p>
        </div>
      </div>

      <div className="px-4 mt-6">
        <Stack.Header
          title="Tags on this Page"
          action={
            <button
              onClick={() =>
                chrome.tabs.create({ url: "https://tagxi.xyz/page-tags" })
              }
              className="p-1 rounded-full hover:bg-gray-100">
              <ChevronRight size={16} />
            </button>
          }
        />

        <Stack>
          {recentTags.map((tag) => (
            <Card
              key={tag.id}
              className="w-24 cursor-pointer hover:bg-gray-100">
              <Card.Header
                name={tag.by}
                title={getEllipsedText(tag.by, "MIDDLE")}
              />
              <Card.Body>{getEllipsedText(tag.content, "LAST")}</Card.Body>
              <Card.Footer>{tag.time}</Card.Footer>
            </Card>
          ))}
        </Stack>
      </div>

      <div className="px-4 mt-6">
        <Stack.Header
          title="Memories"
          action={
            <button
              onClick={() =>
                chrome.tabs.create({ url: "https://tagxi.xyz/memories" })
              }
              className="p-1 rounded-full hover:bg-gray-100">
              <ChevronRight size={16} />
            </button>
          }
        />

        <Stack>
          {collectibles.map((item) => (
            <Card
              key={item.id}
              className="w-24 cursor-pointer hover:bg-gray-100">
              <Card.ImageCover src={item.image} alt={item.name} />
              <Card.Footer>
                <div className="flex items-center gap-1 mt-1">
                  <p className="text-[10px] text-gray-600 truncate">
                    {item.name}
                  </p>
                </div>
              </Card.Footer>
            </Card>
          ))}
        </Stack>
      </div>
    </div>
  )
}

export default Popup
