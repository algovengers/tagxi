import { Friend } from "@tagxi/db";
import { Plus, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function FriendSection({ friends }: { friends: Friend[] }) {
  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <Users className="w-12 h-12 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">No friends yet</h1>
            <p className="text-gray-600 text-lg">
              Your friend list is empty, but that's about to change!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Your Friends</h2>
        <button className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Friend</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {friends?.map((friend, idx) => (
          <Link key={idx} href={`/u/${friend.user.username!}`}>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Image
                    src={friend.user.image ?? "/default-avatar.png"}
                    alt=""
                    height={40}
                    width={40}
                    className="rounded-full"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {friend.user.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {friend.user.username}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
