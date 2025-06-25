import { NextResponse } from "next/server";
import { withZodValidator, withAuth } from "../utils";
import { db } from "@/db";
import { tag, user, userTags } from "@/db/schema";
import { createTagSchema, tagFilterSchema } from "@/lib/validators/tag";
import { desc, eq, and } from "drizzle-orm";

// creating new tag
export const POST = withAuth(async (request, session) => {
  const body = await request.json();
  const data = await withZodValidator(createTagSchema, body);
  if ("error" in data) {
    return NextResponse.json({ error: data.error.format() }, { status: 400 });
  }
  const { site, metadata, usernames } = data;

  const newTag = await db
    .insert(tag)
    .values({
      id: crypto.randomUUID(),
      site: site,
      username: session?.user.username as string,
      metadata: metadata,
    })
    .returning();

  // linking the user
  const taggedUsers = usernames.map((username) => ({
    tagId: newTag[0].id,
    username: username,
  }));
  await db.insert(userTags).values(taggedUsers);
  return NextResponse.json(null, { status: 201 });
});

// get tags
// TODO: make filters better and robust
export const GET = withAuth(async (request, session) => {
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams.entries())
  searchParams['username'] = session?.user.username as string;
  const data = await withZodValidator(tagFilterSchema, searchParams);

  if ("error" in data) {
    return NextResponse.json({ error: data.error.format() }, { status: 400 });
  }
  const { username, site } = data;

  const tags = await db
    .select({
      owner: tag.username,
      metadata: tag.metadata,
    })
    .from(tag)
    .where(
      and(
        eq(tag.site, site as string),
        eq(userTags.username, username as string)
      )
    )
    .leftJoin(userTags, eq(userTags.tagId, tag.id));

  return NextResponse.json({
    tags,
  });
});
