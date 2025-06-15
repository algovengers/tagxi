import React, { useState } from "react"

import "~style.css"

import Avatar from "boring-avatars"
import {
  ArrowUpDown,
  BellIcon,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  Send
} from "lucide-react"

const Popup = () => {
  const [activeTab, setActiveTab] = useState("Recent transactions")

  const transactions = [
    {
      id: 1,
      type: "receive",
      amount: "+2.0004 ETH",
      value: "$7,118 USD",
      address: "tzf2...Pq3G",
      status: "completed"
    },
    {
      id: 2,
      type: "send",
      amount: "-0.4820 ETH",
      value: "$1,956 USD",
      status: "processing"
    },
    {
      id: 3,
      type: "send",
      amount: "-2.5005 ETH",
      value: "$8,286 USD",
      address: "Ox6f...2351",
      status: "completed"
    }
  ]

  const collectibles = [
    { id: 1, name: "Emojis #9377", image: "💙", collection: "Emojis" },
    { id: 2, name: "Azuki #306", image: "👤", collection: "Azuki" },
    { id: 3, name: "Winter feeling", image: "❄️", collection: "Art" }
  ]

  return (
    <div className="w-96 bg-gradient-to-tr from-[#f9fbfc] to-[#f9fbfc]  overflow-hidden font-sans relative">
      <div className="flex items-center justify-between mb-4 p-4">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-xl text-gray-800">TagXi</span>
        </div>

        <div className="flex gap-2 items-center">
          <button className="bg-white hover:bg-gray-100 rounded-full p-2 shadow-sm cursor-pointer">
            <BellIcon color="black" size={18} />
          </button>

          <button className="bg-white hover:bg-gray-100 rounded-full p-2 shadow-sm cursor-pointer">
            <Avatar name="arnab" size={18} />
          </button>
        </div>
      </div>

      {/* need to improve this as bit */}
      <div className="-mt-4 flex justify-center items-center">
        <div className="flex flex-col justify-center items-center gap-2">
          <Avatar name="arnab" size={80} />
          <p>@arnab20k</p>
        </div>
      </div>

      <div className="p-4">
        {/* <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setActiveTab("Recent transactions")}
            className={`text-sm font-medium ${activeTab === "Recent transactions" ? "text-gray-800" : "text-gray-500"}`}>
            Recent transactions
          </button>
          <div className="flex items-center space-x-4">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              36
            </span>
            <button className="text-xs text-gray-500 hover:text-gray-700">
              Last Month →
            </button>
          </div>
        </div> */}

        {/* Transactions */}
        {/* {activeTab === "Recent transactions" && (
          <div className="space-y-3 mb-6">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.type === "receive" ? "bg-blue-100" : "bg-gray-100"
                    }`}>
                    {tx.type === "receive" ? (
                      <Download className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Send className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-800">
                        {tx.amount}
                      </span>
                      {tx.address && (
                        <span className="text-xs text-gray-500">
                          {tx.address}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{tx.value}</span>
                  </div>
                </div>
                <div
                  className={`w-2 h-2 rounded-full ${
                    tx.status === "completed" ? "bg-green-500" : "bg-yellow-500"
                  }`}></div>
              </div>
            ))}
          </div>
        )} */}

        {/* My Collectibles */}
        {/* <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-800">
            My collectibles
          </span>
          <div className="flex items-center space-x-4">
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              10
            </span>
            <button className="text-xs text-gray-500 hover:text-gray-700">
              View all →
            </button>
          </div>
        </div> */}

        {/* Collectibles Grid */}
        {/* <div className="grid grid-cols-3 gap-3">
          {collectibles.map((item) => (
            <div
              key={item.id}
              className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 cursor-pointer">
              <div className="aspect-square bg-white rounded-lg flex items-center justify-center text-2xl mb-2">
                {item.image}
              </div>
              <div className="text-xs text-gray-800 font-medium truncate">
                {item.name}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {item.collection}
              </div>
            </div>
          ))}
        </div> */}
      </div>
    </div>
  )
}

export default Popup
