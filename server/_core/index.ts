import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import sharp from "sharp";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { archiveStaleListingHandler } from "../listingFreshness";
import { expireOverdueViewingAvailabilityHandler } from "../viewingAvailability";
import { createWhatsAppLeadEvent, getPublicListingContact, listFreshPublicListings, registerWalkthroughVideo, updateCustomerProfileImageKey, updateOwnerAlertStatus, saveAgentIdentityDocument } from "../db";
import { authenticateLocalRequest } from "./localAuth";
import { ENV } from "./env";
import { storagePut } from "../storage";
import { isSocialPreviewBot } from "./sharedPropertyLink";
import { buildPropertyOpenGraphDocument } from "./openGraphPropertyPreview";
import { buildSanitizedLocalTestingSnapshot, isAuthorizedLocalTestingExport } from "../localTestingSnapshot";
import { extractMetaDeliveryStatuses, verifyMetaWebhookSignature } from "../ownerAlerts";

function escapeMarkup(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] ?? character));
}

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
  let lastLocalTestingSnapshotAt = 0;
  app.set("trust proxy", 1);
  app.get("/api/whatsapp/webhook", (req, res) => {
    const mode = typeof req.query["hub.mode"] === "string" ? req.query["hub.mode"] : "";
    const token = typeof req.query["hub.verify_token"] === "string" ? req.query["hub.verify_token"] : "";
    const challenge = typeof req.query["hub.challenge"] === "string" ? req.query["hub.challenge"] : "";
    if (!ENV.whatsappWebhookVerifyToken) {
      res.status(503).json({ error: "WhatsApp webhook verification is not configured." });
      return;
    }
    if (mode === "subscribe" && token === ENV.whatsappWebhookVerifyToken && challenge) {
      res.status(200).type("text/plain").send(challenge);
      return;
    }
    res.status(403).json({ error: "WhatsApp webhook verification failed." });
  });
  app.post("/api/whatsapp/webhook", express.raw({ type: "application/json", limit: "3mb" }), async (req, res) => {
    if (!ENV.whatsappAppSecret) {
      res.status(503).json({ error: "WhatsApp webhook signature verification is not configured." });
      return;
    }
    if (!Buffer.isBuffer(req.body) || !verifyMetaWebhookSignature(req.body, req.get("x-hub-signature-256"), ENV.whatsappAppSecret)) {
      res.status(401).json({ error: "Invalid WhatsApp webhook signature." });
      return;
    }
    try {
      const payload = JSON.parse(req.body.toString("utf8")) as unknown;
      const statuses = extractMetaDeliveryStatuses(payload);
      await Promise.all(statuses.map(status => updateOwnerAlertStatus(status.id, status.status, status.failureReason)));
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("WhatsApp delivery webhook processing failed", error);
      res.status(500).json({ error: "WhatsApp delivery webhook processing failed." });
    }
  });
  app.post("/api/agent/identity-document", express.raw({ type: ["image/jpeg", "image/jpg"], limit: "10mb" }), async (req, res) => {
    const user = await authenticateLocalRequest(req);
    const kind = typeof req.query.kind === "string" ? req.query.kind : "";
    if (!user || user.isBanned || user.role !== "user" || !["front", "back", "face"].includes(kind)) {
      res.status(401).json({ error: "Sign in as an Agent to upload identity documents." });
      return;
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0 || !/^image\/(jpeg|jpg)$/i.test(req.get("content-type") || "")) {
      res.status(415).json({ error: "Only non-empty JPG identity images are accepted." });
      return;
    }
    try {
      const storage = await storagePut(`private/agent-identity/${user.id}/${kind}-${Date.now()}.jpg`, req.body, "image/jpeg");
      await saveAgentIdentityDocument({ userId: user.id, kind: kind as "front" | "back" | "face", storageKey: storage.key });
      res.status(201).json({ uploaded: true, kind });
    } catch (error) {
      console.error("Agent identity upload failed", error);
      res.status(500).json({ error: "The identity image could not be stored." });
    }
  });
  app.post("/api/customer/profile-picture", express.raw({ type: ["image/jpeg", "image/jpg", "image/png"], limit: "2mb" }), async (req, res) => {
    const user = await authenticateLocalRequest(req);
    if (!user || user.isBanned) {
      res.status(401).json({ error: "Sign in to update your profile picture." });
      return;
    }
    const contentType = req.get("content-type") || "";
    if (!Buffer.isBuffer(req.body) || req.body.length === 0 || req.body.length > 2 * 1024 * 1024 || !/^image\/(jpeg|jpg|png)$/i.test(contentType)) {
      res.status(415).json({ error: "Choose a non-empty JPG or PNG image no larger than 2 MB." });
      return;
    }
    try {
      const image = sharp(req.body);
      const metadata = await image.metadata();
      const expectedFormat = /^image\/png/i.test(contentType) ? "png" : "jpeg";
      if (metadata.format !== expectedFormat || !metadata.width || !metadata.height || metadata.width > 4096 || metadata.height > 4096) {
        res.status(415).json({ error: "Choose a valid JPG or PNG image with dimensions up to 4096 × 4096 pixels." });
        return;
      }
      const normalizedAvatar = await image.rotate().resize(512, 512, { fit: "cover", position: "attention" }).jpeg({ quality: 85 }).toBuffer();
      const storage = await storagePut(`private/customer-avatar/${user.id}/avatar-${Date.now()}.jpg`, normalizedAvatar, "image/jpeg");
      const profileImageUrl = await updateCustomerProfileImageKey(user.id, storage.key);
      res.status(201).json({ uploaded: true, profileImageUrl });
    } catch (error) {
      console.error("Customer profile picture upload failed", error);
      res.status(415).json({ error: "The image could not be safely processed. Choose another JPG or PNG image." });
    }
  });
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/scheduled/archive-stale-listings", archiveStaleListingHandler);
  app.post("/api/scheduled/expire-overdue-viewing-availability", expireOverdueViewingAvailabilityHandler);
  app.get("/api/local-testing/snapshot", async (req, res) => {
    const token = ENV.localTestingExportToken;
    if (!token || token.length < 32) {
      res.status(503).json({ error: "The local testing export is not configured." });
      return;
    }
    if (!isAuthorizedLocalTestingExport(req.get("authorization"), token)) {
      res.status(401).json({ error: "A valid local testing export token is required." });
      return;
    }
    const now = Date.now();
    if (now - lastLocalTestingSnapshotAt < 60_000) {
      res.status(429).json({ error: "Wait at least one minute between local testing snapshots." });
      return;
    }
    try {
      const snapshot = buildSanitizedLocalTestingSnapshot(await listFreshPublicListings());
      lastLocalTestingSnapshotAt = now;
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Content-Disposition", `attachment; filename="ahc-local-testing-${now}.json"`);
      res.status(200).json(snapshot);
    } catch (error) {
      console.error("Local testing snapshot failed", error);
      res.status(500).json({ error: "The local testing snapshot could not be prepared." });
    }
  });
  app.post("/api/operations/verification-orders/:verificationOrderId/walkthrough", express.raw({ type: ["video/mp4", "video/webm"], limit: "35mb" }), async (req, res) => {
    const user = await authenticateLocalRequest(req);
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
  app.get("/api/public/listings/:listingId/share-card.png", async (req, res) => {
    const listing = await getPublicListingContact(req.params.listingId);
    if (!listing) {
      res.status(404).type("image/png").send(await sharp({ create: { width: 1200, height: 630, channels: 3, background: "#132c34" } }).png().toBuffer());
      return;
    }
    const total = new Intl.NumberFormat("en-US").format(listing.costs.totalMoveInCashRequired);
    const title = escapeMarkup(listing.title);
    const location = escapeMarkup(`${listing.neighborhood}, ${listing.city}`);
    const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f7f3e9"/><rect width="1200" height="200" fill="#132c34"/><path d="M830 98 960 18l130 80v175H830z" fill="#d78a1d" opacity=".95"/><path d="M860 119 960 58l100 61v118H860z" fill="#f7f3e9"/><path d="M930 142h60v95h-60z" fill="#132c34"/><rect x="72" y="66" width="14" height="486" fill="#d78a1d"/><text x="122" y="125" fill="#f7f3e9" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="3">AFFORDABLE HOUSING CAMEROON</text><text x="122" y="310" fill="#132c34" font-family="Georgia, serif" font-size="60">${title}</text><text x="122" y="370" fill="#476068" font-family="Arial, sans-serif" font-size="30">${location} · approximate landmark area</text><text x="122" y="465" fill="#b96c12" font-family="Arial, sans-serif" font-size="25" font-weight="700" letter-spacing="2">TOTAL MOVE-IN CASH REQUIRED</text><text x="122" y="535" fill="#132c34" font-family="Georgia, serif" font-size="64">${total} XAF</text></svg>`;
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.type("image/png").send(await sharp(Buffer.from(previewSvg)).png().toBuffer());
  });
  app.get("/property/:listingId", async (req, res, next) => {
    if (!isSocialPreviewBot(req.get("user-agent") ?? "")) {
      next();
      return;
    }
    const listing = await getPublicListingContact(req.params.listingId);
    if (!listing) return next();
    const origin = `${req.protocol}://${req.get("host")}`;
    res.status(200).type("html").send(buildPropertyOpenGraphDocument(listing, origin));
  });
  app.get("/api/listings/:listingId/whatsapp", async (req, res) => {
    const user = await authenticateLocalRequest(req);
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
