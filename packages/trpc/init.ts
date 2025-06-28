import { auth } from "@/lib/auth";
import { initTRPC, TRPCError } from "@trpc/server";

export interface TRPCContext {
  headers?: Headers;
}

export const createTRPCContext = async (opts: {
  headers?: () => Promise<Headers>;
}): Promise<TRPCContext> => {
  const data = await opts.headers?.();
  return { headers: data };
};

const t = initTRPC.context<TRPCContext>().create({
  // transformer: superjson, // if you need a data transformer, uncomment this
});

export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;

const getSession = async (headers?: Headers) =>
  await auth.api.getSession({ headers: headers || new Headers() });

export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = await getSession(ctx.headers);

  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized access. Please log in.",
    });
  }

  if (!session.user.username) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must complete onboarding before accessing this resource.",
    });
  }

  return next({ ctx: { ...ctx, auth: session } });
});

export const onboardingProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = await getSession(ctx.headers);

  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized access. Please log in.",
    });
  }

  return next({ ctx: { ...ctx, auth: session } });
});
