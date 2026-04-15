import { Router, type IRouter } from "express";
import { db, aiProvidersTable, tenantsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { encrypt, decrypt, maskKey } from "../../lib/encryption.js";
import { detectApiFormat, testWithFormat, resolveProviderType } from "../../lib/apiTransformer.js";
import { superAdminMiddleware } from "../../middleware/superAdminMiddleware.js";

const router: IRouter = Router();

function sanitizeProvider(p: typeof aiProvidersTable.$inferSelect) {
  return { ...p, apiKey: p.apiKey ? maskKey(decrypt(p.apiKey)) : "" };
}

// GET /api/admin/providers?tenantId=X
router.get("/admin/providers", superAdminMiddleware, async (req, res): Promise<void> => {
  const tenantId = Number(req.query["tenantId"]);
  if (!tenantId || isNaN(tenantId)) {
    res.status(400).json({ message: "tenantId مطلوب" });
    return;
  }

  const [tenant] = await db.select({ id: tenantsTable.id, name: tenantsTable.name })
    .from(tenantsTable).where(eq(tenantsTable.id, tenantId)).limit(1);
  if (!tenant) { res.status(404).json({ message: "المستأجر غير موجود" }); return; }

  const rows = await db.select().from(aiProvidersTable)
    .where(eq(aiProvidersTable.tenantId, tenantId))
    .orderBy(aiProvidersTable.id);

  res.json({ tenant, providers: rows.map(sanitizeProvider) });
});

// POST /api/admin/providers
router.post("/admin/providers", superAdminMiddleware, async (req, res): Promise<void> => {
  const { tenantId, name, providerType, apiKey, baseUrl, modelName } = req.body as {
    tenantId?: number;
    name?: string;
    providerType?: string;
    apiKey?: string;
    baseUrl?: string;
    modelName?: string;
  };

  if (!tenantId || !name || !modelName) {
    res.status(400).json({ message: "tenantId و name و modelName مطلوبة" });
    return;
  }

  const [tenant] = await db.select({ id: tenantsTable.id })
    .from(tenantsTable).where(eq(tenantsTable.id, tenantId)).limit(1);
  if (!tenant) { res.status(404).json({ message: "المستأجر غير موجود" }); return; }

  const [row] = await db.insert(aiProvidersTable).values({
    tenantId,
    name,
    providerType: providerType || "custom",
    apiKey: apiKey ? encrypt(apiKey) : "",
    baseUrl: baseUrl ?? null,
    modelName,
    isActive: 0,
    isEnabled: 1,
  }).returning();

  console.log(`[admin/providers] Created provider "${name}" for tenant #${tenantId}`);
  res.status(201).json(sanitizeProvider(row!));
});

// PUT /api/admin/providers/:id
router.put("/admin/providers/:id", superAdminMiddleware, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params["id"] ?? "0"), 10);
  if (!id) { res.status(400).json({ message: "ID غير صالح" }); return; }

  const { name, providerType, apiKey, baseUrl, modelName, isEnabled, priority } = req.body as {
    name?: string;
    providerType?: string;
    apiKey?: string;
    baseUrl?: string;
    modelName?: string;
    isEnabled?: number;
    priority?: number;
  };

  const updateData: Partial<typeof aiProvidersTable.$inferInsert> = {};
  if (name       !== undefined) updateData.name         = name;
  if (providerType !== undefined) updateData.providerType = providerType;
  if (apiKey     !== undefined && apiKey.trim() !== "") updateData.apiKey = encrypt(apiKey);
  if (baseUrl    !== undefined) updateData.baseUrl       = baseUrl;
  if (modelName  !== undefined) updateData.modelName     = modelName;
  if (isEnabled  !== undefined) updateData.isEnabled     = isEnabled;
  if (priority   !== undefined) updateData.priority      = priority;

  const [row] = await db.update(aiProvidersTable)
    .set(updateData)
    .where(eq(aiProvidersTable.id, id))
    .returning();

  if (!row) { res.status(404).json({ message: "المزود غير موجود" }); return; }
  res.json(sanitizeProvider(row));
});

// DELETE /api/admin/providers/:id
router.delete("/admin/providers/:id", superAdminMiddleware, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params["id"] ?? "0"), 10);
  if (!id) { res.status(400).json({ message: "ID غير صالح" }); return; }

  await db.delete(aiProvidersTable).where(eq(aiProvidersTable.id, id));
  console.log(`[admin/providers] Deleted provider #${id}`);
  res.json({ message: "تم حذف المزود" });
});

// POST /api/admin/providers/:id/activate
router.post("/admin/providers/:id/activate", superAdminMiddleware, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params["id"] ?? "0"), 10);
  if (!id) { res.status(400).json({ message: "ID غير صالح" }); return; }

  const [provider] = await db.select({ tenantId: aiProvidersTable.tenantId })
    .from(aiProvidersTable).where(eq(aiProvidersTable.id, id)).limit(1);
  if (!provider) { res.status(404).json({ message: "المزود غير موجود" }); return; }

  await db.update(aiProvidersTable)
    .set({ isActive: 0 })
    .where(eq(aiProvidersTable.tenantId, provider.tenantId));

  await db.update(aiProvidersTable)
    .set({ isActive: 1 })
    .where(and(eq(aiProvidersTable.id, id), eq(aiProvidersTable.tenantId, provider.tenantId)));

  console.log(`[admin/providers] Activated provider #${id} for tenant #${provider.tenantId}`);
  res.json({ message: "تم تفعيل المزود" });
});

// POST /api/admin/providers/:id/test
router.post("/admin/providers/:id/test", superAdminMiddleware, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params["id"] ?? "0"), 10);
  if (!id) { res.status(400).json({ message: "ID غير صالح" }); return; }

  const [provider] = await db.select().from(aiProvidersTable)
    .where(eq(aiProvidersTable.id, id)).limit(1);
  if (!provider) { res.status(404).json({ message: "المزود غير موجود" }); return; }

  const start = Date.now();
  try {
    const apiKey = decrypt(provider.apiKey);
    if (!apiKey) {
      res.json({ success: false, response: "مفتاح API غير موجود", latencyMs: 0 });
      return;
    }

    const rawType    = provider.providerType.toLowerCase();
    const rawTypeKey = rawType.replace(/\s+/g, "");
    const url        = (provider.baseUrl ?? "").toLowerCase();
    const provType   = resolveProviderType(rawType, url);
    const apiFormat  = detectApiFormat(rawTypeKey);
    let responseText: string;

    if (apiFormat === "raw_single" || apiFormat === "raw_messages") {
      const endpointUrl = provider.baseUrl ?? "";
      if (!endpointUrl) {
        res.json({ success: false, response: "لا يوجد رابط endpoint", latencyMs: 0 });
        return;
      }
      responseText = await testWithFormat(apiFormat, apiKey, endpointUrl, provider.modelName);
    } else if (rawTypeKey === "vertexai") {
      const { testVertexConnection, parseVertexConfig } = await import("../../lib/vertexAi.js");
      const config = parseVertexConfig(apiKey, provider.baseUrl, provider.modelName);
      const testResult = await testVertexConnection(config);
      if (!testResult.success) throw new Error(testResult.details);
      responseText = testResult.details;
    } else if (provType === "anthropic" || provType === "orbit" || provType === "agentrouter") {
      const base = (provType !== "anthropic" && provider.baseUrl)
        ? provider.baseUrl.replace(/\/$/, "")
        : "https://api.anthropic.com";
      const r = await fetch(`${base}/v1/messages`, {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: provider.modelName, max_tokens: 10, messages: [{ role: "user", content: "Say hello" }] }),
      });
      const data = await r.json() as { content?: Array<{ text: string }>; error?: { message: string } };
      if (data.error) throw new Error(data.error.message);
      responseText = data.content?.[0]?.text ?? "No response";
    } else {
      const cleanBase = (provider.baseUrl ?? "https://api.openai.com").replace(/\/$/, "");
      const skipV1 = provType === "deepseek" || provType === "gemini";
      const endpoint = skipV1 ? "/chat/completions" : "/v1/chat/completions";
      const r = await fetch(`${cleanBase}${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: provider.modelName, messages: [{ role: "user", content: "Say hello" }], max_tokens: 10 }),
      });
      const data = await r.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
      if (data.error) throw new Error(typeof data.error === "string" ? data.error : data.error.message ?? "Error");
      responseText = data.choices?.[0]?.message?.content ?? "No response";
    }

    res.json({ success: true, response: responseText, latencyMs: Date.now() - start });
  } catch (err) {
    res.json({ success: false, response: (err as Error).message, latencyMs: Date.now() - start });
  }
});

export default router;
