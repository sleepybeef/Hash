  // Moderation: fetch any video for review
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
     limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB max file size
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a comment
  app.post("/api/comments", async (req: Request, res: Response) => {
    try {
      const { videoId, userId, content } = req.body;
      if (!videoId || !userId || !content) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      // Basic input sanitization: reject comments containing HTML tags
      if (/<[a-z][\s\S]*>/i.test(content)) {
        return res.status(400).json({ message: "HTML tags are not allowed in comments." });
      }
      const comment = await storage.createComment(videoId, userId, content);
      // Fetch username for the user who posted the comment
      const user = await storage.getUser(userId);
      res.json({ ...comment, username: user?.username || undefined });
    } catch (error) {
      console.error("Create comment error:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Get comments for a video
  app.get("/api/comments/:videoId", async (req: Request, res: Response) => {
    try {
      const videoId = req.params.videoId;
      const comments = await storage.getComments(videoId);
      res.json(comments);
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Delete a comment (only by author)
  app.delete("/api/comments/:commentId", async (req: Request, res: Response) => {
    try {
      const commentId = req.params.commentId;
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }
      await storage.deleteComment(commentId, userId);
      res.json({ message: "Comment deleted" });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });
  // Serve .mp4 files from uploads with correct MIME type
  app.get('/uploads/:file', (req: Request, res: Response) => {
    const fileName = req.params.file;
    const filePath = path.join(process.cwd(), 'uploads', fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
    // Only set video/mp4 for .mp4 files
    if (fileName.endsWith('.mp4')) {
      res.type('video/mp4');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('ETag', '');
    }
    res.status(200).sendFile(filePath);
  });
  // Moderation: fetch any video for review
  app.get("/api/moderation/video/:id", async (req: Request, res: Response) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(401).json({ message: "User ID required" });
      }
      const user = await storage.getUser(userId as string);
      if (!user || !user.isModerator) {
        return res.status(403).json({ message: "Moderator access required" });
      }
      const video = await storage.getVideoWithCreator(req.params.id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      // Always return .mp4 file path for playback
      const playback_url = `/uploads/${video.id}.mp4`;
      res.json({ ...video, playback_url });
    } catch (error) {
      console.error("Get moderation video error:", error);
      res.status(500).json({ message: "Failed to get video for moderation" });
    }
  });
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
  // Only use allowed fields from req.body
  const title = req.body.title;
  const description = req.body.description;
  const category = req.body.category;
  const tags = req.body.tags;
  const visibility = req.body.visibility;
  const creatorId = req.body.creatorId;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "Video file is required" });
      }

      // Validate creator is verified
      const creator = await storage.getUser(creatorId);
      if (!creator || !creator.isVerified) {
        return res.status(403).json({ message: "Only verified users can upload videos" });
      }

      let finalFilePath = file.path;
      let finalFileSize = file.size;
      // Build videoData with only allowed fields
      const videoData = {
        title,
        description,
        creator_id: creatorId,
        category,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
        visibility: visibility || 'public',
        status: 'pending',
        duration: 0,
        file_size: finalFileSize,
      };
      console.log('DEBUG videoData for insertVideoSchema:', videoData);
      const parsedVideoData = insertVideoSchema.parse(videoData);
      const video = await storage.createVideo(parsedVideoData);

      // After DB insert, always convert and name file as `${video.id}.mp4`
      const ext = file.originalname.split('.').pop()?.toLowerCase();
      const tempPath = file.path;
      const mp4Path = path.join('uploads', `${video.id}.mp4`);
      try {
        if (ext && ext !== 'mp4') {
          const { convertMovToMp4 } = await import('./ffmpeg-util');
          await convertMovToMp4(tempPath, mp4Path);
          finalFilePath = mp4Path;
          const fs = await import('fs/promises');
          const stat = await fs.stat(mp4Path);
          finalFileSize = stat.size;
          console.log(`[UPLOAD] Converted and saved to ${mp4Path}, size: ${finalFileSize}`);
        } else {
          // If already mp4, just rename to match video.id
          const fs = await import('fs/promises');
          await fs.rename(tempPath, mp4Path);
          finalFilePath = mp4Path;
          const stat = await fs.stat(mp4Path);
          finalFileSize = stat.size;
          console.log(`[UPLOAD] Renamed mp4 to ${mp4Path}, size: ${finalFileSize}`);
        }
      } catch (err) {
        console.error(`[UPLOAD ERROR] Failed to convert or rename file for video ${video.id}:`, err);
      }

      // Store file path for moderation (in real implementation, you'd process the video)
      const videoPath = path.join(process.cwd(), finalFilePath);

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
      const videoPath = path.join(process.cwd(), 'uploads', `${videoId}.mp4`); // use correct file extension
      let ipfsHash = null;
      try {
        const { uploadFileToPinata } = await import('./pinata');
  ipfsHash = await uploadFileToPinata(videoPath, { name: `${videoId}.mp4` });
      } catch (err) {
        console.error('Pinata upload error:', err);
        return res.status(500).json({ message: 'Failed to upload to IPFS', error: String(err) });
      }

      // Approve video and save IPFS hash
      try {
        await storage.updateVideoStatus(videoId, "approved", moderatorId);
      } catch (err) {
        console.error(`[MODERATION] Error updating video status for ${videoId}:`, err);
        return res.status(500).json({ message: "Failed to update video status", error: String(err) });
      }
      try {
        await storage.updateVideoIPFS(videoId, ipfsHash);
      } catch (err) {
        console.error(`[MODERATION] Error updating IPFS hash for ${videoId}:`, err);
        return res.status(500).json({ message: "Failed to update IPFS hash", error: String(err) });
      }

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

      // Delete video file
      const videoFilePath = path.join(process.cwd(), 'uploads', `${videoId}.mp4`);
      try {
        await fs.promises.unlink(videoFilePath);
        console.log(`[MODERATION] Deleted file: ${videoFilePath}`);
      } catch (err) {
        console.warn(`[MODERATION] Could not delete file (may not exist): ${videoFilePath}`);
      }

      // Remove video from DB
      await storage.deleteVideo(videoId);

      res.json({ message: "Video rejected and purged" });
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
