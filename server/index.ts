import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed-database";

// Load environment variables
import * as dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Seed the database with initial data (skip for memory storage)
  if (process.env.USE_MEMORY_STORAGE !== 'true') {
    try {
      await seedDatabase();
      log("Database setup completed", "info");
    } catch (error) {
      log(`Error setting up database: ${error}`, "error");
    }
  } else {
    log("Using memory storage - skipping database setup", "info");
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    try {
      await setupVite(app, server);
    } catch (error) {
      log(`Error setting up Vite: ${error}`, "error");
    }
  } else {
    // Simple static serving for production
    const express = await import("express");
    const path = await import("path");
    const fs = await import("fs");
    
    const distPath = path.resolve(process.cwd(), "dist", "public");
    log(`Looking for static files at: ${distPath}`);
    
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.use("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
      log("Static files served successfully");
    } else {
      log("No static files found, serving basic response");
      app.use("*", (_req, res) => {
        res.send(`
          <!DOCTYPE html>
          <html>
            <head><title>PropertyLinkPro</title></head>
            <body>
              <h1>PropertyLinkPro API Server</h1>
              <p>Server is running! API endpoints are available.</p>
            </body>
          </html>
        `);
      });
    }
  }

  // Serve the app on Railway's assigned port or fallback to 8080
  // Railway provides PORT environment variable
  const port = process.env.PORT || 8080;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    log(`Server ready for Railway deployment`);
  });
})();
