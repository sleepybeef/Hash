import { 
  users, 
  videos, 
  videoLikes, 
  subscriptions, 
  videoViews,
  type User, 
  type InsertUser,
  type Video,
  type InsertVideo,
  type VideoLike,
  type InsertVideoLike,
  type Subscription,
  type InsertSubscription,
  type VideoView,
  type InsertVideoView
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByWorldId(worldId: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByUsernameCI(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserVerification(id: string, isVerified: boolean): Promise<User>;
  updateUsername(id: string, newUsername: string): Promise<User>;

  // Video operations
  createVideo(video: InsertVideo): Promise<Video>;
  getVideo(id: string): Promise<Video | undefined>;
  getVideoWithCreator(id: string): Promise<(Video & { creator: User }) | undefined>;
  getVideos(limit?: number, offset?: number): Promise<(Video & { creator: User })[]>;
  getPendingVideos(): Promise<(Video & { creator: User })[]>;
  updateVideoStatus(id: string, status: string, moderatorId?: string, rejectionReason?: string): Promise<Video>;
  updateVideoIPFS(id: string, ipfsHash: string, thumbnailHash?: string): Promise<Video>;
  incrementViewCount(id: string): Promise<void>;

  // Video likes
  likeVideo(videoLike: InsertVideoLike): Promise<VideoLike>;
  removeLike(userId: string, videoId: string): Promise<void>;
  getUserVideoLike(userId: string, videoId: string): Promise<VideoLike | undefined>;
  updateVideoLikeCounts(videoId: string): Promise<void>;

  // Subscriptions
  subscribe(subscription: InsertSubscription): Promise<Subscription>;
  unsubscribe(subscriberId: string, creatorId: string): Promise<void>;
  getSubscription(subscriberId: string, creatorId: string): Promise<Subscription | undefined>;
  getUserSubscriptions(subscriberId: string): Promise<(Subscription & { creator: User })[]>;

  // Video views
  recordView(view: InsertVideoView): Promise<VideoView>;

  // Moderation stats
  getModerationStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
  }>;

  // Moderator operations
  setModerator(id: string, isModerator: boolean): Promise<void>;
  setModeratorPassword(id: string, hash: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;
    return { ...user, mod_password: user.mod_password };
  }

  async getUserByWorldId(worldId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.worldId, worldId));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByUsernameCI(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`LOWER(username) = LOWER(${username})`);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserVerification(id: string, isVerified: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isVerified })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUsername(id: string, newUsername: string): Promise<User> {
    const now = new Date();
    await db.update(users)
      .set({ username: newUsername, lastUsernameChange: now })
      .where(eq(users.id, id));
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found after username update");
    return user;
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const [createdVideo] = await db
      .insert(videos)
      .values(video)
      .returning();
    return createdVideo;
  }

  async getVideo(id: string): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video || undefined;
  }

  async getVideoWithCreator(id: string): Promise<(Video & { creator: User }) | undefined> {
    const [result] = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        creatorId: videos.creatorId,
        category: videos.category,
        tags: videos.tags,
        visibility: videos.visibility,
        status: videos.status,
        ipfsHash: videos.ipfsHash,
        thumbnailHash: videos.thumbnailHash,
        duration: videos.duration,
        fileSize: videos.fileSize,
        viewCount: videos.viewCount,
        likeCount: videos.likeCount,
        dislikeCount: videos.dislikeCount,
        moderatorId: videos.moderatorId,
        moderatedAt: videos.moderatedAt,
        rejectionReason: videos.rejectionReason,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        creator: {
          id: users.id,
          worldId: users.worldId,
          username: users.username,
          isVerified: users.isVerified,
          isModerator: users.isModerator,
          avatar: users.avatar,
          createdAt: users.createdAt,
          lastUsernameChange: users.lastUsernameChange,
          mod_password: users.mod_password, // Add mod_password here
        }
      })
      .from(videos)
      .innerJoin(users, eq(videos.creatorId, users.id))
      .where(eq(videos.id, id));

    return result || undefined;
  }

  async getVideos(limit = 20, offset = 0): Promise<(Video & { creator: User })[]> {
    const results = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        creatorId: videos.creatorId,
        category: videos.category,
        tags: videos.tags,
        visibility: videos.visibility,
        status: videos.status,
        ipfsHash: videos.ipfsHash,
        thumbnailHash: videos.thumbnailHash,
        duration: videos.duration,
        fileSize: videos.fileSize,
        viewCount: videos.viewCount,
        likeCount: videos.likeCount,
        dislikeCount: videos.dislikeCount,
        moderatorId: videos.moderatorId,
        moderatedAt: videos.moderatedAt,
        rejectionReason: videos.rejectionReason,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        creator: {
          id: users.id,
          worldId: users.worldId,
          username: users.username,
          isVerified: users.isVerified,
          isModerator: users.isModerator,
          avatar: users.avatar,
          createdAt: users.createdAt,
          lastUsernameChange: users.lastUsernameChange,
          mod_password: users.mod_password, // Add mod_password here
        }
      })
      .from(videos)
      .innerJoin(users, eq(videos.creatorId, users.id))
      .where(eq(videos.status, "approved"))
      .orderBy(desc(videos.createdAt))
      .limit(limit)
      .offset(offset);

    return results;
  }

  async getPendingVideos(): Promise<(Video & { creator: User })[]> {
    const results = await db
      .select({
        id: videos.id,
        title: videos.title,
        description: videos.description,
        creatorId: videos.creatorId,
        category: videos.category,
        tags: videos.tags,
        visibility: videos.visibility,
        status: videos.status,
        ipfsHash: videos.ipfsHash,
        thumbnailHash: videos.thumbnailHash,
        duration: videos.duration,
        fileSize: videos.fileSize,
        viewCount: videos.viewCount,
        likeCount: videos.likeCount,
        dislikeCount: videos.dislikeCount,
        moderatorId: videos.moderatorId,
        moderatedAt: videos.moderatedAt,
        rejectionReason: videos.rejectionReason,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        creator: {
          id: users.id,
          worldId: users.worldId,
          username: users.username,
          isVerified: users.isVerified,
          isModerator: users.isModerator,
          avatar: users.avatar,
          createdAt: users.createdAt,
          lastUsernameChange: users.lastUsernameChange,
          mod_password: users.mod_password, // Add mod_password here
        }
      })
      .from(videos)
      .innerJoin(users, eq(videos.creatorId, users.id))
      .where(eq(videos.status, "pending"))
      .orderBy(videos.createdAt);

    return results;
  }

  async updateVideoStatus(id: string, status: string, moderatorId?: string, rejectionReason?: string): Promise<Video> {
    const [video] = await db
      .update(videos)
      .set({ 
        status, 
        moderatorId, 
        rejectionReason, 
        moderatedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(videos.id, id))
      .returning();
    return video;
  }

  async updateVideoIPFS(id: string, ipfsHash: string, thumbnailHash?: string): Promise<Video> {
    const [video] = await db
      .update(videos)
      .set({ 
        ipfsHash, 
        thumbnailHash,
        updatedAt: new Date()
      })
      .where(eq(videos.id, id))
      .returning();
    return video;
  }

  async incrementViewCount(id: string): Promise<void> {
    await db
      .update(videos)
      .set({ 
        viewCount: sql`${videos.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(videos.id, id));
  }

  async likeVideo(videoLike: InsertVideoLike): Promise<VideoLike> {
    const [like] = await db
      .insert(videoLikes)
      .values(videoLike)
      .returning();
    
    // Update video like counts
    await this.updateVideoLikeCounts(videoLike.videoId);
    
    return like;
  }

  async removeLike(userId: string, videoId: string): Promise<void> {
    await db
      .delete(videoLikes)
      .where(and(
        eq(videoLikes.userId, userId),
        eq(videoLikes.videoId, videoId)
      ));
    
    // Update video like counts
    await this.updateVideoLikeCounts(videoId);
  }

  async getUserVideoLike(userId: string, videoId: string): Promise<VideoLike | undefined> {
    const [like] = await db
      .select()
      .from(videoLikes)
      .where(and(
        eq(videoLikes.userId, userId),
        eq(videoLikes.videoId, videoId)
      ));
    return like || undefined;
  }

  async updateVideoLikeCounts(videoId: string): Promise<void> {
    const [likeCounts] = await db
      .select({
        likes: count(sql`CASE WHEN ${videoLikes.isLike} = true THEN 1 END`),
        dislikes: count(sql`CASE WHEN ${videoLikes.isLike} = false THEN 1 END`),
      })
      .from(videoLikes)
      .where(eq(videoLikes.videoId, videoId));

    await db
      .update(videos)
      .set({
        likeCount: likeCounts.likes,
        dislikeCount: likeCounts.dislikes,
        updatedAt: new Date()
      })
      .where(eq(videos.id, videoId));
  }

  async subscribe(subscription: InsertSubscription): Promise<Subscription> {
    const [sub] = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();
    return sub;
  }

  async unsubscribe(subscriberId: string, creatorId: string): Promise<void> {
    await db
      .delete(subscriptions)
      .where(and(
        eq(subscriptions.subscriberId, subscriberId),
        eq(subscriptions.creatorId, creatorId)
      ));
  }

  async getSubscription(subscriberId: string, creatorId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.subscriberId, subscriberId),
        eq(subscriptions.creatorId, creatorId)
      ));
    return subscription || undefined;
  }

  async getUserSubscriptions(subscriberId: string): Promise<(Subscription & { creator: User })[]> {
    const results = await db
      .select({
        id: subscriptions.id,
        subscriberId: subscriptions.subscriberId,
        creatorId: subscriptions.creatorId,
        createdAt: subscriptions.createdAt,
        creator: {
          id: users.id,
          worldId: users.worldId,
          username: users.username,
          isVerified: users.isVerified,
          isModerator: users.isModerator,
          avatar: users.avatar,
          createdAt: users.createdAt,
          lastUsernameChange: users.lastUsernameChange,
          mod_password: users.mod_password, // Add mod_password here
        }
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.creatorId, users.id))
      .where(eq(subscriptions.subscriberId, subscriberId));

    return results;
  }

  async recordView(view: InsertVideoView): Promise<VideoView> {
    const [recordedView] = await db
      .insert(videoViews)
      .values(view)
      .returning();
    
    // Increment view count
    await this.incrementViewCount(view.videoId);
    
    return recordedView;
  }

  async getModerationStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [stats] = await db
      .select({
        pending: count(sql`CASE WHEN ${videos.status} = 'pending' THEN 1 END`),
        approved: count(sql`CASE WHEN ${videos.status} = 'approved' AND ${videos.moderatedAt} >= ${today} THEN 1 END`),
        rejected: count(sql`CASE WHEN ${videos.status} = 'rejected' AND ${videos.moderatedAt} >= ${today} THEN 1 END`),
      })
      .from(videos);

    return stats;
  }

  async setModerator(id: string, isModerator: boolean): Promise<void> {
    await db.update(users)
      .set({ isModerator })
      .where(eq(users.id, id));
  }

  async setModeratorPassword(id: string, hash: string): Promise<void> {
    await db.update(users)
      .set({ mod_password: hash })
      .where(eq(users.id, id));
  }
}

export const storage = new DatabaseStorage();
