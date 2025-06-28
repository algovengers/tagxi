import { NextResponse } from "next/server";
import { withAuth } from "../utils";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

// Get user settings
export const GET = withAuth(async (request, session) => {
  try {
    let userSettings = await db.query.settings.findFirst({
      where: (settings) => eq(settings.userId, session?.user.id as string),
    });

    // Create default settings if none exist
    if (!userSettings) {
      const newSettings = await db
        .insert(settings)
        .values({
          userId: session?.user.id as string,
          markerColor: "#FF0000",
          extensionSettings: {
            tag_color: "#ffb988",
          },
          blockedWebsites: [],
        })
        .returning();
      
      userSettings = newSettings[0];
    }

    return NextResponse.json(userSettings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
});

// Update user settings
export const PUT = withAuth(async (request, session) => {
  try {
    const body = await request.json();
    const { markerColor, extensionSettings, blockedWebsites } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (markerColor) {
      updateData.markerColor = markerColor;
    }

    if (extensionSettings) {
      updateData.extensionSettings = extensionSettings;
    }

    if (blockedWebsites) {
      updateData.blockedWebsites = blockedWebsites;
    }

    const updatedSettings = await db
      .update(settings)
      .set(updateData)
      .where(eq(settings.userId, session?.user.id as string))
      .returning();

    return NextResponse.json(updatedSettings[0]);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
});