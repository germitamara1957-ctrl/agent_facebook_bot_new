import { Router, type IRouter } from "express";
import { db, tenantsTable, subscriptionUsageTable } from "@workspace/db";
import { eq, desc, sql, count } from "drizzle-orm";
import { superAdminMiddleware } from "../../middleware/superAdminMiddleware.js";
import { PLAN_LIMITS } from "../../lib/quotaGuard.js";

const router: IRouter = Router();

const VALID_STATUSES = ["trial", "active", "suspended", "cancelled", "expired"] as const;
const VALID_PLANS    = ["free", "trial", "starter", "pro", "agency"] as const;

// ── GET /api/admin/tenants — قائمة كل المستأجرين مع إحصاءات ──────────────────
router.get("/admin/tenants", superAdminMiddleware, async (req, res): Promise<void> => {
  const page  = Math.max(1, Number(req.query["page"]  ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query["limit"] ?? 20)));
  const offset = (page - 1) * limit;

  const statusFilter = req.query["status"] as string | undefined;
  const planFilter   = req.query["plan"]   as string | undefined;

  try {
    const monthYear = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    const rows = await db
      .select({
        id:                tenantsTable.id,
        name:              tenantsTable.name,
        slug:              tenantsTable.slug,
        ownerEmail:        tenantsTable.ownerEmail,
        plan:              tenantsTable.plan,
        status:            tenantsTable.status,
        trialEndsAt:       tenantsTable.trialEndsAt,
        maxConversations:  tenantsTable.maxConversations,
        maxProducts:       tenantsTable.maxProducts,
        maxProviders:      tenantsTable.maxProviders,
        maxBroadcasts:     tenantsTable.maxBroadcasts,
        createdAt:         tenantsTable.createdAt,
        conversationsUsed: sql<number>`COALESCE((
          SELECT su.ai_conversations_used FROM subscription_usage su
          WHERE su.tenant_id = ${tenantsTable.id} AND su.month_year = ${monthYear}
          LIMIT 1
        ), 0)`,
      })
      .from(tenantsTable)
      .where(
        statusFilter && VALID_STATUSES.includes(statusFilter as typeof VALID_STATUSES[number])
          ? eq(tenantsTable.status, statusFilter)
          : planFilter && VALID_PLANS.includes(planFilter as typeof VALID_PLANS[number])
            ? eq(tenantsTable.plan, planFilter)
            : undefined
      )
      .orderBy(desc(tenantsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalRow] = await db.select({ total: count() }).from(tenantsTable);
    const total = totalRow?.total ?? 0;

    res.json({
      tenants: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[admin/tenants] Error:", (err as Error).message);
    res.status(500).json({ message: "خطأ في جلب قائمة المستأجرين" });
  }
});

// ── GET /api/admin/tenants/:id — تفاصيل مستأجر مع الاستخدام ──────────────────
router.get("/admin/tenants/:id", superAdminMiddleware, async (req, res): Promise<void> => {
  const tenantId = Number(req.params["id"]);
  if (!tenantId || isNaN(tenantId)) { res.status(400).json({ message: "معرّف المستأجر غير صالح" }); return; }

  try {
    const [tenant] = await db
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.id, tenantId))
      .limit(1);

    if (!tenant) { res.status(404).json({ message: "المستأجر غير موجود" }); return; }

    const usageRows = await db
      .select()
      .from(subscriptionUsageTable)
      .where(eq(subscriptionUsageTable.tenantId, tenantId))
      .orderBy(desc(subscriptionUsageTable.monthYear))
      .limit(6);

    res.json({ tenant, usageHistory: usageRows });
  } catch (err) {
    console.error("[admin/tenants/:id] Error:", (err as Error).message);
    res.status(500).json({ message: "خطأ في جلب تفاصيل المستأجر" });
  }
});

// ── PUT /api/admin/tenants/:id/status — تغيير حالة المستأجر ──────────────────
router.put("/admin/tenants/:id/status", superAdminMiddleware, async (req, res): Promise<void> => {
  const tenantId = Number(req.params["id"]);
  if (!tenantId || isNaN(tenantId)) { res.status(400).json({ message: "معرّف المستأجر غير صالح" }); return; }

  const { status } = req.body as { status?: string };
  if (!status || !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    res.status(400).json({ message: `الحالة غير صالحة — القيم المقبولة: ${VALID_STATUSES.join(", ")}` });
    return;
  }

  try {
    const [updated] = await db
      .update(tenantsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(tenantsTable.id, tenantId))
      .returning({ id: tenantsTable.id, status: tenantsTable.status });

    if (!updated) { res.status(404).json({ message: "المستأجر غير موجود" }); return; }

    res.json({ id: updated.id, status: updated.status });
  } catch (err) {
    console.error("[admin/tenants/:id/status] Error:", (err as Error).message);
    res.status(500).json({ message: "خطأ في تحديث حالة المستأجر" });
  }
});

// ── PUT /api/admin/tenants/:id/plan — تغيير خطة المستأجر مع تحديث الحدود ─────
router.put("/admin/tenants/:id/plan", superAdminMiddleware, async (req, res): Promise<void> => {
  const tenantId = Number(req.params["id"]);
  if (!tenantId || isNaN(tenantId)) { res.status(400).json({ message: "معرّف المستأجر غير صالح" }); return; }

  const { plan } = req.body as { plan?: string };
  if (!plan || !VALID_PLANS.includes(plan as typeof VALID_PLANS[number])) {
    res.status(400).json({ message: `الخطة غير صالحة — القيم المقبولة: ${VALID_PLANS.join(", ")}` });
    return;
  }

  const limits = PLAN_LIMITS[plan];
  if (!limits) { res.status(400).json({ message: "لا توجد حدود للخطة المحددة" }); return; }

  const newStatus = plan === "trial" ? "trial" : "active";

  try {
    const [updated] = await db
      .update(tenantsTable)
      .set({
        plan,
        status:           newStatus,
        maxConversations: limits.maxConversations,
        maxProducts:      limits.maxProducts,
        maxProviders:     limits.maxProviders,
        maxBroadcasts:    limits.maxBroadcasts,
        updatedAt:        new Date(),
      })
      .where(eq(tenantsTable.id, tenantId))
      .returning();

    if (!updated) { res.status(404).json({ message: "المستأجر غير موجود" }); return; }

    res.json({ tenant: updated });
  } catch (err) {
    console.error("[admin/tenants/:id/plan] Error:", (err as Error).message);
    res.status(500).json({ message: "خطأ في تحديث خطة المستأجر" });
  }
});

export default router;
