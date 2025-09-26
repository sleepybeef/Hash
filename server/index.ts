import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 5000; // Force backend to use port 5000

// Example API route (optional)
// app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
