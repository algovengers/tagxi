import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext, appRouter } from "@tagxi/trpc";
import { headers } from "next/headers";
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: headers }),
  });
export { handler as GET, handler as POST };
