import { friendRequestTable, user, settings } from "./schema";

export type User = typeof user.$inferSelect;
export type FriendRequest = typeof friendRequestTable.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type SettingsInsert = typeof settings.$inferInsert;