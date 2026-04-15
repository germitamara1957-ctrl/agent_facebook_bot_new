import { Router, type IRouter } from "express";
import { db, platformEventsTable } from "@workspace/db";
import { desc, count, eq } from "drizzle-orm";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const router: IRouter = Router();

const EVENT_TYPES = [
  "low_confidence",
  "rescue_triggered",
  "handoff",
  "provider_failure",
  "blocked_keyword",
  "kill_switch_blocked",
  "off_topic_escalation",
  "safe_mode_blocked",
] as const;

router.get("/platform-reliability", async (req, res): Promise<void> => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId ?? 1;

  const countsRaw = await db
    .select({ eventType: platformEventsTable.eventType, count: count() })
    .from(platformEventsTable)
    .where(eq(platformEventsTable.tenantId, tenantId))
    .groupBy(platformEventsTable.eventType);

  const counts: Record<string, number> = {};
  for (const type of EVENT_TYPES) counts[type] = 0;
  for (const row of countsRaw) {
    counts[row.eventType] = row.count;
  }

  const recent = await db
    .select()
    .from(platformEventsTable)
    .where(eq(platformEventsTable.tenantId, tenantId))
    .orderBy(desc(platformEventsTable.createdAt))
    .limit(25);

  res.json({ counts, recent });
});

export default router;
