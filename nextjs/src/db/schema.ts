import {
  pgTable,
  text,
  timestamp,
  boolean,
  uniqueIndex,
  primaryKey,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified")
      .$defaultFn(() => false)
      .notNull(),
    image: text("image"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
    username: text("username").unique().notNull(),
  },
  (user) => [uniqueIndex("username_idx").on(user.username)]
);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  onboardingCompleted: boolean("onboarding_completed").default(false),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const tag = pgTable("tags", {
  id: text("id").primaryKey(),
  username: text("username")
    .notNull()
    .references(() => user.username, { onDelete: "cascade" }),
  site: text("site").notNull(),
  // basically details required for highlighting the info
  metadata: jsonb("metadata")
    .$type<{
      start_tag_xpath: string;
      end_tag_xpath: string;
      start_tag_offset: number;
      end_tag_offset: number;
    }>()
    .notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// an intermediate table to have many to many relationship between user and tags
// when making a tag -> the owner's userid will be stored and the usernames of the tagged user will be saved
export const userTags = pgTable(
  "user_tags",
  {
    username: text("username")
      .notNull()
      .references(() => user.username, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.username, table.tagId] })]
);

export const friendRequest = pgTable("friend_requests", {
  id: text("id").primaryKey(),
  senderId: text("sender_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  receiverId: text("receiver_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["pending", "accepted", "rejected"] })
    .notNull()
    .default("pending"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// Design desicion: userId1 < userId2 to avoid duplicates
export const friend = pgTable(
  "friends",
  {
    userId1: text("user_id_1").references(() => user.id, {
      onDelete: "cascade",
    }),
    userId2: text("user_id_2").references(() => user.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId1, table.userId2] })]
);

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  account: one(account),
  createdTags: many(tag),
  taggedAt: many(userTags),
  friends: many(friend),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const tagRelations = relations(tag, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [tag.username],
    references: [user.id],
  }),
  userTagged: many(userTags),
}));

export const userTagRelations = relations(userTags, ({ one }) => ({
  user: one(user, {
    fields: [userTags.username],
    references: [user.id],
  }),
  tag: one(tag, {
    fields: [userTags.tagId],
    references: [tag.id],
  }),
}));

export const friendRelations = relations(friend, ({ one }) => ({
  user1: one(user, {
    fields: [friend.userId1],
    references: [user.id],
  }),
  user2: one(user, {
    fields: [friend.userId2],
    references: [user.id],
  }),
}));
