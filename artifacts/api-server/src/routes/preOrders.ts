import { Router, type IRouter } from "express";
import { db, preOrdersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const router: IRouter = Router();

// GET /api/pre-orders — list all pre-orders (newest first)
router.get("/", async (req, res) => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  try {
    const orders = await db
      .select()
      .from(preOrdersTable)
      .where(eq(preOrdersTable.tenantId, tenantId))
      .orderBy(desc(preOrdersTable.createdAt));
    res.json(orders);
  } catch (err) {
    console.error("[pre-orders] GET /:", err);
    res.status(500).json({ error: "Failed to fetch pre-orders" });
  }
});

// GET /api/pre-orders/:id
router.get("/:id", async (req, res) => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  try {
    const [order] = await db
      .select()
      .from(preOrdersTable)
      .where(and(eq(preOrdersTable.id, Number(req.params.id)), eq(preOrdersTable.tenantId, tenantId)))
      .limit(1);
    if (!order) { res.status(404).json({ error: "Not found" }); return; }
    res.json(order);
  } catch (err) {
    console.error("[pre-orders] GET /:id:", err);
    res.status(500).json({ error: "Failed to fetch pre-order" });
  }
});

// PATCH /api/pre-orders/:id/status  { status: "notified" | "cancelled" | "pending" }
router.patch("/:id/status", async (req, res) => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  try {
    const { status } = req.body as { status: string };
    const allowed = ["pending", "notified", "cancelled"];
    if (!allowed.includes(status)) {
      res.status(400).json({ error: `Invalid status. Allowed: ${allowed.join(", ")}` }); return;
    }
    const [updated] = await db
      .update(preOrdersTable)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(preOrdersTable.id, Number(req.params.id)), eq(preOrdersTable.tenantId, tenantId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    console.error("[pre-orders] PATCH /:id/status:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// DELETE /api/pre-orders/:id
router.delete("/:id", async (req, res) => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  try {
    await db
      .delete(preOrdersTable)
      .where(and(eq(preOrdersTable.id, Number(req.params.id)), eq(preOrdersTable.tenantId, tenantId)));
    res.json({ success: true });
  } catch (err) {
    console.error("[pre-orders] DELETE /:id:", err);
    res.status(500).json({ error: "Failed to delete pre-order" });
  }
});

export { router as preOrdersRouter };
