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
import { createWhatsAppLeadEvent, getPublicListingContact, registerWalkthroughVideo } from "../db";
import { authenticateLocalRequest } from "./localAuth";
import { sdk } from "./sdk";
import { storagePut } from "../storage";

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

function escapeMarkup(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] ?? character));
}

function isSocialPreviewBot(userAgent: string) {
  return /facebookexternalhit|facebot|whatsapp|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|googlebot/i.test(userAgent);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.set("trust proxy", 1);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/scheduled/archive-stale-listings", archiveStaleListingHandler);
  app.post("/api/operations/verification-orders/:verificationOrderId/walkthrough", express.raw({ type: ["video/mp4", "video/webm"], limit: "35mb" }), async (req, res) => {
    let user = await authenticateLocalRequest(req);
    if (!user) {
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        user = null;
      }
    }
    if (!user || user.isBanned) {
      res.status(401).json({ error: "Sign in as the assigned Field Moderator to upload walkthrough evidence." });
      return;
    }
    if (user.role !== "moderator") {
      res.status(403).json({ error: "Only a Field Moderator can submit on-site walk-through evidence." });
      return;
    }
    const verificationOrderId = Number(req.params.verificationOrderId);
    const durationSeconds = Number(req.get("x-ahc-duration-seconds"));
    const listingMatch = req.get("x-ahc-listing-match");
    const contentType = req.get("content-type") ?? "";
    if (!Number.isInteger(verificationOrderId) || verificationOrderId <= 0 || !Number.isInteger(durationSeconds) || durationSeconds < 15 || durationSeconds > 30) {
      res.status(400).json({ error: "Provide a 15–30 second vertical walkthrough for a valid verification request." });
      return;
    }
    if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0 || req.body.length > 35 * 1024 * 1024) {
      res.status(400).json({ error: "Upload a non-empty MP4 or WebM video of 35 MB or less." });
      return;
    }
    if (!['matches', 'partially_matches', 'does_not_match'].includes(listingMatch ?? "")) {
      res.status(400).json({ error: "Record the moderator's listing-match assessment with the video." });
      return;
    }
    const extension = contentType === "video/webm" ? "webm" : "mp4";
    try {
      const uploaded = await storagePut(`field-verifications/${user.id}/walkthrough-${verificationOrderId}.${extension}`, req.body, contentType);
      const result = await registerWalkthroughVideo({
        operatorUserId: user.id,
        verificationOrderId,
        storageKey: uploaded.key,
        mediaUrl: uploaded.url,
        durationSeconds,
        orientation: "vertical",
        listingMatch: listingMatch as "matches" | "partially_matches" | "does_not_match",
      });
      res.status(201).json({ success: true, ...result, mediaUrl: uploaded.url });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "The walkthrough could not be saved." });
    }
  });
  app.get("/api/public/listings/:listingId/share-card.svg", async (req, res) => {
    const listing = await getPublicListingContact(req.params.listingId);
    if (!listing) {
      res.status(404).type("image/svg+xml").send("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1200\" height=\"630\"><rect width=\"100%\" height=\"100%\" fill=\"#132c34\"/></svg>");
      return;
    }
    const total = new Intl.NumberFormat("en-US").format(listing.costs.totalMoveInCashRequired);
    const title = escapeMarkup(listing.title);
    const location = escapeMarkup(`${listing.neighborhood}, ${listing.city}`);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.type("image/svg+xml").send(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#132c34"/><rect x="72" y="68" width="12" height="494" fill="#d78a1d"/><text x="124" y="150" fill="#f7f3e9" font-family="Arial, sans-serif" font-size="34" letter-spacing="3">AFFORDABLE HOUSING CAMEROON</text><text x="124" y="250" fill="#f7f3e9" font-family="Georgia, serif" font-size="58">${title}</text><text x="124" y="320" fill="#cbd7d4" font-family="Arial, sans-serif" font-size="32">${location} · approximate landmark area</text><text x="124" y="460" fill="#d78a1d" font-family="Arial, sans-serif" font-size="28" letter-spacing="2">TOTAL MOVE-IN CASH REQUIRED</text><text x="124" y="530" fill="#f7f3e9" font-family="Georgia, serif" font-size="64">${total} XAF</text></svg>`);
  });
  app.get("/property/:listingId", async (req, res, next) => {
    if (!isSocialPreviewBot(req.get("user-agent") ?? "")) return next();
    const listing = await getPublicListingContact(req.params.listingId);
    if (!listing) return next();
    const origin = `${req.protocol}://${req.get("host")}`;
    const propertyUrl = `${origin}/property/${encodeURIComponent(listing.id)}`;
    const imageUrl = `${origin}/api/public/listings/${encodeURIComponent(listing.id)}/share-card.svg`;
    const title = `${listing.title} · ${listing.neighborhood}, ${listing.city}`;
    const description = `Total Move-In Cash Required: ${new Intl.NumberFormat("en-US").format(listing.costs.totalMoveInCashRequired)} XAF. Approximate landmark area only. Open AHC for availability and sign-in-protected details.`;
    res.status(200).type("html").send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeMarkup(title)} | AHC</title><meta name="description" content="${escapeMarkup(description)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Affordable Housing Cameroon"><meta property="og:title" content="${escapeMarkup(title)}"><meta property="og:description" content="${escapeMarkup(description)}"><meta property="og:url" content="${escapeMarkup(propertyUrl)}"><meta property="og:image" content="${escapeMarkup(imageUrl)}"><meta name="twitter:card" content="summary_large_image"></head><body><p>Open <a href="${escapeMarkup(propertyUrl)}">this AHC property listing</a>.</p></body></html>`);
  });
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
