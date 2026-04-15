/**
 * providers.ts — READ-ONLY للمستخدمين العاديين
 *
 * إدارة المزودين تمت إحالتها كلياً للمشرف العام (Super Admin).
 * المستخدم العادي يستطيع فقط قراءة المزودين المعيَّنين له.
 * جميع عمليات الإضافة / التعديل / الحذف محجوبة بـ 403.
 */
import { Router, type IRouter } from "express";
import { db, aiProvidersTable, providerUsageLogTable } from "@workspace/db";
import { eq, sql, gte, and } from "drizzle-orm";
import { decrypt, maskKey } from "../lib/encryption.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const router: IRouter = Router();

function sanitizeProvider(p: typeof aiProvidersTable.$inferSelect) {
  return { ...p, apiKey: p.apiKey ? maskKey(decrypt(p.apiKey)) : "" };
}

const adminOnly = (_req: unknown, res: import("express").Response): void => {
  res.status(403).json({
    message: "يتم إدارة مزودي الذكاء الاصطناعي من قبل المشرف العام. تواصل مع الدعم لإضافة أو تعديل المزودين.",
  });
};

// ── GET /api/providers — قراءة فقط ──────────────────────────────────────────
router.get("/providers", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const rows = await db
    .select()
    .from(aiProvidersTable)
    .where(eq(aiProvidersTable.tenantId, tenantId))
    .orderBy(aiProvidersTable.id);
  res.json(rows.map(sanitizeProvider));
});

// ── BLOCKED: إدارة المزودين للمشرف العام فقط ─────────────────────────────────
router.post("/providers",              adminOnly);
router.put("/providers/:id",          adminOnly);
router.delete("/providers/:id",       adminOnly);
router.post("/providers/:id/activate", adminOnly);

// ── GET /api/providers/stats — إحصاءات للقراءة فقط ──────────────────────────
router.get("/providers/stats", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const stats = await db
    .select({
      providerId:   providerUsageLogTable.providerId,
      totalCalls:   sql<number>`count(*)`.as("total_calls"),
      successCount: sql<number>`sum(case when ${providerUsageLogTable.success} = 1 then 1 else 0 end)`.as("success_count"),
      avgLatency:   sql<number>`round(avg(${providerUsageLogTable.latencyMs}))`.as("avg_latency"),
      lastError:    sql<string>`max(case when ${providerUsageLogTable.success} = 0 then ${providerUsageLogTable.error} else null end)`.as("last_error"),
    })
    .from(providerUsageLogTable)
    .where(gte(providerUsageLogTable.createdAt, cutoff))
    .groupBy(providerUsageLogTable.providerId);

  const providers = await db
    .select({ id: aiProvidersTable.id, name: aiProvidersTable.name })
    .from(aiProvidersTable)
    .where(eq(aiProvidersTable.tenantId, tenantId));

  const nameMap  = new Map(providers.map((p) => [p.id, p.name]));
  const knownIds = providers.map((p) => p.id);
  const orphanIds = stats.map((s) => s.providerId).filter((id) => !knownIds.includes(id));
  for (const orphanId of orphanIds) {
    await db.delete(providerUsageLogTable).where(eq(providerUsageLogTable.providerId, orphanId));
  }

  const result = stats
    .filter((s) => nameMap.has(s.providerId))
    .map((s) => ({
      providerId:    s.providerId,
      providerName:  nameMap.get(s.providerId) ?? "Unknown",
      totalCalls:    Number(s.totalCalls),
      successCount:  Number(s.successCount),
      successRate:   s.totalCalls > 0 ? Math.round((Number(s.successCount) / Number(s.totalCalls)) * 100) : 0,
      avgLatencyMs:  Number(s.avgLatency) || 0,
      lastError:     s.lastError ?? null,
    }));

  res.json(result);
});

// BLOCKED: إعادة تعيين الإحصاءات للمشرف العام فقط
router.delete("/providers/:id/reset-stats", adminOnly);

// BLOCKED: اختبار المزود للمشرف العام فقط
router.post("/providers/:id/test", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const id = parseInt(String(req.params["id"] ?? "0"), 10);

  const [provider] = await db
    .select()
    .from(aiProvidersTable)
    .where(and(eq(aiProvidersTable.id, id), eq(aiProvidersTable.tenantId, tenantId)))
    .limit(1);

  if (!provider) { res.status(404).json({ message: "Provider not found" }); return; }

  res.status(403).json({ message: "اختبار المزودين متاح للمشرف العام فقط." });
});

export default router;
