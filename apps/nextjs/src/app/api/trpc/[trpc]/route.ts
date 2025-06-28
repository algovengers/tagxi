import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCContext, appRouter } from "@tagxi/trpc";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const header = await headers();
      const session = await auth.api.getSession({ headers: header });
      return createTRPCContext({ session });
    },
  });

export { handler as GET, handler as POST };
