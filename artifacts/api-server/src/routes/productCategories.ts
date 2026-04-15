import { Router } from "express";
import { db, productCategoriesTable } from "@workspace/db";
import { eq, isNull, and } from "drizzle-orm";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/product-categories", async (req, res) => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  try {
    const categories = await db
      .select()
      .from(productCategoriesTable)
      .where(eq(productCategoriesTable.tenantId, tenantId))
      .orderBy(productCategoriesTable.name);
    res.json(categories);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post("/product-categories", async (req, res) => {
  try {
    const { name, parentId } = req.body;
    if (!name) { res.status(400).json({ error: "الاسم مطلوب" }); return; }
    const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
    const [cat] = await db
      .insert(productCategoriesTable)
      .values({ tenantId, name: name.trim(), parentId: parentId ? Number(parentId) : null })
      .returning();
    res.json(cat);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put("/product-categories/:id", async (req, res) => {
  try {
    const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
    const { name, parentId } = req.body;
    if (!name) { res.status(400).json({ error: "الاسم مطلوب" }); return; }
    const updateId = parseInt(req.params.id, 10);
    if (Number.isNaN(updateId)) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [cat] = await db
      .update(productCategoriesTable)
      .set({ name: name.trim(), parentId: parentId ? Number(parentId) : null })
      .where(and(eq(productCategoriesTable.id, updateId), eq(productCategoriesTable.tenantId, tenantId)))
      .returning();
    if (!cat) { res.status(404).json({ error: "Category not found" }); return; }
    res.json(cat);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.delete("/product-categories/:id", async (req, res) => {
  try {
    const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db
      .update(productCategoriesTable)
      .set({ parentId: null })
      .where(and(eq(productCategoriesTable.parentId, id), eq(productCategoriesTable.tenantId, tenantId)));
    await db.delete(productCategoriesTable).where(and(eq(productCategoriesTable.id, id), eq(productCategoriesTable.tenantId, tenantId)));
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
