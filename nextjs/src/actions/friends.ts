import { db } from "@/db";
import { eq, and } from "drizzle-orm";

export const areFriends = async (userId1: string, userId2: string) => {
  const arr = [userId1, userId2];
  arr.sort();

  const friend = await db.query.friend.findFirst({
    where: (friend) =>
      and(eq(friend.userId1, arr[0]), eq(friend.userId2, arr[1])),
  });

  return friend;
};
