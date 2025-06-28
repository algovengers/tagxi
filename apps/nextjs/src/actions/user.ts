import { db, eq } from "@tagxi/db";

export const getUserByUsername = async (username: string) => {
  try {
    const user = await db.query.user.findFirst({
      where: (user) => eq(user.username, username),
    });
    return user ?? null;
  } catch (error) {
    console.error(error);
  }
  return null;
};
