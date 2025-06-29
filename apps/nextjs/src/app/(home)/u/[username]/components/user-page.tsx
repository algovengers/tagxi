"use client";
import { Button } from "@/components/ui/button";
import { FriendRequest, User } from "@tagxi/db";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import {
  Settings,
  UserPlus,
  UserCheck,
  Clock,
  Check,
  X,
  Mail,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { User as BetterAuthUser } from "better-auth";

function FriendReqButton({
  areFriends,
  currentUserId,
  friendReq,
  isCurrentUser,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onRejectFriendRequest,
}: {
  areFriends: boolean;
  friendReq: FriendRequest | null;
  isCurrentUser: boolean;
  currentUserId: string | undefined | null;
  onSendFriendRequest: () => void;
  onAcceptFriendRequest: () => void;
  onRejectFriendRequest?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleSendRequest = async () => {
    setIsLoading(true);
    await onSendFriendRequest();
    setIsLoading(false);
  };

  const handleAcceptRequest = async () => {
    setIsLoading(true);
    await onAcceptFriendRequest();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
    setIsLoading(false);
  };

  if (isCurrentUser || !currentUserId) {
    return null;
  }

  if (areFriends) {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 transition-all duration-300"
        >
          <UserCheck className="w-4 h-4 mr-2" />
          Friends
          {showConfetti && <span className="ml-2 animate-bounce">🎉</span>}
        </Button>
      </div>
    );
  }

  if (!friendReq) {
    return (
      <Button
        onClick={handleSendRequest}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 transform hover:scale-105"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        {isLoading ? "Sending..." : "Add Friend"}
      </Button>
    );
  }

  if (friendReq.senderId === currentUserId) {
    return (
      <Button
        variant="outline"
        disabled
        className="bg-yellow-50 border-yellow-200 text-yellow-700"
      >
        <Clock className="w-4 h-4 mr-2" />
        Request Sent
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleAcceptRequest}
        disabled={isLoading}
        className="bg-green-600 hover:bg-green-700 text-white transition-all duration-300"
      >
        <Check className="w-4 h-4 mr-2" />
        Accept
      </Button>
      <Button
        onClick={onRejectFriendRequest}
        variant="outline"
        className="border-red-200 text-red-600 hover:bg-red-50 transition-all duration-300"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

function UserBadges({ user }: { user: User }) {
  const badges = [
    {
      name: "Early Adopter",
      color: "bg-purple-100 text-purple-800",
      icon: "🚀",
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {badges.map((badge) => (
        <span
          key={badge.name}
          className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color} transition-all duration-300 hover:scale-105`}
        >
          <span className="mr-1">{badge.icon}</span>
          {badge.name}
        </span>
      ))}
    </div>
  );
}

function ProfileTabs({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const tabs = [{ id: "about", label: "About", icon: "👤" }];

  return (
    <div className="border-b border-gray-200 mt-8">
      <nav className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function TabContent({ activeTab, user }: { activeTab: string; user: User }) {
  const content = {
    about: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-gray-600">
          <Mail className="w-5 h-5" />
          <span>{user.email || "Not provided"}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <Calendar className="w-5 h-5" />
          <span>Joined January 2024</span>
        </div>
        <div className="mt-6">
          <h3 className="font-semibold text-gray-800 mb-2">Bio</h3>
          <p className="text-gray-600 leading-relaxed">
            Passionate developer who loves building amazing user experiences.
            Always learning new technologies and sharing knowledge with the
            community.
          </p>
        </div>
      </div>
    ),
  };

  return (
    <div className="mt-6">{content[activeTab as keyof typeof content]}</div>
  );
}

export default function UserPage({
  user,
  currentUser,
  areFriends: $areFriends,
  friendReq,
}: {
  currentUser: BetterAuthUser | null;
  user: User;
  areFriends: boolean;
  friendReq: FriendRequest | null;
}) {
  const [areFriends, setAreFriends] = useState($areFriends);
  const [activeTab, setActiveTab] = useState("about");
  const trpc = useTRPC();

  const { mutate: sendFriendRequest } = useMutation(
    trpc.friendRequest.sendFriendRequest.mutationOptions({
      onSuccess: () => {
        // Handle success
      },
    })
  );

  const { mutate: acceptRequest } = useMutation(
    trpc.friendRequest.acceptFriendRequest.mutationOptions({
      onSuccess: () => {
        setAreFriends(true);
      },
    })
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg my-auto">
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-t-xl"></div>

        <div className="relative px-6 pb-6 bg-white rounded-b-xl shadow-lg">
          <div className="flex flex-col md:flex-row md:items-end md:space-x-6">
            <div className="relative -mt-16 mb-4 md:mb-0">
              <div className="relative">
                <Image
                  src={user.image || "/api/placeholder/120/120"}
                  alt={user.name || "User"}
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-white shadow-lg"
                />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    {user.name}
                  </h1>
                  <p className="text-gray-600 mb-2">@{user.username}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500"></div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  <FriendReqButton
                    areFriends={areFriends}
                    currentUserId={currentUser?.id}
                    friendReq={friendReq}
                    isCurrentUser={currentUser?.id === user.id}
                    onSendFriendRequest={() =>
                      sendFriendRequest({ to: user.username })
                    }
                    onAcceptFriendRequest={() =>
                      acceptRequest({ from: user.id })
                    }
                    // onRejectFriendRequest={() => rejectRequest({ from: user.id })}
                  />

                  {currentUser && currentUser.id === user.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>

              {/* User Badges */}
              <UserBadges user={user} />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="mt-8 bg-white rounded-xl shadow-lg">
        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="p-6">
          <TabContent activeTab={activeTab} user={user} />
        </div>
      </div>
    </div>
  );
}
