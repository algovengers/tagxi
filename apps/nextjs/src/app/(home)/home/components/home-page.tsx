"use client";
import React, { useState } from "react";
import { Settings, Users, Tag, Chrome, Globe, Filter } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import FriendSection from "./friend-section";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return "just now";
  }

  // Less than an hour
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  // Less than a day
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }

  // Less than a week
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  }

  // Less than a month
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`;
  }

  // Less than a year
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
  }

  // More than a year
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`;
}

const TagxiHomepage = ({
  tags,
}: {
  tags: {
    username: string;
    site: string;
    seen: boolean;
    createdAt: Date;
    message: string | null;
  }[];
}) => {
  const [activeTab, setActiveTab] = useState("tags");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const trpc = useTRPC();
  const { data: friends, isFetching: fetchingFriends } = useQuery(
    trpc.friend.getFriends.queryOptions()
  );

  const filteredTags =
    selectedFilter === "all"
      ? tags
      : selectedFilter === "unread"
        ? tags.filter((tag) => !tag.seen)
        : tags.filter((tag) => tag.seen);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl p-6 text-white mb-8">
              <h1 className="text-2xl font-bold mb-2">Welcome Home! 👋</h1>
            </div>

            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
              <button
                onClick={() => setActiveTab("tags")}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md font-medium transition-colors ${
                  activeTab === "tags"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>My Tags</span>
              </button>
              <button
                onClick={() => setActiveTab("friends")}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md font-medium transition-colors ${
                  activeTab === "friends"
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Friends</span>
              </button>
            </div>

            {activeTab === "tags" && (
              <div>
                <div className="flex flex-wrap items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="all">All Tags</option>
                      <option value="unread">Unread</option>
                      <option value="read">Read</option>
                    </select>
                  </div>
                </div>

                {/* Tags List */}
                <div className="space-y-4">
                  {filteredTags.map((tag, idx) => (
                    <Link href={tag.site} key={idx}>
                      <div
                        className={`bg-white rounded-xl cursor-pointer p-6 shadow-sm border-l-4 ${!tag.seen ? "border-orange-500" : "border-gray-200"}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold"></div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {tag.username}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatRelativeTime(tag.createdAt)}
                                </p>
                              </div>
                              {!tag.seen && (
                                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 mb-3">{tag.message}</p>
                            <div className="flex items-center space-x-4">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium`}
                              >
                                <Globe className="w-3 h-3 mr-1" />
                                {tag.site}
                              </span>
                              <span className="text-sm text-gray-500">
                                {tag.message}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "friends" && (
              <>
                {fetchingFriends ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="w-full h-40" />
                    <Skeleton className="w-full h-40" />
                  </div>
                ) : (
                  <FriendSection friends={friends ?? []} />
                )}
              </>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <a href="/chrome-mv3-prod.zip" download="Tagxi-Extension">
                <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Chrome className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Install Extension
                    </p>
                    <p className="text-sm text-gray-500">
                      Tag anywhere on the web
                    </p>
                  </div>
                </button>
                </a>
                <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Settings className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Settings</p>
                    <p className="text-sm text-gray-500">Manage your account</p>
                  </div>
                </button>
                <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Users className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900">Invite Friends</p>
                    <p className="text-sm text-gray-500">
                      Share Tagxi with others
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Your Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tags Sent</span>
                  <span className="font-semibold text-gray-900">127</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tags Received</span>
                  <span className="font-semibold text-gray-900">89</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Friends</span>
                  <span className="font-semibold text-gray-900">
                    {friends?.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">This Week</span>
                  <span className="font-semibold text-orange-600">+12</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagxiHomepage;
