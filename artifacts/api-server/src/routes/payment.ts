/**
 * routes/payment.ts — مسارات الدفع عبر Chargily Pay
 *
 * POST /api/payment/checkout      — إنشاء جلسة دفع (محمي)
 * POST /api/payment/webhook       — استقبال إشعارات Chargily (عام)
 * GET  /api/payment/history       — سجل مدفوعات المستأجر (محمي)
 */

import { Router, type IRouter } from "express";
import { db, tenantsTable, paymentOrdersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {
  createChargilyCheckout,
  verifyChargilySignature,
  getPlanLimits,
  PURCHASABLE_PLANS,
  PLAN_PRICES_DZD,
  isChargilyConfigured,
  type ChargilyWebhookPayload,
} from "../lib/chargilyPayment.js";

const router: IRouter = Router();

// ── POST /api/payment/checkout — إنشاء جلسة دفع Chargily ─────────────────────
router.post("/payment/checkout", async (req, res): Promise<void> => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId;
  if (!tenantId) { res.status(401).json({ message: "Unauthorized" }); return; }

  if (!isChargilyConfigured()) {
    res.status(503).json({
      message: "بوابة الدفع غير مفعّلة حالياً. يرجى التواصل مع الإدارة.",
      configured: false,
    });
    return;
  }

  const body = req.body as { plan?: string };
  const plan = body.plan?.trim().toLowerCase();

  if (!plan || !PURCHASABLE_PLANS.includes(plan)) {
    res.status(400).json({
      message: `خطة غير صالحة. الخطط المتاحة: ${PURCHASABLE_PLANS.join(", ")}`,
    });
    return;
  }

  try {
    const checkout = await createChargilyCheckout({ tenantId, plan });

    // حفظ الطلب في DB
    const [order] = await db
      .insert(paymentOrdersTable)
      .values({
        tenantId,
        chargilyCheckoutId: checkout.checkoutId,
        plan,
        amountDzd:          PLAN_PRICES_DZD[plan]!,
        status:             "pending",
        checkoutUrl:        checkout.checkoutUrl,
      })
      .returning({ id: paymentOrdersTable.id });

    console.log(`[payment] Tenant #${tenantId} created checkout for plan "${plan}" — order #${order?.id}`);

    res.status(201).json({
      checkoutUrl: checkout.checkoutUrl,
      checkoutId:  checkout.checkoutId,
      orderId:     order?.id,
      plan,
      amountDzd:   PLAN_PRICES_DZD[plan],
    });
  } catch (err) {
    const msg = (err as Error).message;
    console.error("[payment/checkout] Error:", msg);
    res.status(500).json({ message: `خطأ في إنشاء جلسة الدفع: ${msg}` });
  }
});

// ── POST /api/payment/webhook — إشعارات Chargily (عام، لا يحتاج JWT) ─────────
router.post("/payment/webhook", async (req, res): Promise<void> => {
  const secret = process.env["CHARGILY_WEBHOOK_SECRET"];
  if (!secret) {
    console.warn("[payment/webhook] CHARGILY_WEBHOOK_SECRET not set — rejecting webhook");
    res.status(500).json({ message: "Webhook not configured" });
    return;
  }

  // التحقق من توقيع Chargily
  const signature  = req.headers["signature"] as string | undefined;
  const rawBody    = (req as unknown as { rawBody?: Buffer }).rawBody;

  if (!rawBody || !verifyChargilySignature(signature, rawBody, secret)) {
    console.warn("[payment/webhook] Invalid signature — rejecting");
    res.status(400).json({ message: "Invalid signature" });
    return;
  }

  const payload = req.body as ChargilyWebhookPayload;
  console.log(`[payment/webhook] Event: ${payload.type} | checkout: ${payload.data?.id}`);

  if (payload.type === "checkout.paid") {
    await handleCheckoutPaid(payload);
  } else if (payload.type === "checkout.failed" || payload.type === "checkout.expired") {
    await handleCheckoutFailed(payload);
  }

  res.json({ received: true });
});

// ── GET /api/payment/history — سجل المدفوعات ─────────────────────────────────
router.get("/payment/history", async (req, res): Promise<void> => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId;
  if (!tenantId) { res.status(401).json({ message: "Unauthorized" }); return; }

  const orders = await db
    .select({
      id:                 paymentOrdersTable.id,
      plan:               paymentOrdersTable.plan,
      amountDzd:          paymentOrdersTable.amountDzd,
      status:             paymentOrdersTable.status,
      checkoutUrl:        paymentOrdersTable.checkoutUrl,
      paidAt:             paymentOrdersTable.paidAt,
      createdAt:          paymentOrdersTable.createdAt,
      chargilyCheckoutId: paymentOrdersTable.chargilyCheckoutId,
    })
    .from(paymentOrdersTable)
    .where(eq(paymentOrdersTable.tenantId, tenantId))
    .orderBy(desc(paymentOrdersTable.createdAt))
    .limit(50);

  res.json(orders);
});

// ── معالج الدفع الناجح ────────────────────────────────────────────────────────
async function handleCheckoutPaid(payload: ChargilyWebhookPayload): Promise<void> {
  const checkoutId = payload.data.id;
  const metadata   = payload.data.metadata;
  const plan       = metadata?.plan;
  const tenantId   = metadata?.tenant_id ? Number(metadata.tenant_id) : null;

  if (!plan || !tenantId) {
    console.warn("[payment/webhook] Missing plan or tenant_id in metadata");
    return;
  }

  const limits = getPlanLimits(plan);

  // 1) تحديث طلب الدفع
  await db
    .update(paymentOrdersTable)
    .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
    .where(eq(paymentOrdersTable.chargilyCheckoutId, checkoutId));

  // 2) ترقية المستأجر
  await db
    .update(tenantsTable)
    .set({
      plan,
      status:           "active",
      subscriptionId:   checkoutId,
      maxConversations: limits.maxConversations,
      maxProducts:      limits.maxProducts,
      maxProviders:     limits.maxProviders,
      maxBroadcasts:    limits.maxBroadcasts,
      updatedAt:        new Date(),
    })
    .where(eq(tenantsTable.id, tenantId));

  console.log(`[payment/webhook] ✅ Tenant #${tenantId} upgraded to plan "${plan}"`);
}

// ── معالج الدفع الفاشل/المنتهي ───────────────────────────────────────────────
async function handleCheckoutFailed(payload: ChargilyWebhookPayload): Promise<void> {
  const checkoutId = payload.data.id;
  const newStatus  = payload.type === "checkout.expired" ? "expired" : "failed";

  await db
    .update(paymentOrdersTable)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(paymentOrdersTable.chargilyCheckoutId, checkoutId));

  console.log(`[payment/webhook] ❌ Checkout ${checkoutId} → ${newStatus}`);
}

export default router;
