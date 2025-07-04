import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { db, eq } from "@tagxi/db";
import { settings } from "@tagxi/db/src/schema";
import { getOrCreateSettings } from "@tagxi/db/src/helpers";

export const settingsRouter = createTRPCRouter({
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    return await getOrCreateSettings(ctx.auth.user.id);
  }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        extensionSettings: z
          .object({
            tag_color: z.string(),
          })
          .optional(),
        blockedWebsites: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (input.extensionSettings) {
        updateData.extensionSettings = input.extensionSettings;
      }

      if (input.blockedWebsites) {
        updateData.blockedWebsites = input.blockedWebsites;
      }

      const updatedSettings = await db
        .update(settings)
        .set(updateData)
        .where(eq(settings.userId, ctx.auth.user.id))
        .returning();

      return updatedSettings[0];
    }),
});
