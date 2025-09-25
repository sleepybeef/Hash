import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVideoSchema, insertVideoLikeSchema, insertSubscriptionSchema, insertVideoViewSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // World ID verification and user management
  app.post("/api/auth/verify", async (req, res) => {
    try {
      const { worldId, username } = req.body;
      
      if (!worldId || !username) {
        return res.status(400).json({ message: "World ID and username are required" });
      }

      // Check if user already exists
      let user = await storage.getUserByWorldId(worldId);
      
      if (!user) {
        // Create new user
        const userData = insertUserSchema.parse({
          worldId,
          username,
          isVerified: true, // Assume World ID verification is valid
        });
        user = await storage.createUser(userData);
      } else {
        // Update verification status
        user = await storage.updateUserVerification(user.id, true);
      }

      res.json(user);
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  app.get("/api/user/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Video operations
  app.post("/api/videos/upload", upload.single('video'), async (req, res) => {
    try {
      const { title, description, category, tags, visibility, creatorId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "Video file is required" });
      }

      // Validate creator is verified
      const creator = await storage.getUser(creatorId);
      if (!creator || !creator.isVerified) {
        return res.status(403).json({ message: "Only verified users can upload videos" });
      }

      const videoData = insertVideoSchema.parse({
        title,
        description,
        creatorId,
        category,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
        visibility: visibility || 'public',
        status: 'pending',
        duration: 0, // Will be updated after processing
        fileSize: file.size,
      });

      const video = await storage.createVideo(videoData);

      // Store file path for moderation (in real implementation, you'd process the video)
      const videoPath = path.join(process.cwd(), file.path);
      
      res.json({ 
        video, 
        message: "Video uploaded successfully and queued for moderation",
        tempPath: videoPath 
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload video" });
    }
  });

  app.get("/api/videos", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const videos = await storage.getVideos(limit, offset);
      res.json(videos);
    } catch (error) {
      console.error("Get videos error:", error);
      res.status(500).json({ message: "Failed to get videos" });
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const video = await storage.getVideoWithCreator(req.params.id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      console.error("Get video error:", error);
      res.status(500).json({ message: "Failed to get video" });
    }
  });

  app.post("/api/videos/:id/view", async (req, res) => {
    try {
      const videoId = req.params.id;
      const viewerIp = req.ip;

      const viewData = insertVideoViewSchema.parse({
        videoId,
        viewerIp,
      });

      await storage.recordView(viewData);
      res.json({ message: "View recorded" });
    } catch (error) {
      console.error("Record view error:", error);
      res.status(500).json({ message: "Failed to record view" });
    }
  });

  // Video interactions (likes, subscriptions)
  app.post("/api/videos/:id/like", async (req, res) => {
    try {
      const { userId, isLike } = req.body;
      const videoId = req.params.id;

      // Validate user is verified
      const user = await storage.getUser(userId);
      if (!user || !user.isVerified) {
        return res.status(403).json({ message: "Only verified users can like videos" });
      }

      // Check if user already liked/disliked this video
      const existingLike = await storage.getUserVideoLike(userId, videoId);
      
      if (existingLike) {
        if (existingLike.isLike === isLike) {
          // Remove like/dislike if same action
          await storage.removeLike(userId, videoId);
          res.json({ message: "Like removed" });
        } else {
          // Remove existing and add new
          await storage.removeLike(userId, videoId);
          const likeData = insertVideoLikeSchema.parse({ userId, videoId, isLike });
          await storage.likeVideo(likeData);
          res.json({ message: isLike ? "Video liked" : "Video disliked" });
        }
      } else {
        // Add new like/dislike
        const likeData = insertVideoLikeSchema.parse({ userId, videoId, isLike });
        await storage.likeVideo(likeData);
        res.json({ message: isLike ? "Video liked" : "Video disliked" });
      }
    } catch (error) {
      console.error("Like video error:", error);
      res.status(500).json({ message: "Failed to like video" });
    }
  });

  app.post("/api/users/:id/subscribe", async (req, res) => {
    try {
      const { subscriberId } = req.body;
      const creatorId = req.params.id;

      // Validate subscriber is verified
      const subscriber = await storage.getUser(subscriberId);
      if (!subscriber || !subscriber.isVerified) {
        return res.status(403).json({ message: "Only verified users can subscribe" });
      }

      // Check if already subscribed
      const existingSubscription = await storage.getSubscription(subscriberId, creatorId);
      
      if (existingSubscription) {
        // Unsubscribe
        await storage.unsubscribe(subscriberId, creatorId);
        res.json({ message: "Unsubscribed" });
      } else {
        // Subscribe
        const subscriptionData = insertSubscriptionSchema.parse({ subscriberId, creatorId });
        await storage.subscribe(subscriptionData);
        res.json({ message: "Subscribed" });
      }
    } catch (error) {
      console.error("Subscribe error:", error);
      res.status(500).json({ message: "Failed to subscribe" });
    }
  });

  app.get("/api/users/:id/subscriptions", async (req, res) => {
    try {
      const subscriptions = await storage.getUserSubscriptions(req.params.id);
      res.json(subscriptions);
    } catch (error) {
      console.error("Get subscriptions error:", error);
      res.status(500).json({ message: "Failed to get subscriptions" });
    }
  });

  // Moderation routes
  app.get("/api/moderation/queue", async (req, res) => {
    try {
      // Only allow moderators
      const { userId } = req.query;
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }

      const user = await storage.getUser(userId as string);
      if (!user || !user.isModerator) {
        return res.status(403).json({ message: "Moderator access required" });
      }

      const pendingVideos = await storage.getPendingVideos();
      res.json(pendingVideos);
    } catch (error) {
      console.error("Get moderation queue error:", error);
      res.status(500).json({ message: "Failed to get moderation queue" });
    }
  });

  app.post("/api/moderation/videos/:id/approve", async (req, res) => {
    try {
      const { moderatorId, ipfsHash, thumbnailHash } = req.body;
      const videoId = req.params.id;

      // Validate moderator
      const moderator = await storage.getUser(moderatorId);
      if (!moderator || !moderator.isModerator) {
        return res.status(403).json({ message: "Moderator access required" });
      }

      // Approve video
      await storage.updateVideoStatus(videoId, "approved", moderatorId);
      
      // Update IPFS hash if provided
      if (ipfsHash) {
        await storage.updateVideoIPFS(videoId, ipfsHash, thumbnailHash);
      }

      res.json({ message: "Video approved" });
    } catch (error) {
      console.error("Approve video error:", error);
      res.status(500).json({ message: "Failed to approve video" });
    }
  });

  app.post("/api/moderation/videos/:id/reject", async (req, res) => {
    try {
      const { moderatorId, reason } = req.body;
      const videoId = req.params.id;

      // Validate moderator
      const moderator = await storage.getUser(moderatorId);
      if (!moderator || !moderator.isModerator) {
        return res.status(403).json({ message: "Moderator access required" });
      }

      // Reject video
      await storage.updateVideoStatus(videoId, "rejected", moderatorId, reason);

      res.json({ message: "Video rejected" });
    } catch (error) {
      console.error("Reject video error:", error);
      res.status(500).json({ message: "Failed to reject video" });
    }
  });

  app.get("/api/moderation/stats", async (req, res) => {
    try {
      const { userId } = req.query;
      
      // Validate moderator
      const user = await storage.getUser(userId as string);
      if (!user || !user.isModerator) {
        return res.status(403).json({ message: "Moderator access required" });
      }

      const stats = await storage.getModerationStats();
      res.json(stats);
    } catch (error) {
      console.error("Get moderation stats error:", error);
      res.status(500).json({ message: "Failed to get moderation stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
