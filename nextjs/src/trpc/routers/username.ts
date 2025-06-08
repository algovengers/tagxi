import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { db } from "@/db";
import { eq } from "drizzle-orm";
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
