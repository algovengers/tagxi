import { FriendRequest, User } from "@/db/types";
import { Settings } from "lucide-react";
import Image from "next/image";

export default function UserPage({
  user,
  currentUser,
  areFriends,
  friendReq,
}: {
  currentUser: Partial<User> | null;
  user: Partial<User>;
  areFriends: boolean;
  friendReq: FriendRequest | null;
}) {
  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-4 my-8 flex justify-between items-center bg-white rounded-2xl">
      <div className="flex items-center gap-4">
        <Image
          src={user.image || "/default-avatar.png"}
          alt={`${user.username}'s avatar`}
          className="w-16 h-16 rounded-full"
          width={64}
          height={64}
        />
        <div>
          <h1 className="text-2xl font-bold">{user.username}</h1>
          <p>{user.name}</p>
        </div>
      </div>

      {currentUser && currentUser.id !== user.id && (
        <div className="flex gap-4">
          {areFriends ? (
            <button className="bg-blue-500 text-white px-4 py-2 rounded">
              Friends
            </button>
          ) : friendReq ? (
            <button className="bg-yellow-500 text-white px-4 py-2 rounded">
              Friend Request Sent
            </button>
          ) : (
            <button className="bg-green-500 text-white px-4 py-2 rounded">
              Add Friend
            </button>
          )}
        </div>
      )}
      {currentUser && currentUser.id === user.id && (
        <div>
          <Settings />
        </div>
      )}
    </div>
  );
}
