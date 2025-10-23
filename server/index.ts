
import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";

dotenv.config();


console.log('PINATA_JWT:', process.env.PINATA_JWT);
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
// Security headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // allow media embeds in dev
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        "style-src": ["'self'", "'unsafe-inline'", "https:"],
        "img-src": ["'self'", "data:", "https:"],
        "connect-src": [
          "'self'",
          "http://localhost:5000",
          "http://localhost:5173",
          "https://*.supabase.co",
          "https://*.mypinata.cloud",
          "https://ipfs.io"
        ],
        "media-src": ["'self'", "blob:", "https:"],
        "frame-src": ["'self'", "https:"],
      },
    },
  })
);
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173", // Added for Vite dev server
    "https://hashactual.vercel.app"
  ],
  credentials: true
}));
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
