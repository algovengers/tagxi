import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@tagxi/db";
import { username } from "better-auth/plugins";
import { account, session, user, verification } from "@tagxi/db/src/schema";
import { nextCookies } from "better-auth/next-js";
import { createAuthMiddleware } from "better-auth/api";
import { createDefaultSettings } from "@/actions/settings";

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
      redirectURI: `${
        process.env.NEXT_PUBLIC_APP_URL as string
      }/api/auth/callback/google`,
    },
  },
  plugins: [username(), nextCookies()],
  // @team -> make sure to add the site url and other services url here
  trustedOrigins: [process.env.CHROME_EXTENSION_URL as string],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Handle user registration (both email/password and social)
      if (ctx.path.startsWith("/sign-up") || ctx.path.includes("/callback/")) {
        const newSession = ctx.context.newSession;
        if (newSession?.user?.id) {
          try {
            await createDefaultSettings(newSession.user.id);
            console.log(`Created default settings for new user: ${newSession.user.id}`);
          } catch (error) {
            console.error("Error creating default settings in hook:", error);
            // Don't throw error to avoid breaking user registration
          }
        }
      }
    }),
  },
  // Add session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  // // Add redirect configuration
  // callbacks: {
  //   redirect: {
  //     signIn: "/home",
  //     signUp: "/onboarding",
  //   },
  // },
});
