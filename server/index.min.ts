import express from "express";
import { log, setupVite, serveStatic } from "./vite";

const app = express();

// Standard middleware for JSON requests 
app.use(express.json());

// Parse URL-encoded requests
app.use(express.urlencoded({ extended: true }));

// Set up Vite and static file serving
setupVite(app, null);

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  log(`Server is running on port ${port}`);
});
