import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import postgres from "postgres";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Strict CORS: allow only configured origins (comma-separated), block others for API routes
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  const allowEnv = process.env.CORS_ALLOW_ORIGIN || "";
  const allowed = allowEnv
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  if (origin && allowed.length > 0 && allowed.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  // If this is an API request from a browser with an Origin, and it's not allowed, block it
  if (req.path.startsWith("/api") && origin && allowed.length > 0 && !allowed.includes(origin)) {
    return res.status(403).json({ message: "CORS: origin not allowed" });
  }

  next();
});

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

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return res.status(500).json({ 
        status: "unhealthy", 
        database: "disconnected", 
        error: "DATABASE_URL not set" 
      });
    }

    const client = postgres(connectionString);
    await client`SELECT 1`;
    await client.end();
    res.json({ status: "healthy", database: "connected" });
  } catch (error) {
    res.status(500).json({ 
      status: "unhealthy", 
      database: "disconnected", 
      error: (error as Error).message 
    });
  }
});

(async () => {
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
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
