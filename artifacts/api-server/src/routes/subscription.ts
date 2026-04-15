import { Router, type IRouter } from "express";
import { db, tenantsTable, subscriptionPlansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {
  getUsageSummary,
  PLAN_LIMITS,
  checkTenantActive,
  getTenantStatusMessage,
} from "../lib/quotaGuard.js";

const router: IRouter = Router();

// ── GET /api/subscription — بيانات الاشتراك + الاستخدام الحالي ───────────────
router.get("/subscription", async (req, res): Promise<void> => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId;
  if (!tenantId) { res.status(401).json({ message: "Unauthorized" }); return; }

  try {
    const summary = await getUsageSummary(tenantId);

    const statusCheck = {
      active:  true,
      reason:  undefined as string | undefined,
      message: undefined as string | undefined,
    };

    // التحقق من انتهاء التجربة أو الإيقاف
    const [tenant] = await db
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.id, tenantId))
      .limit(1);

    if (tenant) {
      const sc = checkTenantActive(tenant);
      if (!sc.active) {
        statusCheck.active  = false;
        statusCheck.reason  = sc.reason;
        statusCheck.message = getTenantStatusMessage(sc.reason);
      }
    }

    res.json({
      ...summary,
      statusCheck,
      // حسابات النسبة المئوية للاستخدام
      conversationsPercent: summary.maxConversations === -1
        ? 0
        : Math.round((summary.conversationsUsed / summary.maxConversations) * 100),
      productsPercent: summary.maxProducts === -1
        ? 0
        : Math.round((summary.productsUsed / summary.maxProducts) * 100),
      broadcastsPercent: summary.maxBroadcasts <= 0
        ? 0
        : Math.round((summary.broadcastsUsed / summary.maxBroadcasts) * 100),
    });
  } catch (err) {
    console.error("[subscription] Error:", (err as Error).message);
    res.status(500).json({ message: "خطأ في جلب بيانات الاشتراك" });
  }
});

// ── GET /api/subscription/plans — جميع الخطط المتاحة (عام) ───────────────────
router.get("/subscription/plans", async (_req, res): Promise<void> => {
  try {
    const plans = await db
      .select()
      .from(subscriptionPlansTable)
      .where(eq(subscriptionPlansTable.isActive, 1))
      .orderBy(subscriptionPlansTable.priceDzd);

    res.json(plans);
  } catch (err) {
    console.error("[subscription/plans] Error:", (err as Error).message);
    res.status(500).json({ message: "خطأ في جلب خطط الاشتراك" });
  }
});

// ── PUT /api/subscription/manual-activate — تفعيل خطة يدوياً (للاختبار والإدارة)
/**
 * يُستخدَم لتفعيل الخطة يدوياً من لوحة Super Admin أو بعد تأكيد دفع خارجي.
 * يُحدِّث: plan, status, maxConversations, maxProducts, maxProviders, maxBroadcasts
 */
router.put("/subscription/manual-activate", async (req, res): Promise<void> => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId;
  const role     = (req as AuthenticatedRequest).user?.role;
  if (!tenantId) { res.status(401).json({ message: "Unauthorized" }); return; }

  // يقتصر على المالك أو المشرف
  if (role !== "owner" && role !== "admin") {
    res.status(403).json({ message: "غير مصرح لك بهذه العملية" });
    return;
  }

  const body = req.body as { plan?: string };
  const plan = body.plan?.trim().toLowerCase();

  if (!plan || !PLAN_LIMITS[plan]) {
    res.status(400).json({
      message: `الخطة غير صالحة. الخطط المتاحة: ${Object.keys(PLAN_LIMITS).join(", ")}`,
    });
    return;
  }

  const limits = PLAN_LIMITS[plan]!;

  const [updated] = await db
    .update(tenantsTable)
    .set({
      plan,
      status:           "active",
      maxConversations: limits.maxConversations,
      maxProducts:      limits.maxProducts,
      maxProviders:     limits.maxProviders,
      maxBroadcasts:    limits.maxBroadcasts,
      updatedAt:        new Date(),
    })
    .where(eq(tenantsTable.id, tenantId))
    .returning();

  if (!updated) {
    res.status(404).json({ message: "المستأجر غير موجود" });
    return;
  }

  console.log(`[subscription] Tenant #${tenantId} manually activated plan: ${plan}`);

  res.json({
    message: `تم تفعيل خطة ${plan} بنجاح`,
    plan:    updated.plan,
    status:  updated.status,
    limits: {
      maxConversations: updated.maxConversations,
      maxProducts:      updated.maxProducts,
      maxProviders:     updated.maxProviders,
      maxBroadcasts:    updated.maxBroadcasts,
    },
  });
});

export default router;
