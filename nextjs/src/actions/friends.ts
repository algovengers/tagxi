import { db } from "@/db";
import { friendTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const areFriends = async (userId1: string, userId2: string) => {
  const arr = [userId1, userId2];
  arr.sort();

  const friend = await db.query.friendTable.findFirst({
    where: (friend) =>
      and(eq(friend.userId1, arr[0]), eq(friend.userId2, arr[1])),
  });

  return friend;
};
