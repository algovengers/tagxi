import { db } from "@/db";
import { and, eq, or } from "drizzle-orm";

export const activeFriendRequest = async (userId1: string, userId2: string) => {
  try {
    const freq = await db.query.friendRequest.findFirst({
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
