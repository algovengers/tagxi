import { NextResponse } from "next/server";
import { withAuth } from "../utils";
import { db, eq } from "@tagxi/db";
import { settings } from "@tagxi/db/src/schema";
import { getOrCreateSettings } from "@/actions/settings";

// Get user settings
export const GET = withAuth(async (request, session) => {
  try {
    const userSettings = await getOrCreateSettings(session?.user.id as string);
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
    const { extensionSettings, blockedWebsites } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

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
