import { initTRPC, TRPCError } from "@trpc/server";

interface Session {
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null | undefined;
    userAgent?: string | null | undefined;
  };
  user: {
    username?: string | null | undefined;
    id: string
  };
}

export interface TRPCContext {
  session?: Session | null;
}

export const createTRPCContext = async (opts: {
  session?: Session | null;
}): Promise<TRPCContext> => {
  // const data = await opts.headers?.();
  return { session: opts.session };
};

const t = initTRPC.context<TRPCContext>().create({
  // transformer: superjson, // if you need a data transformer, uncomment this
});

export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;

// const getSession = async (headers?: Headers) =>
//   await auth.api.getSession({ headers: headers || new Headers() });

export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = ctx.session;

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
  const session = ctx.session;

  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized access. Please log in.",
    });
  }

  return next({ ctx: { ...ctx, auth: session } });
});
