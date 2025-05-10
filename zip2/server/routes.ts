import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import multer from "multer";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { insertUserSchema, insertSkillSchema, insertUserSkillSchema, insertMessageSchema, insertContentSchema } from "@shared/schema";
import OpenAI from "openai";
import { fileURLToPath } from "url";
import { generateLearningRecommendations, summarizeDocument } from "./services/openai";
import { chatbotService } from "./services/chatbot";
import { storage } from "./storage";

// Define the skill form schema
const skillFormSchema = z.object({
  type: z.enum(["teach", "learn"]),
  name: z.string().min(2, "Skill name must be at least 2 characters"),
  proficiency: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]),
  description: z.string().optional(),
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "../uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Create a basic in-memory authentication system
const sessions: Record<string, { userId: number, username: string }> = {};

export async function registerRoutes(app: express.Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup WebSocket for real-time messaging
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/api/ws",
  });

  console.log("WebSocket server initialized on path: /api/ws");

  wss.on("connection", (ws, req) => {
    console.log("New WebSocket connection established");

    // Send a welcome message
    ws.send(
      JSON.stringify({
        type: "system",
        content: "Connected to chat server",
        timestamp: new Date().toISOString(),
      })
    );

    ws.on("message", (message) => {
      try {
        console.log(`Received message: ${message.toString()}`);
        const data = JSON.parse(message.toString());

        if (data.type === "message") {
          // Broadcast message to all other clients
          wss.clients.forEach((client) => {
            if (client !== ws) {
              client.send(
                JSON.stringify({
                  type: "message",
                  senderId:
                    data.sessionId && sessions[data.sessionId]
                      ? sessions[data.sessionId].userId
                      : "system",
                  senderName:
                    data.sessionId && sessions[data.sessionId]
                      ? sessions[data.sessionId].username
                      : "System",
                  content: data.content,
                  timestamp: new Date().toISOString(),
                })
              );
            }
          });
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });
  });

  // Auth endpoints
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const newUser = await storage.createUser(userData);

      // Create a session
      const sessionId = Math.random().toString(36).substring(2, 15);
      sessions[sessionId] = { userId: newUser.id, username: newUser.username };

      res.status(201).json({
        user: { id: newUser.id, username: newUser.username },
        sessionId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Create a session
      const sessionId = Math.random().toString(36).substring(2, 15);
      sessions[sessionId] = { userId: user.id, username: user.username };

      res.json({
        user: { id: user.id, username: user.username },
        sessionId,
      });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  // Middleware to check if user is authenticated
  const authenticate = (req: any, res: any, next: any) => {
    const sessionId = req.headers.authorization;

    if (!sessionId || !sessions[sessionId]) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = { id: sessions[sessionId].userId, username: sessions[sessionId].username };
    next();
  };

  // User endpoints
  app.get("/api/users/current", authenticate, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password for security
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  app.patch("/api/users/current", authenticate, async (req: any, res) => {
    try {
      const updatedUser = await storage.updateUser(req.user.id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password for security
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get("/api/users/current/skills", authenticate, async (req: any, res) => {
    try {
      const type = req.query.type;
      const userSkills = await storage.getUserSkills(req.user.id, type);
      res.json(userSkills);
    } catch (error) {
      console.error("Error fetching user skills:", error);
      res.status(500).json({ message: "Failed to fetch user skills" });
    }
  });

  app.get("/api/users/current/skill-recommendations", authenticate, async (req: any, res) => {
    try {
      // Get the user's current skills
      const userSkills = await storage.getUserSkills(req.user.id);

      if (!userSkills || userSkills.length === 0) {
        return res.status(404).json({ message: "No skills found to base recommendations on" });
      }

      // Use OpenAI to generate personalized learning recommendations
      const recommendations = await generateLearningRecommendations(userSkills);

      res.json({ recommendations });
    } catch (error) {
      console.error("Error generating skill recommendations:", error);
      res.status(500).json({ message: "Failed to generate skill recommendations" });
    }
  });

  app.get("/api/users/current/dashboard", authenticate, async (req: any, res) => {
    try {
      const stats = await storage.getUserStats(req.user.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/users/current/stats", authenticate, async (req: any, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      const currentUserStats = await storage.getUserStats(req.user.id);

      res.json({
        leaderboard,
        currentUserStats,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Skill endpoints
  app.post("/api/skills", authenticate, async (req: any, res) => {
    try {
      const skillData = insertSkillSchema.parse(req.body);
      const newSkill = await storage.createSkill(skillData);
      res.status(201).json(newSkill);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid skill data", errors: error.errors });
      }
      console.error("Error creating skill:", error);
      res.status(500).json({ message: "Failed to create skill" });
    }
  });

  // File upload setup using multer
  const upload = multer({
    dest: path.join(uploadsDir, "uploads"),
    fileFilter: (req, file, cb) => {
      if (file.mimetype === "application/pdf" || file.mimetype === "video/mp4") {
        return cb(null, true);
      }
      return cb(new Error("File must be a PDF or MP4"));
    },
  });

  // File upload route
  app.post("/api/uploads", authenticate, upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Handle file processing (for example, PDF summary generation)
      if (file.mimetype === "application/pdf") {
        const summary = await summarizeDocument(file.path);
        res.json({ message: "PDF processed", summary });
      } else if (file.mimetype === "video/mp4") {
        // For videos, we may use OpenAI to generate summaries or recommendations
        const summary = "Video summary is under construction"; // Replace with actual logic
        res.json({ message: "Video uploaded", summary });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to process file" });
    }
  });

  return httpServer;
}