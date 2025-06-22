import { z } from "zod";
import {
  baseProcedure,
  createTRPCRouter,
  onboardingProcedure,
  protectedProcedure,
} from "../init";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { user as userTable } from "@/db/schema";
export const usernameRouter = createTRPCRouter({
  checkUsername: baseProcedure
    .input(
      z.object({
        username: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await db.query.user.findFirst({
        where: (user) => eq(user.username, input.username),
      });

      return {
        available: !user,
      };
    }),
});

export const userRouter = createTRPCRouter({
  updateUser: onboardingProcedure
    .input(
      z.object({
        username: z.string().optional(),
        name: z.string().optional(),
        image: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.auth.user;
      if (input.username && user.username) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Username already set",
        });
      }

      await db.update(userTable).set(input).where(eq(userTable.id, user.id));

      return {
        message: "User updated successfully",
      };
    }),
});
