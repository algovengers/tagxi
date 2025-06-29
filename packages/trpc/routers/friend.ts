import { createTRPCRouter, protectedProcedure } from "../init";
import { db, eq, or } from "@tagxi/db";

export const friendRouter = createTRPCRouter({
  getFriends: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.user.id;

    const friendships = await db.query.friendTable.findMany({
      where: (friend) =>
        or(eq(friend.userId1, userId), eq(friend.userId2, userId)),
      with: {
        user1: {
          columns: {
            username: true,
            name: true,
            image: true,
          },
        },
        user2: {
          columns: {
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
  }),
});
