import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type ApiHandler = (
  request: NextRequest,
  session: Awaited<ReturnType<typeof auth.api.getSession>>
) => Promise<NextResponse | Response>;

export const withAuth = (handler: ApiHandler) => {
  return async (request: NextRequest) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { message: "unauthorised" },
        {
          status: 401,
        }
      );
    }
    return handler(request, session);
  };
};
