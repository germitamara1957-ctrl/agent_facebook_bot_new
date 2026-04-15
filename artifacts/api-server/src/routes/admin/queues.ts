/**
 * admin/queues.ts — Admin Queue Monitoring
 *
 * GET /api/admin/queues — إحصائيات قائمة انتظار Webhook وBroadcast للوحة السوبر أدمن
 */

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { superAdminMiddleware } from "../../middleware/superAdminMiddleware.js";
import { getQueueStats } from "../../lib/webhookCrashRecovery.js";

const router: IRouter = Router();

router.get("/admin/queues", superAdminMiddleware, async (_req, res): Promise<void> => {
  try {
    const webhookStats = await getQueueStats();

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const activeBroadcastsRes = await db.execute(sql`
      SELECT COUNT(*)::int AS count
      FROM broadcasts
      WHERE status = 'sending'
    `);

    const completedTodayRes = await db.execute(sql`
      SELECT COUNT(*)::int AS count
      FROM broadcasts
      WHERE status = 'sent' AND sent_at > ${oneDayAgo}
    `);

    const failedBroadcastsRes = await db.execute(sql`
      SELECT COUNT(*)::int AS count
      FROM broadcasts
      WHERE status = 'failed' AND created_at > ${oneDayAgo}
    `);

    const activeBroadcastCount = (activeBroadcastsRes.rows[0] as { count: number } | undefined)?.count ?? 0;
    const completedToday       = (completedTodayRes.rows[0] as { count: number } | undefined)?.count ?? 0;
    const failedToday          = (failedBroadcastsRes.rows[0] as { count: number } | undefined)?.count ?? 0;

    const queueHealth = webhookStats.pending === 0 && activeBroadcastCount === 0
      ? "idle"
      : webhookStats.pending > 100 || activeBroadcastCount > 5
        ? "degraded"
        : "healthy";

    res.json({
      webhookQueue: {
        pending:        webhookStats.pending,
        processedToday: webhookStats.processedToday,
        expired:        webhookStats.expired,
      },
      broadcastQueue: {
        active:          activeBroadcastCount,
        completedToday,
        failedToday,
      },
      queueHealth,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[admin/queues] Error:", (err as Error).message);
    res.status(500).json({ message: "Failed to fetch queue stats" });
  }
});

export default router;
