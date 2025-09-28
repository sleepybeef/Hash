
import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";

dotenv.config();


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Basic rate limiting: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);
app.use(cors());
app.use(express.json());
// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Centralized error handler middleware
import type { Request, Response, NextFunction } from "express";
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[Express Error]", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});
const PORT = 5000; // Force backend to use port 5000



(async () => {
  const httpServer = await registerRoutes(app);
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
