import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

export const withZodValidator = async <
  T extends z.ZodObject<any, any, any> | z.ZodArray<any> | z.ZodSchema<any>
>(
  schema: T,
  data: unknown
): Promise<z.infer<T> | { error: z.ZodError<any> }> => {
  const parsedData = await schema.safeParseAsync(data);

  if (parsedData.error) return { error: parsedData.error };
  return parsedData.data;
};
