import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { settings } from "@/db/schema";

export const settingsRouter = createTRPCRouter({
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    let userSettings = await db.query.settings.findFirst({
      where: (settings) => eq(settings.userId, ctx.auth.user.id),
    });

    // Create default settings if none exist
    if (!userSettings) {
      const newSettings = await db
        .insert(settings)
        .values({
          userId: ctx.auth.user.id,
          markerColor: "#FF0000",
          extensionSettings: {
            tag_color: "#ffb988",
          },
          blockedWebsites: [],
        })
        .returning();
      
      userSettings = newSettings[0];
    }

    return userSettings;
  }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        markerColor: z.string().optional(),
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

      if (input.markerColor) {
        updateData.markerColor = input.markerColor;
      }

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