import { db, fbSettingsTable, tenantsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

/**
 * Executes a callback within a DB transaction that sets the tenant context.
 * This activates the RLS policies on all tenant tables.
 *
 * Usage:
 *   const result = await withTenant(tenantId, async (tx) => {
 *     return await tx.select().from(productsTable);
 *   });
 */
export async function withTenant<T>(
  tenantId: number,
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('app.current_tenant_id', ${tenantId.toString()}, true)`
    );
    return callback(tx as unknown as typeof db);
  });
}

/**
 * Looks up a tenant by their Facebook Page ID.
 * Used by the webhook to identify which tenant a message belongs to.
 * Returns null if no tenant owns this page.
 */
export async function getTenantByPageId(pageId: string): Promise<{
  tenantId: number;
  tenant: typeof tenantsTable.$inferSelect;
} | null> {
  const [settings] = await db
    .select({ tenantId: fbSettingsTable.tenantId })
    .from(fbSettingsTable)
    .where(eq(fbSettingsTable.pageId, pageId))
    .limit(1);

  if (!settings?.tenantId) return null;

  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.id, settings.tenantId))
    .limit(1);

  if (!tenant) return null;

  return { tenantId: settings.tenantId, tenant };
}
