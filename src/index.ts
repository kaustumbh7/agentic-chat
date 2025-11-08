import dotenv from "dotenv";

// Load environment variables FIRST before any other imports
dotenv.config();

import express, { Request, Response } from "express";
import { streamGeminiResponse } from "./gemini";
import { ChatRequest } from "./types";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS middleware (for development)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

/**
 * POST /chat endpoint
 * Accepts a query and streams agentic reasoning + response
 */
app.post("/chat", async (req: Request, res: Response) => {
  try {
    const { query }: ChatRequest = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        error:
          "Invalid request. 'query' field is required and must be a string.",
      });
    }

    // Set up Server-Sent Events (SSE)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

    // Stream the agentic response
    try {
      for await (const event of streamGeminiResponse(query)) {
        // Format as SSE: data: <json>\n\n
        const data = JSON.stringify(event);
        res.write(`data: ${data}\n\n`);

        // Flush the response to ensure immediate delivery
        if (typeof (res as any).flush === "function") {
          (res as any).flush();
        }
      }

      // Send end marker
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (streamError) {
      console.error("Streaming error:", streamError);
      const errorEvent = JSON.stringify({
        type: "error",
        content: `Streaming error: ${
          streamError instanceof Error ? streamError.message : "Unknown error"
        }`,
      });
      res.write(`data: ${errorEvent}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error("Request error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    } else {
      res.end();
    }
  }
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Agentic Chat Server running on http://localhost:${PORT}`);
  console.log(`📡 POST /chat endpoint ready`);
  console.log(`💚 Health check: GET /health`);
});
