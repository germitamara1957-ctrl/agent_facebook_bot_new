import { Router, type IRouter } from "express";
import { db, subscriptionPlansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { superAdminMiddleware } from "../../middleware/superAdminMiddleware.js";

const router: IRouter = Router();

// ── GET /api/admin/plans ────────────────────────────────────────────────────
router.get("/admin/plans", superAdminMiddleware, async (_req, res): Promise<void> => {
  try {
    const plans = await db
      .select()
      .from(subscriptionPlansTable)
      .orderBy(subscriptionPlansTable.priceDzd);
    res.json(plans);
  } catch (err) {
    console.error("[admin/plans] GET error:", (err as Error).message);
    res.status(500).json({ message: "خطأ في جلب الخطط" });
  }
});

// ── PUT /api/admin/plans/:id ────────────────────────────────────────────────
router.put("/admin/plans/:id", superAdminMiddleware, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params["id"] ?? "0"), 10);
  if (!id) { res.status(400).json({ message: "ID غير صالح" }); return; }

  const body = req.body as {
    displayName?: string;
    priceDzd?: number;
    aiConversationsLimit?: number;
    productsLimit?: number;
    providersLimit?: number;
    broadcastLimit?: number;
    appointmentsEnabled?: number;
    leadsEnabled?: number;
    analyticsAdvanced?: number;
    multiPage?: number;
    isActive?: number;
  };

  try {
    const updateData: Partial<typeof subscriptionPlansTable.$inferInsert> = {};

    if (body.displayName    !== undefined) updateData.displayName          = body.displayName;
    if (body.priceDzd       !== undefined) updateData.priceDzd             = Number(body.priceDzd);
    if (body.aiConversationsLimit !== undefined) updateData.aiConversationsLimit = Number(body.aiConversationsLimit);
    if (body.productsLimit   !== undefined) updateData.productsLimit        = Number(body.productsLimit);
    if (body.providersLimit  !== undefined) updateData.providersLimit       = Number(body.providersLimit);
    if (body.broadcastLimit  !== undefined) updateData.broadcastLimit       = Number(body.broadcastLimit);
    if (body.appointmentsEnabled !== undefined) updateData.appointmentsEnabled = Number(body.appointmentsEnabled);
    if (body.leadsEnabled    !== undefined) updateData.leadsEnabled         = Number(body.leadsEnabled);
    if (body.analyticsAdvanced !== undefined) updateData.analyticsAdvanced  = Number(body.analyticsAdvanced);
    if (body.multiPage       !== undefined) updateData.multiPage            = Number(body.multiPage);
    if (body.isActive        !== undefined) updateData.isActive             = Number(body.isActive);

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ message: "لا توجد بيانات للتحديث" });
      return;
    }

    const [updated] = await db
      .update(subscriptionPlansTable)
      .set(updateData)
      .where(eq(subscriptionPlansTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ message: "الخطة غير موجودة" }); return; }

    console.log(`[admin/plans] Updated plan #${id}: ${JSON.stringify(updateData)}`);
    res.json(updated);
  } catch (err) {
    console.error("[admin/plans] PUT error:", (err as Error).message);
    res.status(500).json({ message: "خطأ في تحديث الخطة" });
  }
});

export default router;
