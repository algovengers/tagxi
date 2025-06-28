"use client";
import { Button } from "@/components/ui/button";
import { FriendRequest, User } from "@/db/types";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { Settings } from "lucide-react";
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
}: {
  areFriends: boolean;
  friendReq: FriendRequest | null;
  isCurrentUser: boolean;
  currentUserId: string | undefined | null;
  onSendFriendRequest: () => void;
  onAcceptFriendRequest: () => void;
}) {
  if (isCurrentUser || !currentUserId) {
    return <></>;
  }

  if (areFriends) {
    return <div>Friends</div>;
  }

  if (!friendReq) {
    return <Button onClick={onSendFriendRequest}>Add Friend</Button>;
  }

  if (friendReq.senderId === currentUserId) {
    return <Button disabled>Friend Request Sent</Button>;
  }

  return (
    <div>
      <Button onClick={onAcceptFriendRequest}>Accept Friend Request</Button>
      {/* <Button variant="destructive">Reject Friend Request</Button> */}
    </div>
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
  const trpc = useTRPC();

  const { mutate: sendFriendRequest } = useMutation(
    trpc.friendRequest.sendFriendRequest.mutationOptions({
      onSuccess: () => {
        // setAreFriends(true);
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

      <FriendReqButton
        areFriends={areFriends}
        currentUserId={currentUser?.id}
        friendReq={friendReq}
        isCurrentUser={currentUser?.id === user.id}
        onSendFriendRequest={() => sendFriendRequest({ to: user.username })}
        onAcceptFriendRequest={() => acceptRequest({ from: user.id })}
      />

      {currentUser && currentUser.id === user.id && (
        <div>
          <Settings />
        </div>
      )}
    </div>
  );
}
