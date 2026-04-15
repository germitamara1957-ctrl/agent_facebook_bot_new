import { Router, type IRouter } from "express";
import { db, tenantsTable, subscriptionUsageTable, paymentOrdersTable } from "@workspace/db";
import { eq, sql, count, sum } from "drizzle-orm";
import { superAdminMiddleware } from "../../middleware/superAdminMiddleware.js";

const router: IRouter = Router();

// ── GET /api/admin/stats — إحصاءات المنصة الإجمالية ─────────────────────────
router.get("/admin/stats", superAdminMiddleware, async (_req, res): Promise<void> => {
  try {
    const monthYear = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    // إجمالي المستأجرين حسب الحالة
    const byStatus = await db
      .select({ status: tenantsTable.status, total: count() })
      .from(tenantsTable)
      .groupBy(tenantsTable.status);

    // إجمالي المستأجرين حسب الخطة
    const byPlan = await db
      .select({ plan: tenantsTable.plan, total: count() })
      .from(tenantsTable)
      .groupBy(tenantsTable.plan);

    // مجموع المحادثات هذا الشهر
    const [conversationsRow] = await db
      .select({ total: sum(subscriptionUsageTable.aiConversationsUsed) })
      .from(subscriptionUsageTable)
      .where(eq(subscriptionUsageTable.monthYear, monthYear));

    // إجمالي الإيرادات (المدفوعات المكتملة)
    const [revenueRow] = await db
      .select({ total: sum(paymentOrdersTable.amountDzd) })
      .from(paymentOrdersTable)
      .where(eq(paymentOrdersTable.status, "paid"));

    // المستأجرون الجدد هذا الشهر
    const [newTenantsRow] = await db
      .select({ total: count() })
      .from(tenantsTable)
      .where(sql`date_trunc('month', ${tenantsTable.createdAt}) = date_trunc('month', NOW())`);

    // نمو المستأجرين — آخر 6 أشهر
    const growthRows = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${tenantsTable.createdAt}), 'YYYY-MM')`,
        count: count(),
      })
      .from(tenantsTable)
      .where(sql`${tenantsTable.createdAt} >= NOW() - INTERVAL '6 months'`)
      .groupBy(sql`date_trunc('month', ${tenantsTable.createdAt})`)
      .orderBy(sql`date_trunc('month', ${tenantsTable.createdAt})`);

    const statusMap  = Object.fromEntries(byStatus.map((r) => [r.status, r.total]));
    const planMap    = Object.fromEntries(byPlan.map((r)   => [r.plan,   r.total]));
    const totalTenants = byStatus.reduce((acc, r) => acc + Number(r.total), 0);

    res.json({
      tenants: {
        total:     totalTenants,
        active:    Number(statusMap["active"]    ?? 0),
        trial:     Number(statusMap["trial"]     ?? 0),
        suspended: Number(statusMap["suspended"] ?? 0),
        cancelled: Number(statusMap["cancelled"] ?? 0),
        expired:   Number(statusMap["expired"]   ?? 0),
        newThisMonth: Number(newTenantsRow?.total ?? 0),
      },
      plans: {
        free:    Number(planMap["free"]    ?? 0),
        trial:   Number(planMap["trial"]   ?? 0),
        starter: Number(planMap["starter"] ?? 0),
        pro:     Number(planMap["pro"]     ?? 0),
        agency:  Number(planMap["agency"]  ?? 0),
      },
      usage: {
        conversationsThisMonth: Number(conversationsRow?.total ?? 0),
      },
      revenue: {
        totalDzd: Number(revenueRow?.total ?? 0),
        monthYear,
      },
      growth: growthRows.map((r) => ({ month: r.month, count: Number(r.count) })),
    });
  } catch (err) {
    console.error("[admin/stats] Error:", (err as Error).message);
    res.status(500).json({ message: "خطأ في جلب إحصاءات المنصة" });
  }
});

export default router;
