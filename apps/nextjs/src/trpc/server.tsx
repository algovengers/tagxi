import "server-only";
import { headers } from "next/headers";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { makeQueryClient } from "./query-client";
import { appRouter, createTRPCContext } from "@tagxi/trpc";
import { auth } from "@/lib/auth";
import { Session, User } from "better-auth";

// Create a stable getter for the query client that returns the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

// Use Next.js's headers() to pass headers from here to the context.
export const trpc = createTRPCOptionsProxy({
  ctx: async () => {
    const header = await headers();
    const session = await auth.api.getSession({ headers: header });
    return createTRPCContext({ session });
  },
  router: appRouter,
  queryClient: getQueryClient,
});

export const createServerClient = async ({
  session,
}: {
  session: { session: Session; user: User };
}) => {
  const ctx = await createTRPCContext({ session: session });
  return appRouter.createCaller(ctx);
};
