import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";

import { db, and, eq } from "@tagxi/db";
import { TRPCError } from "@trpc/server";
import { friendRequestTable, friendTable } from "@tagxi/db/src/schema";
import { areFriends, activeFriendRequest } from "@tagxi/db/src/helpers";

export const friendRequestRouter = createTRPCRouter({
  sendFriendRequest: protectedProcedure
    .input(
      z.object({
        to: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.to === ctx.auth.user.username) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot send a friend request to yourself",
        });
      }

      const user = await db.query.user.findFirst({
        where: (user) => eq(user.username, input.to),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const friends = await areFriends(ctx.auth.user.id, user.id);

      if (friends) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already friends with this user",
        });
      }

      const friendRequestExists = await activeFriendRequest(
        ctx.auth.user.id,
        user.id
      );

      if (friendRequestExists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Friend request already exists",
        });
      }

      await db.insert(friendRequestTable).values({
        senderId: ctx.auth.user.id,
        receiverId: user.id,
        status: "pending",
      });

      return {
        message: "Friend request sent successfully",
      };
      // SEND NOTIFICATION HERE
    }),
  acceptFriendRequest: protectedProcedure
    .input(
      z.object({
        from: z.string(), // Friend request ID
      })
    )
    .mutation(async ({ input, ctx }) => {
      const friendRequestData = await db.query.friendRequestTable.findFirst({
        where: (fr) =>
          and(
            eq(fr.receiverId, ctx.auth.user.id),
            eq(fr.senderId, input.from),
            eq(fr.status, "pending")
          ),
      });

      if (!friendRequestData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Friend request not found",
        });
      }

      const userIds = [ctx.auth.user.id, friendRequestData.senderId];
      userIds.sort();

      await db.transaction(async (tx) => {
        await tx
          .update(friendRequestTable)
          .set({ status: "accepted" })
          .where(eq(friendRequestTable.id, friendRequestData.id));

        await tx.insert(friendTable).values({
          userId1: userIds[0],
          userId2: userIds[1],
        });
      });

      // SEND ACCEPTED NOTIFICATION HERE

      return {
        message: "Friend request accepted successfully",
      };
    }),
});
