import { friendRequestTable, user, settings, friendTable } from "./schema";

export type User = typeof user.$inferSelect;
export type FriendRequest = typeof friendRequestTable.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type SettingsInsert = typeof settings.$inferInsert;
export type Friend = {
  createdAt: string;
  user: { username: string | null; name: string | null; image: string | null };
};
