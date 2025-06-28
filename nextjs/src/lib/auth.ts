import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { username } from "better-auth/plugins";
import { account, session, user, verification, settings } from "@/db/schema";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: user,
      session: session,
      account: account,
      verification: verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirectURI:`${(process.env.NEXT_PUBLIC_APP_URL as string)}/api/auth/callback/google`
    },
  },
  plugins: [username(), nextCookies()],
  // @team -> make sure to add the site url and other services url here
  trustedOrigins:[process.env.CHROME_EXTENSION_URL as string],
  hooks: {
    after: [
      {
        matcher(context) {
          return context.path === "/sign-up/email" || context.path?.includes("/callback/");
        },
        handler: async (ctx) => {
          // Create default settings for new users
          if (ctx.user && ctx.user.id) {
            try {
              // Check if settings already exist
              const existingSettings = await db.query.settings.findFirst({
                where: (settings) => settings.userId === ctx.user.id,
              });

              if (!existingSettings) {
                await db.insert(settings).values({
                  userId: ctx.user.id,
                  markerColor: "#FF0000",
                  extensionSettings: {
                    tag_color: "#ffb988",
                  },
                  blockedWebsites: [],
                });
                console.log(`Created default settings for user: ${ctx.user.id}`);
              }
            } catch (error) {
              console.error("Error creating default settings:", error);
              // Don't throw error to avoid breaking user creation
            }
          }
        },
      },
    ],
  },
});