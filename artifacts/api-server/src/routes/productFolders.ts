import { Router, type IRouter } from "express";
import { db, productFoldersTable, productsTable } from "@workspace/db";
import { eq, inArray, and } from "drizzle-orm";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const router: IRouter = Router();

router.get("/product-folders", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const rows = await db
    .select()
    .from(productFoldersTable)
    .where(eq(productFoldersTable.tenantId, tenantId))
    .orderBy(productFoldersTable.createdAt);
  res.json(rows);
});

router.post("/product-folders", async (req, res): Promise<void> => {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) {
    res.status(400).json({ message: "الاسم مطلوب" });
    return;
  }
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const [row] = await db
    .insert(productFoldersTable)
    .values({ tenantId, name: name.trim() })
    .returning();
  res.status(201).json(row);
});

router.put("/product-folders/:id", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const id = parseInt(req.params["id"]!, 10);
  if (Number.isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }
  const { name } = req.body as { name?: string };
  if (!name?.trim()) { res.status(400).json({ message: "الاسم مطلوب" }); return; }
  const [row] = await db
    .update(productFoldersTable)
    .set({ name: name.trim() })
    .where(and(eq(productFoldersTable.id, id), eq(productFoldersTable.tenantId, tenantId)))
    .returning();
  if (!row) { res.status(404).json({ message: "المجلد غير موجود" }); return; }
  res.json(row);
});

router.delete("/product-folders/:id", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const id = parseInt(req.params["id"]!, 10);
  if (Number.isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }
  // Only unlink products belonging to this tenant
  await db.update(productsTable).set({ folderId: null }).where(and(eq(productsTable.folderId, id), eq(productsTable.tenantId, tenantId)));
  await db.delete(productFoldersTable).where(and(eq(productFoldersTable.id, id), eq(productFoldersTable.tenantId, tenantId)));
  res.json({ message: "تم الحذف" });
});

router.post("/product-folders/bulk-assign", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const { productIds, folderId } = req.body as { productIds?: number[]; folderId?: number | null };
  if (!Array.isArray(productIds) || productIds.length === 0) {
    res.status(400).json({ message: "productIds مطلوب" });
    return;
  }
  await db
    .update(productsTable)
    .set({ folderId: folderId ?? null })
    .where(and(inArray(productsTable.id, productIds), eq(productsTable.tenantId, tenantId)));
  res.json({ message: "تم التعيين", count: productIds.length });
});

export default router;
