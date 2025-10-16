import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import postgres from "postgres";
import { storage } from "./storage";
import { insertGoldRateSchema } from "@shared/schema";

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

async function performRateSync(): Promise<void> {
  try {
    const apiUrl = "https://www.businessmantra.info/gold_rates/devi_gold_rate/api.php";
    const resp = await fetch(apiUrl, { cache: "no-store" });
    if (!resp.ok) {
      log(`rate sync: external fetch failed (${resp.status})`);
      return;
    }
    const data = await resp.json() as Record<string, number>;

    const gold24kSale = Number(data["24K Gold"]);
    const silverSalePerGram = Number(data["Silver"]);
    if (!Number.isFinite(gold24kSale) || !Number.isFinite(silverSalePerGram)) {
      log("rate sync: API missing fields");
      return;
    }

    const calc = await storage.getRateSettings();
    const perc_24k_purchase = calc?.perc_24k_purchase ?? 0.985;
    const perc_22k_sale = calc?.perc_22k_sale ?? 0.92;
    const perc_22k_purchase = calc?.perc_22k_purchase ?? 0.90;
    const perc_18k_sale = calc?.perc_18k_sale ?? 0.86;
    const perc_18k_purchase = calc?.perc_18k_purchase ?? 0.80;
    const silver_purchase_offset = calc?.silver_purchase_offset ?? -5000;

    // Silver from API is per 10 grams, convert to per kg (1000g / 10g = 100x)
    const silverPerKgSale = silverSalePerGram * 100;

    const round10 = (n: number) => Math.round(n / 10) * 10;

    const payload = {
      gold_24k_sale: round10(gold24kSale),
      gold_24k_purchase: round10(gold24kSale * perc_24k_purchase),
      gold_22k_sale: round10(gold24kSale * perc_22k_sale),
      gold_22k_purchase: round10(gold24kSale * perc_22k_purchase),
      gold_18k_sale: round10(gold24kSale * perc_18k_sale),
      gold_18k_purchase: round10(gold24kSale * perc_18k_purchase),
      silver_per_kg_sale: round10(silverPerKgSale),
      silver_per_kg_purchase: round10(silverPerKgSale + silver_purchase_offset),
      is_active: true,
    };

    const validated = insertGoldRateSchema.parse(payload);
    await storage.createGoldRate(validated);
    log("rate sync: stored new rates");
  } catch (err) {
    log(`rate sync error: ${(err as Error).message}`);
  }
}

function scheduleRateSync() {
  let cancelled = false;

  const loop = async () => {
    if (cancelled) return;

    // perform an immediate sync
    await performRateSync();

    // read interval from settings each cycle to reflect updates
    const calc = await storage.getRateSettings();
    const minutes = calc?.check_interval_minutes ?? 5;
    const intervalMs = Math.max(1, minutes) * 60_000;

    // wait, then repeat
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    if (cancelled) return;
    loop();
  };

  loop();

  return () => { cancelled = true; };
}

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

  // start periodic rate sync
  scheduleRateSync();

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
