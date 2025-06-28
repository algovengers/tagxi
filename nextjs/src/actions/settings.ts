import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const createDefaultSettings = async (userId: string) => {
  try {
    // Check if settings already exist
    const existingSettings = await db.query.settings.findFirst({
      where: (settings) => eq(settings.userId, userId),
    });

    if (!existingSettings) {
      await db.insert(settings).values({
        userId: userId,
        extensionSettings: {
          tag_color: "#ffb988",
        },
        blockedWebsites: [],
      });
      console.log(`Created default settings for user: ${userId}`);
    }
  } catch (error) {
    console.error("Error creating default settings:", error);
    // Don't throw error to avoid breaking user creation
  }
};

export const getOrCreateSettings = async (userId: string) => {
  try {
    let userSettings = await db.query.settings.findFirst({
      where: (settings) => eq(settings.userId, userId),
    });

    if (!userSettings) {
      const newSettings = await db
        .insert(settings)
        .values({
          userId: userId,
          extensionSettings: {
            tag_color: "#ffb988",
          },
          blockedWebsites: [],
        })
        .returning();
      
      userSettings = newSettings[0];
    }

    return userSettings;
  } catch (error) {
    console.error("Error getting or creating settings:", error);
    throw error;
  }
};