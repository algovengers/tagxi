import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { usernameRouter, userRouter } from "./user";
import { friendRequestRouter } from "./friendRequest";
import { db } from "@/db";
import { and, eq, like, ne, or, sql } from "drizzle-orm";
import { friendTable, user as userTable } from "@/db/schema";
export const appRouter = createTRPCRouter({
  user: userRouter,
  username: usernameRouter,
  friendRequest: friendRequestRouter,
  search: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        friendsOnly: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results: {
        username: string;
        areFriends: boolean;
        image: string | null;
        name: string | null;
      }[] = [];
      const currentUserId = ctx.auth.user.id;
      const friends = await db
        .select({
          username: userTable.username,
          image: userTable.image,
          name: userTable.name,
        })
        .from(userTable)
        .innerJoin(
          friendTable,
          or(
            and(
              eq(friendTable.userId1, currentUserId),
              eq(friendTable.userId2, userTable.id)
            ),
            and(
              eq(friendTable.userId2, currentUserId),
              eq(friendTable.userId1, userTable.id)
            )
          )
        )
        .where(
          and(
            like(userTable.username, `%${input.query}%`),
            ne(userTable.id, currentUserId)
          )
        )
        .orderBy(userTable.username)
        .limit(10);

      results.push(
        ...friends.map((f) => ({
          ...f,
          areFriends: true,
          username: f.username!,
        }))
      );

      if (!input.friendsOnly) {
        const nonFriends = await db
          .select({
            username: userTable.username,
            image: userTable.image,
            name: userTable.name,
          })
          .from(userTable)
          .where(
            and(
              like(userTable.username, `%${input.query}%`),
              ne(userTable.id, currentUserId), // Exclude current user
              // Exclude users who are already friends
              sql`NOT EXISTS (
              SELECT 1 FROM ${friendTable}
              WHERE (
                (${friendTable.userId1} = ${currentUserId} AND ${friendTable.userId2} = ${userTable.id}) OR
                (${friendTable.userId2} = ${currentUserId} AND ${friendTable.userId1} = ${userTable.id})
              )
            )`
            )
          )
          .orderBy(userTable.username)
          .limit(Math.max(0, 10 - friends.length));
        results.push(
          ...nonFriends.map((nf) => ({
            ...nf,
            areFriends: false,
            username: nf.username!,
          }))
        );
      }

      return results;
    }),
});
export type AppRouter = typeof appRouter;
