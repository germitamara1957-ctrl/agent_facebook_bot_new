/**
 * webhookSlug.ts — مسارات Webhook المخصصة لكل مستأجر (Subdomains)
 *
 * كل مستأجر يحصل على رابط Webhook خاص به:
 *   GET  /api/webhook/:slug  → التحقق من Webhook مع Facebook
 *   POST /api/webhook/:slug  → استقبال أحداث Webhook
 *
 * المزايا مقارنةً بـ /api/webhook العام:
 * - رفض مبكر (403) للطلبات الواردة لمستأجر غير موجود
 * - التحقق من التوقيع باستخدام `appSecret` الخاص بالمستأجر
 * - تعريف كل مستأجر بسرعة عبر slug (indexed query + cache)
 * - كل مستأجر يضبط رابطه الخاص في إعدادات Facebook Developers
 */

import { Router, type IRouter } from "express";
import {
  getSettingsBySlug,
} from "../lib/dbHelpers.js";
import {
  verifyWebhookSignature,
  checkWebhookRequestRate,
} from "../lib/webhookUtils.js";
import { processWebhookBody, type WebhookBody } from "./webhook.js";
import { enqueueWebhookEvent, markWebhookProcessed } from "../lib/webhookCrashRecovery.js";

const router: IRouter = Router();

// ── GET /webhook/:slug — Facebook Webhook Verification ───────────────────────
router.get("/webhook/:slug", async (req, res): Promise<void> => {
  const slug      = req.params["slug"] ?? "";
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"] as string | undefined;
  const challenge = req.query["hub.challenge"];

  if (!slug || !token) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const tenantData = await getSettingsBySlug(slug);
  if (!tenantData) {
    res.status(403).json({ message: "Unknown webhook slug" });
    return;
  }

  if (mode === "subscribe" && token === tenantData.settings.verifyToken) {
    res.status(200).send(challenge);
    return;
  }

  res.status(403).json({ message: "Forbidden" });
});

// ── POST /webhook/:slug — Slug-specific Webhook Handler ──────────────────────
router.post("/webhook/:slug", async (req, res): Promise<void> => {
  const slug = req.params["slug"] ?? "";

  if (!slug) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  // ── Layer 1: IP rate limiting ─────────────────────────────────────────────
  const clientIp =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
    ?? req.socket.remoteAddress
    ?? "unknown";

  if (!await checkWebhookRequestRate(clientIp)) {
    res.status(429).json({ message: "Too Many Requests" });
    return;
  }

  // ── Validate slug — reject unknown tenants early ──────────────────────────
  const tenantData = await getSettingsBySlug(slug);
  if (!tenantData) {
    res.status(403).json({ message: "Unknown webhook slug" });
    return;
  }

  // ── Layer 2: Signature verification (using tenant's appSecret) ────────────
  if (tenantData.settings.appSecret) {
    const sig     = req.headers["x-hub-signature-256"] as string | undefined;
    const rawBody = req.rawBody;
    if (!verifyWebhookSignature(rawBody, sig, tenantData.settings.appSecret)) {
      res.status(403).json({ message: "Invalid signature" });
      return;
    }
  }

  // ── Return 200 OK immediately (Facebook requires < 5s response) ───────────
  const body      = req.body as WebhookBody;
  const fbPageId  = body.entry?.[0]?.id ?? "";
  const queueId   = await enqueueWebhookEvent(tenantData.tenantId, fbPageId, body);

  res.json({ message: "EVENT_RECEIVED" });

  // ── Process webhook asynchronously with pre-resolved tenant data ──────────
  void processWebhookBody(body, tenantData).then(async () => {
    if (queueId) await markWebhookProcessed(queueId);
  }).catch((err: unknown) => {
    console.error(`[webhook:${slug}] Unhandled error:`, (err as Error).message);
  });
});

export default router;
