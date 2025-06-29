import { tag, userTags } from "@tagxi/db/src/schema";
import { createTRPCRouter, protectedProcedure } from "../init";
import { and, db, eq } from "@tagxi/db";

export const tagRouter = createTRPCRouter({
  getTagged: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.auth.user;

    const data = await db
      .select({
        seen: tag.seen,
        username: tag.username,
        site: tag.site,
        createdAt: tag.createdAt,
        message: tag.message,
      })
      .from(tag)
      .where(eq(userTags.username, user.username!))
      .leftJoin(userTags, eq(userTags.tagId, tag.id));

    return data;
  }),
});
