import { Router, type IRouter } from "express";
import { db, tenantsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getTenantById } from "../lib/tenantInit.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const router: IRouter = Router();

// ── GET /api/tenant — بيانات المستأجر الحالي ─────────────────────────────────
router.get("/tenant", async (req, res): Promise<void> => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const tenant = await getTenantById(tenantId);
  if (!tenant) {
    res.status(404).json({ message: "المستأجر غير موجود" });
    return;
  }

  res.json({
    id:                 tenant.id,
    name:               tenant.name,
    slug:               tenant.slug,
    ownerEmail:         tenant.ownerEmail,
    plan:               tenant.plan,
    status:             tenant.status,
    trialEndsAt:        tenant.trialEndsAt,
    maxConversations:   tenant.maxConversations,
    maxProducts:        tenant.maxProducts,
    maxProviders:       tenant.maxProviders,
    maxBroadcasts:      tenant.maxBroadcasts,
    fbPageId:           tenant.fbPageId,
    createdAt:          tenant.createdAt,
    updatedAt:          tenant.updatedAt,
  });
});

// ── PUT /api/tenant — تحديث بيانات المستأجر ──────────────────────────────────
/**
 * يسمح بتعديل:
 * - name (اسم النشاط التجاري)
 * - fbPageId (ربط صفحة فيسبوك بالمستأجر — يُحدَّث تلقائياً عند حفظ FB Settings)
 *
 * الحقول الثابتة (لا تتغير): slug، ownerEmail، plan، status
 */
router.put("/tenant", async (req, res): Promise<void> => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const body = req.body as {
    name?: string;
  };

  const updates: Partial<{ name: string; updatedAt: Date }> = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name || name.length < 2 || name.length > 60) {
      res.status(400).json({ message: "اسم النشاط التجاري مطلوب (2-60 حرف)" });
      return;
    }
    updates.name = name;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ message: "لا توجد حقول للتحديث" });
    return;
  }

  updates.updatedAt = new Date();

  const [updated] = await db
    .update(tenantsTable)
    .set(updates)
    .where(eq(tenantsTable.id, tenantId))
    .returning();

  if (!updated) {
    res.status(404).json({ message: "المستأجر غير موجود" });
    return;
  }

  res.json({
    id:       updated.id,
    name:     updated.name,
    slug:     updated.slug,
    plan:     updated.plan,
    status:   updated.status,
    updatedAt: updated.updatedAt,
  });
});

export default router;
