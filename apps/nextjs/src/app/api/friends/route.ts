import { NextResponse } from "next/server";
import { withAuth } from "../utils";
import { getFriends } from "@/actions/friends";

// Get user's friends list
export const GET = withAuth(async (request, session) => {
  try {
    const friends = await getFriends(session?.user.id as string);
    
    // Transform the data to match the expected format for the extension
    const friendsList = friends.map(friendship => ({
      username: friendship.user.username,
      name: friendship.user.name,
      image: friendship.user.image
    }));

    return NextResponse.json(friendsList);
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json(
      { error: "Failed to fetch friends" },
      { status: 500 }
    );
  }
});