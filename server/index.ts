
import express from "express";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";

dotenv.config();


const app = express();
app.use(express.json());
const PORT = 5000; // Force backend to use port 5000



(async () => {
  const httpServer = await registerRoutes(app);
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
