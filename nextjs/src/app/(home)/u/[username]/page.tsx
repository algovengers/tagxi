import { getUserByUsername } from "@/actions/user";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import UserNotFound from "./components/user-not-found";
import UserPage from "./components/user-page";
import { areFriends } from "@/actions/friends";
import { activeFriendRequest } from "@/actions/friendRequests";
import { FriendRequest } from "@/db/types";

export default async function Page({
  params,
}: {
  params: { username: string };
}) {
  const { username } = params;
  const header = await headers();
  const currentSession = await auth.api.getSession({
    headers: header,
  });

  const user = await getUserByUsername(username);

  if (user === null) {
    return <UserNotFound />;
  }

  let areFriend = false;
  let friendReq: FriendRequest | null = null;

  if (currentSession?.user && user.id !== currentSession.user.id) {
    areFriend = !!(await areFriends(currentSession.user.id, user.id));
    friendReq = await activeFriendRequest(currentSession.user.id, user.id);
  }

  return (
    <UserPage
      currentUser={currentSession?.user ?? null}
      user={user}
      areFriends={areFriend}
      friendReq={friendReq}
    />
  );
}
