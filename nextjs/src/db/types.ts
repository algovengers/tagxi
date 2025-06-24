import { friendRequestTable, user } from "./schema";

export type User = typeof user.$inferSelect;
export type FriendRequest = typeof friendRequestTable.$inferSelect;
