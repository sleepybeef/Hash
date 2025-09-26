import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  worldId: text("world_id").notNull().unique(),
  username: text("username").notNull().unique(),
  isVerified: boolean("is_verified").notNull().default(false),
  isModerator: boolean("is_moderator").notNull().default(false),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsernameChange: timestamp("last_username_change")
});

export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  category: text("category").notNull(),
  tags: text("tags").array(),
  visibility: text("visibility").notNull().default("public"), // public, unlisted, private
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  ipfsHash: text("ipfs_hash"),
  thumbnailHash: text("thumbnail_hash"),
  duration: integer("duration"), // in seconds
  fileSize: integer("file_size"), // in bytes
  viewCount: integer("view_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  dislikeCount: integer("dislike_count").notNull().default(0),
  moderatorId: varchar("moderator_id").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const videoLikes = pgTable("video_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  isLike: boolean("is_like").notNull(), // true for like, false for dislike
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriberId: varchar("subscriber_id").notNull().references(() => users.id),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const videoViews = pgTable("video_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  viewerIp: text("viewer_ip"),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  videos: many(videos, { relationName: "creator" }),
  moderatedVideos: many(videos, { relationName: "moderator" }),
  videoLikes: many(videoLikes),
  subscriptions: many(subscriptions, { relationName: "subscriber" }),
  subscribers: many(subscriptions, { relationName: "creator" }),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  creator: one(users, {
    fields: [videos.creatorId],
    references: [users.id],
    relationName: "creator",
  }),
  moderator: one(users, {
    fields: [videos.moderatorId],
    references: [users.id],
    relationName: "moderator",
  }),
  likes: many(videoLikes),
  views: many(videoViews),
}));

export const videoLikesRelations = relations(videoLikes, ({ one }) => ({
  user: one(users, {
    fields: [videoLikes.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [videoLikes.videoId],
    references: [videos.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  subscriber: one(users, {
    fields: [subscriptions.subscriberId],
    references: [users.id],
    relationName: "subscriber",
  }),
  creator: one(users, {
    fields: [subscriptions.creatorId],
    references: [users.id],
    relationName: "creator",
  }),
}));

export const videoViewsRelations = relations(videoViews, ({ one }) => ({
  video: one(videos, {
    fields: [videoViews.videoId],
    references: [videos.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVideoLikeSchema = createInsertSchema(videoLikes).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertVideoViewSchema = createInsertSchema(videoViews).omit({
  id: true,
  viewedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type VideoLike = typeof videoLikes.$inferSelect;
export type InsertVideoLike = z.infer<typeof insertVideoLikeSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type VideoView = typeof videoViews.$inferSelect;
export type InsertVideoView = z.infer<typeof insertVideoViewSchema>;
