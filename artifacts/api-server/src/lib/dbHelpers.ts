import { db, fbSettingsTable, aiConfigTable, conversationsTable, tenantsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { TTL } from "./cache.js";
import { rGet, rSet } from "./redisCache.js";

export type ConvEntry = {
  tenantId: number;
  fbUserId: string;
  fbUserName: string;
  fbProfileUrl?: string | null;
  message: string;
  sender: "user" | "bot";
  isPaused?: number;
  sentiment?: string | null;
  salesTriggerType?: string | null;
  sourceType?: string | null;
  safeModeBlocked?: number | null;
  rescueTriggered?: number | null;
  confidenceScore?: number | null;
  providerName?: string | null;
  modelName?: string | null;
  timestamp?: Date;
};

export async function saveConversation(entry: ConvEntry): Promise<number | null> {
  const [row] = await db.insert(conversationsTable).values({
    tenantId:        entry.tenantId,
    fbUserId:        entry.fbUserId,
    fbUserName:      entry.fbUserName,
    fbProfileUrl:    entry.fbProfileUrl ?? null,
    message:         entry.message,
    sender:          entry.sender,
    isPaused:        entry.isPaused ?? 0,
    sentiment:       entry.sentiment ?? null,
    salesTriggerType: entry.salesTriggerType ?? null,
    sourceType:      entry.sourceType ?? null,
    safeModeBlocked: entry.safeModeBlocked ?? 0,
    rescueTriggered: entry.rescueTriggered ?? 0,
    confidenceScore: entry.confidenceScore ?? null,
    providerName:    entry.providerName ?? null,
    modelName:       entry.modelName ?? null,
    timestamp:       entry.timestamp ?? new Date(),
  }).returning({ id: conversationsTable.id });
  return row?.id ?? null;
}

// ── Authenticated dashboard routes: look up by tenantId ──────────────────────

export async function getSettings(tenantId: number) {
  const cacheKey = `settings:${tenantId}`;
  const cached = await rGet<typeof fbSettingsTable.$inferSelect>(cacheKey);
  if (cached) return cached;

  const [settings] = await db
    .select()
    .from(fbSettingsTable)
    .where(eq(fbSettingsTable.tenantId, tenantId))
    .limit(1);

  if (settings) await rSet(cacheKey, settings, TTL.SETTINGS);
  return settings ?? null;
}

export async function getConfig(tenantId: number) {
  const cacheKey = `config:${tenantId}`;
  const cached = await rGet<typeof aiConfigTable.$inferSelect>(cacheKey);
  if (cached) return cached;

  const [config] = await db
    .select()
    .from(aiConfigTable)
    .where(eq(aiConfigTable.tenantId, tenantId))
    .limit(1);

  if (config) await rSet(cacheKey, config, TTL.CONFIG);
  return config ?? null;
}

export async function isUserPaused(tenantId: number, fbUserId: string): Promise<boolean> {
  const [latest] = await db
    .select({ isPaused: conversationsTable.isPaused })
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.tenantId, tenantId),
        eq(conversationsTable.fbUserId, fbUserId)
      )
    )
    .orderBy(desc(conversationsTable.timestamp))
    .limit(1);
  return latest?.isPaused === 1;
}

// ── Webhook bootstrap: identify tenant without prior auth ─────────────────────

/**
 * Look up settings + tenantId by Facebook Page ID.
 * Used in webhook POST handler to identify which tenant owns an incoming event.
 */
export async function getSettingsByPageId(pageId: string): Promise<{
  settings: typeof fbSettingsTable.$inferSelect;
  tenantId: number;
} | null> {
  const cacheKey = `settings:pageId:${pageId}`;
  const cached = await rGet<{ settings: typeof fbSettingsTable.$inferSelect; tenantId: number }>(cacheKey);
  if (cached) return cached;

  const [settings] = await db
    .select()
    .from(fbSettingsTable)
    .where(eq(fbSettingsTable.pageId, pageId))
    .limit(1);

  if (!settings?.tenantId) return null;

  const result = { settings, tenantId: settings.tenantId };
  await rSet(cacheKey, result, TTL.SETTINGS);
  return result;
}

/**
 * Look up settings by verifyToken.
 * Used in webhook GET (verification) handler to find the matching tenant.
 */
export async function getSettingsByVerifyToken(verifyToken: string): Promise<{
  settings: typeof fbSettingsTable.$inferSelect;
  tenantId: number;
} | null> {
  if (!verifyToken) return null;

  const [settings] = await db
    .select()
    .from(fbSettingsTable)
    .where(eq(fbSettingsTable.verifyToken, verifyToken))
    .limit(1);

  if (!settings?.tenantId) return null;
  return { settings, tenantId: settings.tenantId };
}

/**
 * Look up tenant settings by tenant slug.
 * Used in per-tenant webhook routes: GET|POST /api/webhook/:slug
 * Faster than verifyToken scan — direct indexed slug → join lookup.
 */
export async function getSettingsBySlug(slug: string): Promise<{
  settings: typeof fbSettingsTable.$inferSelect;
  tenantId: number;
  tenantSlug: string;
} | null> {
  if (!slug) return null;

  const cacheKey = `settings:slug:${slug}`;
  const cached = await rGet<{
    settings: typeof fbSettingsTable.$inferSelect;
    tenantId: number;
    tenantSlug: string;
  }>(cacheKey);
  if (cached) return cached;

  const [row] = await db
    .select({
      settings: fbSettingsTable,
      tenantId: tenantsTable.id,
      tenantSlug: tenantsTable.slug,
    })
    .from(tenantsTable)
    .innerJoin(fbSettingsTable, eq(fbSettingsTable.tenantId, tenantsTable.id))
    .where(eq(tenantsTable.slug, slug))
    .limit(1);

  if (!row) return null;

  const result = { settings: row.settings, tenantId: row.tenantId, tenantSlug: row.tenantSlug };
  await rSet(cacheKey, result, TTL.SETTINGS);
  return result;
}
