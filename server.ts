import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { randomBytes, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === "production";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.disable("x-powered-by");
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.APP_BASE_URL ? [process.env.APP_BASE_URL] : true }));
app.use(express.json({ limit: "20kb" }));
app.use("/api/", rateLimit({ windowMs: 60_000, limit: 100, standardHeaders: true, legacyHeaders: false }));

const supportSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  category: z.enum(["internet", "billing", "mobile", "tv-streaming", "accessibility", "other"]),
  message: z.string().trim().min(10).max(2000)
});

function safeEqual(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
function configuredAdminIds(): Set<string> {
  return new Set((process.env.TELEGRAM_ADMIN_IDS || "").split(",").map(x => x.trim()).filter(Boolean));
}
function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_WEBHOOK_SECRET);
}
async function sendTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_NOTIFICATION_CHAT_ID || [...configuredAdminIds()][0],
      text,
      disable_web_page_preview: true
    })
  });
  return response.ok;
}
function publicRequest(r: { reference: string; status: string; category: string; createdAt: Date }) {
  return { reference: r.reference, status: r.status, category: r.category, createdAt: r.createdAt };
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "connect-guide-independent-portal",
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    telegramConfigured: telegramConfigured(),
    authProviderConfigured: Boolean(process.env.AUTH_PROVIDER_CLIENT_ID && process.env.AUTH_PROVIDER_CLIENT_SECRET),
    timestamp: new Date().toISOString()
  });
});

app.get("/api/public-info", (_req, res) => {
  res.json({
    title: "Independent Comcast & Xfinity information guide",
    disclaimer: "This is an independent demonstration project, not an official Comcast or Xfinity website. It does not connect to customer accounts.",
    officialLinks: [
      { label: "Comcast Corporate", url: "https://corporate.comcast.com/" },
      { label: "Xfinity", url: "https://www.xfinity.com/" },
      { label: "Xfinity Support", url: "https://www.xfinity.com/support/" },
      { label: "Comcast Investor Relations", url: "https://www.cmcsa.com/" }
    ]
  });
});

app.post("/api/support-requests", rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: true, legacyHeaders: false }), async (req, res, next) => {
  try {
    const parsed = supportSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Please check the form fields and try again.", issues: parsed.error.flatten().fieldErrors });
    if (!process.env.DATABASE_URL) return res.status(503).json({ error: "Support request storage is not configured yet. Please use the official Xfinity support website." });
    const reference = `CG-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const created = await prisma.supportRequest.create({
      data: { ...parsed.data, reference, events: { create: { action: "SUBMITTED", actor: "website-user", details: "Support request submitted through independent guide." } } }
    });
    const note = `New Connect Guide support request ${created.reference}\nCategory: ${created.category}\nName: ${created.name}\nEmail: ${created.email}\nMessage: ${created.message}\nThis is an independent portal request; it is not an official Comcast ticket.`;
    try { await sendTelegram(note); } catch (err) { console.error("Telegram notification failed", err instanceof Error ? err.message : "unknown"); }
    res.status(201).json({ request: publicRequest(created), notice: "Reference created for this independent portal. This is not an official Comcast/Xfinity support ticket." });
  } catch (err) { next(err); }
});

app.get("/api/support-requests/:reference", async (req, res, next) => {
  try {
    if (!process.env.DATABASE_URL) return res.status(503).json({ error: "Request tracking is not configured." });
    const record = await prisma.supportRequest.findUnique({ where: { reference: req.params.reference } });
    if (!record) return res.status(404).json({ error: "No request found for that reference." });
    res.json({ request: publicRequest(record), notice: "This tracks a request made to this independent portal only." });
  } catch (err) { next(err); }
});

// Telegram webhook: validate Telegram's secret header and never accept credentials.
app.post("/api/telegram/webhook", async (req, res, next) => {
  try {
    const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
    const supplied = req.header("X-Telegram-Bot-Api-Secret-Token") || "";
    if (!expected || !safeEqual(expected, supplied)) return res.status(401).json({ error: "Unauthorized webhook." });
    const update = req.body as any;
    const message = update?.message;
    const text = typeof message?.text === "string" ? message.text.trim() : "";
    const telegramId = String(message?.from?.id ?? "");
    if (!text.startsWith("/")) return res.sendStatus(200);
    if (!configuredAdminIds().has(telegramId)) {
      if (message?.chat?.id && process.env.TELEGRAM_BOT_TOKEN) {
        try { await sendTelegram("A command was received from an unapproved Telegram user. No action was taken."); } catch {}
      }
      return res.sendStatus(200);
    }
    const match = text.match(/^\/(approve|reject)\s+(CG-[A-Z0-9-]+)(?:\s+(.{1,300}))?$/i);
    if (!match) return res.sendStatus(200);
    if (!process.env.DATABASE_URL) return res.status(503).json({ error: "Database is not configured." });
    const action = match[1].toUpperCase() === "APPROVE" ? "APPROVED" : "REJECTED";
    const reference = match[2].toUpperCase();
    const note = (match[3] || "").trim() || null;
    const record = await prisma.supportRequest.findUnique({ where: { reference } });
    if (!record || record.status !== "PENDING") return res.sendStatus(200);
    await prisma.$transaction([
      prisma.supportRequest.update({ where: { id: record.id }, data: { status: action, adminNote: note } }),
      prisma.requestEvent.create({ data: { requestId: record.id, action, actor: `telegram:${telegramId}`, details: note } }),
      prisma.adminAuditLog.create({ data: { actor: `telegram:${telegramId}`, action, target: reference, details: note } })
    ]);
    await sendTelegram(`Request ${reference} marked ${action.toLowerCase()} by authorized administrator.`);
    res.sendStatus(200);
  } catch (err) { next(err); }
});

// Account APIs are intentionally not simulated. Real account access requires an authorized provider.
app.all("/api/account/*path", (_req, res) => {
  res.status(503).json({ error: "Account integration is not connected. Use the official Xfinity website for account access.", officialUrl: "https://www.xfinity.com/" });
});

app.use(express.static(path.resolve(__dirname, "../dist")));
app.get("*path", (_req, res) => res.sendFile(path.resolve(__dirname, "../dist/index.html")));

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled server error", err instanceof Error ? err.message : "unknown");
  res.status(500).json({ error: "An unexpected error occurred. Please try again later." });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Connect Guide server listening on ${PORT}`));
}
export { app, prisma };
