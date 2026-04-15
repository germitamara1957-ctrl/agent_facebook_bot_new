import { Router, type IRouter } from "express";
import { db, paymentOrdersTable, tenantsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { superAdminMiddleware } from "../../middleware/superAdminMiddleware.js";

const router: IRouter = Router();

// ── GET /api/admin/payments — جميع طلبات الدفع مع بيانات المستأجر ────────────
router.get("/admin/payments", superAdminMiddleware, async (req, res): Promise<void> => {
  const page   = Math.max(1, Number(req.query["page"]   ?? 1));
  const limit  = Math.min(100, Math.max(1, Number(req.query["limit"] ?? 20)));
  const offset = (page - 1) * limit;

  const statusFilter = req.query["status"] as string | undefined;

  try {
    const rows = await db
      .select({
        id:                 paymentOrdersTable.id,
        tenantId:           paymentOrdersTable.tenantId,
        tenantName:         tenantsTable.name,
        tenantSlug:         tenantsTable.slug,
        tenantEmail:        tenantsTable.ownerEmail,
        chargilyCheckoutId: paymentOrdersTable.chargilyCheckoutId,
        plan:               paymentOrdersTable.plan,
        amountDzd:          paymentOrdersTable.amountDzd,
        status:             paymentOrdersTable.status,
        checkoutUrl:        paymentOrdersTable.checkoutUrl,
        paidAt:             paymentOrdersTable.paidAt,
        createdAt:          paymentOrdersTable.createdAt,
      })
      .from(paymentOrdersTable)
      .innerJoin(tenantsTable, eq(paymentOrdersTable.tenantId, tenantsTable.id))
      .where(
        statusFilter
          ? eq(paymentOrdersTable.status, statusFilter)
          : undefined
      )
      .orderBy(desc(paymentOrdersTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ payments: rows, pagination: { page, limit } });
  } catch (err) {
    console.error("[admin/payments] Error:", (err as Error).message);
    res.status(500).json({ message: "خطأ في جلب سجل المدفوعات" });
  }
});

export default router;
