import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5174;

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the Vite build output
app.use(express.static(path.resolve(__dirname, "../dist/public")));

// Fallback route: all other requests serve index.html
app.get("*", (_req, res) => {
  res.sendFile(path.resolve(__dirname, "../dist/public/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
