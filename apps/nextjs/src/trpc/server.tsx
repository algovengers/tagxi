import "server-only";
import { headers } from "next/headers";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { makeQueryClient } from "./query-client";
import { appRouter, createTRPCContext } from "@tagxi/trpc";

// Create a stable getter for the query client that returns the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

// Use Next.js's headers() to pass headers from here to the context.
export const trpc = createTRPCOptionsProxy({
  ctx: () => createTRPCContext({ headers: headers }),
  router: appRouter,
  queryClient: getQueryClient,
});
