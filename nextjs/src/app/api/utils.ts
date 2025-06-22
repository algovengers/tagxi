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
): Promise<z.infer<T>> => {
  try {
    const parsedData = await schema.parseAsync(data);
    return parsedData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", errors: error.formErrors.fieldErrors },
        { status: 400 }
      );
    }
    throw error;
  }
};
