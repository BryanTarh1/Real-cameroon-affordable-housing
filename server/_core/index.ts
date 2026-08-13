import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { archiveStaleListingHandler } from "../listingFreshness";
import { createWhatsAppLeadEvent } from "../db";
import { authenticateLocalRequest } from "./localAuth";
import { sdk } from "./sdk";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/scheduled/archive-stale-listings", archiveStaleListingHandler);
  app.get("/api/listings/:listingId/whatsapp", async (req, res) => {
    let user = await authenticateLocalRequest(req);
    if (!user) {
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        user = null;
      }
    }
    if (!user) {
      res.status(401).type("text/plain").send("Please sign in to contact an Agent or Owner.");
      return;
    }
    if (user.isBanned) {
      res.status(403).type("text/plain").send("This account is suspended. Contact AHC support.");
      return;
    }
    try {
      const lead = await createWhatsAppLeadEvent(user.id, req.params.listingId);
      res.setHeader("Cache-Control", "no-store");
      res.redirect(302, lead.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "This listing cannot be contacted right now.";
      res.status(404).type("text/plain").send(message);
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
