import type { Express, Request, Response } from "express";
import { createServer, Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVideoSchema, insertVideoLikeSchema, insertSubscriptionSchema, insertVideoViewSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Designate user as moderator (manual/admin action)
  app.post("/api/user/:id/moderator", async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      // Optionally, add authentication/authorization here for admin-only access
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.updateUserVerification(userId, user.isVerified); // Ensure user exists
      await storage.setModerator(userId, true);
      res.json({ message: "User designated as moderator." });
    } catch (error) {
      console.error("Set moderator error:", error);
      res.status(500).json({ message: "Failed to set moderator" });
    }
  });
  // Username change route (limit: once per 30 days, must be unique)
  app.post("/api/user/:id/username", async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { newUsername } = req.body;
      if (!newUsername || typeof newUsername !== "string") {
        return res.status(400).json({ message: "New username required" });
      }
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Check lastUsernameChange
      if (user.lastUsernameChange) {
        const now = new Date();
        const lastChange = new Date(user.lastUsernameChange);
        const diffDays = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < 30) {
          return res.status(403).json({ message: "You can only change your username once every 30 days." });
        }
      }
      // Check if username is taken
      const taken = await storage.getUserByUsername(newUsername);
      if (taken && taken.id !== userId) {
        return res.status(409).json({ message: "Username already taken." });
      }
      // Update username
      const updated = await storage.updateUsername(userId, newUsername);
      res.json({ message: "Username updated successfully.", user: updated });
    } catch (error) {
      console.error("Username update error:", error);
      res.status(500).json({ message: "Failed to update username" });
    }
  });
  // Get user by World ID (for World ID sign-in flow)
  app.get("/api/user/by-worldid/:worldId", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUserByWorldId(req.params.worldId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user by World ID error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  // World ID verification and user management
  app.post("/api/auth/verify", async (req: Request, res: Response) => {
    try {
      const { worldId, username } = req.body;

      if (!worldId) {
        return res.status(400).json({ message: "World ID is required" });
      }

      // Check if user already exists
      let user = await storage.getUserByWorldId(worldId);

      if (user) {
        // User exists, always return user and ignore any new username
        if (username && username !== user.username) {
          // If a different username is provided, reject the request
          return res.status(403).json({ message: "World ID already linked to a username. Cannot create another account." });
        }
        if (!user.isVerified) {
          user = await storage.updateUserVerification(user.id, true);
        }
        console.log("[API] /api/auth/verify response (existing user):", user);
        return res.json(user);
      }

      // If no user, require username for account creation
      if (!username) {
        return res.status(400).json({ message: "Username is required for new account" });
      }

      // Create new user
      const userData = insertUserSchema.parse({
        worldId,
        username,
        isVerified: true, // Assume World ID verification is valid
      });
      user = await storage.createUser(userData);
      console.log("[API] /api/auth/verify response (new user):", user);
      res.json(user);
    } catch (error) {
      // If duplicate username or worldId, return a clear error
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { // Postgres unique violation
        return res.status(409).json({ message: "World ID or username already exists" });
      }
      console.error("Verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  app.get("/api/user/:id", async (req: Request, res: Response) => {
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
  app.post("/api/videos/upload", upload.single('video'), async (req: Request, res: Response) => {
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

  app.get("/api/videos", async (req: Request, res: Response) => {
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

  app.get("/api/videos/:id", async (req: Request, res: Response) => {
    try {
      const video = await storage.getVideoWithCreator(req.params.id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      // Only show approved videos to regular users
      if (video.status !== "approved") {
        return res.status(404).json({ message: "Video not found" });
      }
      
      res.json(video);
    } catch (error) {
      console.error("Get video error:", error);
      res.status(500).json({ message: "Failed to get video" });
    }
  });

  app.post("/api/videos/:id/view", async (req: Request, res: Response) => {
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
  app.post("/api/videos/:id/like", async (req: Request, res: Response) => {
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

  app.post("/api/users/:id/subscribe", async (req: Request, res: Response) => {
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

  app.get("/api/users/:id/subscriptions", async (req: Request, res: Response) => {
    try {
      const subscriptions = await storage.getUserSubscriptions(req.params.id);
      res.json(subscriptions);
    } catch (error) {
      console.error("Get subscriptions error:", error);
      res.status(500).json({ message: "Failed to get subscriptions" });
    }
  });

  // Moderation routes
  app.get("/api/moderation/queue", async (req: Request, res: Response) => {
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

  app.post("/api/moderation/videos/:id/approve", async (req: Request, res: Response) => {
    try {
      const { moderatorId } = req.body;
      const videoId = req.params.id;

      // Validate moderator
      const moderator = await storage.getUser(moderatorId);
      if (!moderator || !moderator.isModerator) {
        return res.status(403).json({ message: "Moderator access required" });
      }

      // Get video info
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      if (video.status !== "pending") {
        return res.status(400).json({ message: "Video is not pending moderation" });
      }

      // Upload video file to Pinata
      const videoPath = path.join(process.cwd(), 'uploads', `${videoId}`); // assumes file is named by id
      let ipfsHash = null;
      try {
        const { uploadFileToPinata } = await import('./pinata');
        ipfsHash = await uploadFileToPinata(videoPath);
      } catch (err) {
        console.error('Pinata upload error:', err);
        return res.status(500).json({ message: 'Failed to upload to IPFS' });
      }

      // Approve video and save IPFS hash
      await storage.updateVideoStatus(videoId, "approved", moderatorId);
      await storage.updateVideoIPFS(videoId, ipfsHash);

      // TODO: Notify user (email, push, etc.)

      res.json({ message: "Video approved", ipfsHash });
    } catch (error) {
      console.error("Approve video error:", error);
      res.status(500).json({ message: "Failed to approve video" });
    }
  });

  app.post("/api/moderation/videos/:id/reject", async (req: Request, res: Response) => {
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

  app.get("/api/moderation/stats", async (req: Request, res: Response) => {
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

  // Get user by username (for admin UI)
  app.get("/api/user/by-username/:username", async (req: Request, res: Response) => {
    try {
      const username = req.params.username;
      console.log(`[API] Searching for username:`, username);
      const user = await storage.getUserByUsernameCI(username);
      console.log(`[API] Query result:`, user);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user by username error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Set moderator password (hash and store)
  app.post("/api/user/:id/mod-password", async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { password } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters." });
      }
      const hash = await bcrypt.hash(password, 10);
      await storage.setModeratorPassword(userId, hash);
      res.json({ message: "Moderator password set." });
    } catch (error) {
      console.error("Set moderator password error:", error);
      res.status(500).json({ message: "Failed to set moderator password" });
    }
  });

  // Verify moderator password
  app.post("/api/user/:id/verify-mod-password", async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { password } = req.body;
      const user = await storage.getUser(userId);
      if (!user || !user.mod_password) {
        return res.status(404).json({ message: "Moderator password not set." });
      }
      const valid = await bcrypt.compare(password, user.mod_password);
      if (!valid) {
        return res.status(403).json({ message: "Incorrect password." });
      }
      res.json({ message: "Password verified." });
    } catch (error) {
      console.error("Verify moderator password error:", error);
      res.status(500).json({ message: "Failed to verify moderator password" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
