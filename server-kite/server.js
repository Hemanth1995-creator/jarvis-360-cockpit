import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5050;

// Serve static files (HTML, CSS, JS) from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Route for checking server status
app.get("/kite/status", (req, res) => {
  res.json({ loggedIn: false, user: null });
});

// Route for handling login
app.get("/kite/login", (req, res) => {
  const loginUrl = kite.getLoginURL();
  res.json({ url: loginUrl });
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
