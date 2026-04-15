/**
 * webhookCrashRecovery.ts
 *
 * نظام استرداد أحداث Webhook بعد انهيار الخادم.
 *
 * الآلية:
 *  1. عند استقبال كل Webhook → حفظ الحمولة في جدول webhook_message_queue
 *  2. بعد معالجة كل حدث بنجاح → تحديث processed = true
 *  3. عند بدء الخادم → إعادة تشغيل الأحداث غير المعالجة (< 48 ساعة)
 *  4. تنظيف دوري → حذف الأحداث المعالجة القديمة (> 24 ساعة)
 */

import { db, webhookMessageQueueTable } from "@workspace/db";
import { eq, and, lt, isNull, sql } from "drizzle-orm";

// ── إدراج حدث جديد في قائمة الانتظار ─────────────────────────────────────────
export async function enqueueWebhookEvent(
  tenantId: number,
  fbPageId: string,
  payload: unknown,
): Promise<number | null> {
  try {
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const [inserted] = await db
      .insert(webhookMessageQueueTable)
      .values({
        tenantId,
        fbPageId,
        payload: JSON.stringify(payload),
        expiresAt,
        processed: false,
      })
      .returning({ id: webhookMessageQueueTable.id });
    return inserted?.id ?? null;
  } catch (err) {
    console.warn("[webhook-queue] enqueueWebhookEvent failed:", (err as Error).message);
    return null;
  }
}

// ── تحديد حدث باعتباره مُعالَجاً ────────────────────────────────────────────
export async function markWebhookProcessed(queueId: number): Promise<void> {
  try {
    await db
      .update(webhookMessageQueueTable)
      .set({ processed: true })
      .where(eq(webhookMessageQueueTable.id, queueId));
  } catch (err) {
    console.warn(`[webhook-queue] markWebhookProcessed(${queueId}) failed:`, (err as Error).message);
  }
}

// ── استرداد أحداث Webhook بعد انهيار الخادم ──────────────────────────────────
export async function replayUnprocessedWebhooks(
  processor: (payload: unknown, tenantId: number, fbPageId: string) => Promise<void>,
): Promise<void> {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const pendingRows = await db
      .select()
      .from(webhookMessageQueueTable)
      .where(
        and(
          eq(webhookMessageQueueTable.processed, false),
          sql`${webhookMessageQueueTable.receivedAt} > ${fortyEightHoursAgo}`,
          isNull(webhookMessageQueueTable.processingStartedAt),
        )
      )
      .limit(100);

    if (pendingRows.length === 0) return;

    console.log(`[webhook-queue] Replaying ${pendingRows.length} unprocessed webhook event(s)…`);

    for (const row of pendingRows) {
      try {
        await db
          .update(webhookMessageQueueTable)
          .set({ processingStartedAt: new Date() })
          .where(
            and(
              eq(webhookMessageQueueTable.id, row.id),
              isNull(webhookMessageQueueTable.processingStartedAt),
            )
          );

        const payload = JSON.parse(row.payload) as unknown;
        await processor(payload, row.tenantId, row.fbPageId);
        await markWebhookProcessed(row.id);
        console.log(`[webhook-queue] Replayed event #${row.id} for tenant ${row.tenantId}`);
      } catch (err) {
        console.error(`[webhook-queue] Failed to replay event #${row.id}:`, (err as Error).message);
        await db
          .update(webhookMessageQueueTable)
          .set({ processingStartedAt: null })
          .where(eq(webhookMessageQueueTable.id, row.id));
      }
    }
  } catch (err) {
    console.error("[webhook-queue] replayUnprocessedWebhooks error:", (err as Error).message);
  }
}

// ── تنظيف دوري: حذف الأحداث المُعالَجة والمنتهية ─────────────────────────────
export async function cleanupWebhookQueue(): Promise<void> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await db
      .delete(webhookMessageQueueTable)
      .where(
        and(
          eq(webhookMessageQueueTable.processed, true),
          lt(webhookMessageQueueTable.receivedAt, twentyFourHoursAgo),
        )
      );

    const deleted = result.rowCount ?? 0;
    if (deleted > 0) {
      console.log(`[webhook-queue] Cleanup: deleted ${deleted} processed events older than 24h`);
    }

    const expiredResult = await db
      .delete(webhookMessageQueueTable)
      .where(lt(webhookMessageQueueTable.expiresAt, new Date()));

    const expired = expiredResult.rowCount ?? 0;
    if (expired > 0) {
      console.log(`[webhook-queue] Cleanup: deleted ${expired} expired events`);
    }
  } catch (err) {
    console.error("[webhook-queue] cleanupWebhookQueue error:", (err as Error).message);
  }
}

// ── إحصائيات قائمة الانتظار (للوحة Admin) ────────────────────────────────────
export async function getQueueStats(): Promise<{
  pending: number;
  processedToday: number;
  expired: number;
}> {
  try {
    const now = new Date();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pendingRes = await db.execute(sql`
      SELECT COUNT(*)::int AS count
      FROM webhook_message_queue
      WHERE processed = false AND expires_at > ${now}
    `);

    const processedTodayRes = await db.execute(sql`
      SELECT COUNT(*)::int AS count
      FROM webhook_message_queue
      WHERE processed = true AND received_at > ${oneDayAgo}
    `);

    const expiredRes = await db.execute(sql`
      SELECT COUNT(*)::int AS count
      FROM webhook_message_queue
      WHERE expires_at < ${now}
    `);

    return {
      pending:        (pendingRes.rows[0] as { count: number } | undefined)?.count ?? 0,
      processedToday: (processedTodayRes.rows[0] as { count: number } | undefined)?.count ?? 0,
      expired:        (expiredRes.rows[0] as { count: number } | undefined)?.count ?? 0,
    };
  } catch (err) {
    console.error("[webhook-queue] getQueueStats error:", (err as Error).message);
    return { pending: 0, processedToday: 0, expired: 0 };
  }
}
