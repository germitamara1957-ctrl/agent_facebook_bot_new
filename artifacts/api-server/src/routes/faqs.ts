import { Router, type IRouter } from "express";
import { db, faqsTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { rDel } from "../lib/redisCache.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const router: IRouter = Router();

router.get("/faqs", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const rows = await db.select().from(faqsTable).where(eq(faqsTable.tenantId, tenantId)).orderBy(sql`${faqsTable.createdAt} desc`);
  res.json(rows);
});

router.post("/faqs", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const { question, answer, category, isActive } = req.body as {
    question: string; answer: string; category?: string; isActive?: number;
  };
  const [created] = await db
    .insert(faqsTable)
    .values({ tenantId, question, answer, category: category ?? null, isActive: isActive ?? 1 })
    .returning();
  await rDel("faqs:active");
  res.status(201).json(created);
});

router.put("/faqs/:id", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const id = parseInt(req.params["id"]!, 10);
  const { question, answer, category, isActive } = req.body as {
    question?: string; answer?: string; category?: string; isActive?: number;
  };

  const [existing] = await db.select().from(faqsTable).where(and(eq(faqsTable.id, id), eq(faqsTable.tenantId, tenantId))).limit(1);
  if (!existing) {
    res.status(404).json({ message: "FAQ not found" });
    return;
  }

  const [updated] = await db
    .update(faqsTable)
    .set({
      question: question ?? existing.question,
      answer: answer ?? existing.answer,
      category: category !== undefined ? category : existing.category,
      isActive: isActive !== undefined ? isActive : existing.isActive,
    })
    .where(and(eq(faqsTable.id, id), eq(faqsTable.tenantId, tenantId)))
    .returning();

  await rDel("faqs:active");
  res.json(updated);
});

router.delete("/faqs/:id", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const id = parseInt(req.params["id"]!, 10);
  await db.delete(faqsTable).where(and(eq(faqsTable.id, id), eq(faqsTable.tenantId, tenantId)));
  await rDel("faqs:active");
  res.json({ message: "Deleted" });
});

export default router;
