import { NextResponse } from "next/server";
import { withAuth } from "../utils";

// creating new tag
export const POST = withAuth((request, session) => {
  const tagDetails = request.json();
});
