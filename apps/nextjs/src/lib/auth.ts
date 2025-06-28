import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@tagxi/db";
import { username } from "better-auth/plugins";
import { account, session, user, verification } from "@tagxi/db/src/schema";
import { nextCookies } from "better-auth/next-js";

console.log(process.env.NEXT_PUBLIC_APP_URL)
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
  trustedOrigins: [
    // process.env.CHROME_EXTENSION_URL as string,
    process.env.NEXT_PUBLIC_BACKEND_URL as string,
    process.env.NEXT_PUBLIC_APP_URL as string,
  ],
});
