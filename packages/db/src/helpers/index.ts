import { eq, and, or } from "drizzle-orm";
import { db } from "../index";
import { settings } from "@/schema";

export const areFriends = async (userId1: string, userId2: string) => {
  const arr = [userId1, userId2];
  arr.sort();

  const friend = await db.query.friendTable.findFirst({
    where: (friend) =>
      and(eq(friend.userId1, arr[0]!), eq(friend.userId2, arr[1]!)),
  });

  return friend;
};

export const getFriends = async (userId: string) => {
  const friendships = await db.query.friendTable.findMany({
    where: (friend) =>
      or(eq(friend.userId1, userId), eq(friend.userId2, userId)),
    with: {
      user1: {
        columns: {
          id: true,
          username: true,
          name: true,
          image: true,
        },
      },
      user2: {
        columns: {
          id: true,
          username: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return friendships.map((friendship) => ({
    createdAt: friendship.createdAt,
    user: friendship.userId1 === userId ? friendship.user2 : friendship.user1,
  }));
};
export const activeFriendRequest = async (userId1: string, userId2: string) => {
  try {
    const freq = await db.query.friendRequestTable.findFirst({
      where: (fr) =>
        and(
          or(
            and(eq(fr.senderId, userId1), eq(fr.receiverId, userId2)),
            and(eq(fr.senderId, userId2), eq(fr.receiverId, userId1))
          ),
          eq(fr.status, "pending")
        ),
    });
    return freq ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getOrCreateSettings = async (userId: string) => {
  try {
    let userSettings = await db.query.settings.findFirst({
      where: (settings) => eq(settings.userId, userId),
    });

    if (!userSettings) {
      const newSettings = await db
        .insert(settings)
        .values({
          userId: userId,
          extensionSettings: {
            tag_color: "#ffb988",
          },
          blockedWebsites: [],
        })
        .returning();

      userSettings = newSettings[0];
    }

    return userSettings;
  } catch (error) {
    console.error("Error getting or creating settings:", error);
    throw error;
  }
};
