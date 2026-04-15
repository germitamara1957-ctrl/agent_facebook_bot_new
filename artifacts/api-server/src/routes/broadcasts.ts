import { Router, type IRouter } from "express";
import multer from "multer";
import { db, broadcastsTable, leadsTable, fbSettingsTable } from "@workspace/db";
import { eq, sql, desc, and } from "drizzle-orm";
import { sendFbMessage, sendFbImageFromDataUrl } from "../lib/ai.js";
import { checkBroadcastQuota, incrementBroadcastUsage } from "../lib/quotaGuard.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router: IRouter = Router();

router.get("/broadcasts/image/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const [broadcast] = await db.select({ imageUrl: broadcastsTable.imageUrl }).from(broadcastsTable).where(eq(broadcastsTable.id, id)).limit(1);

  if (!broadcast?.imageUrl) {
    res.status(404).end();
    return;
  }

  const dataUrl = broadcast.imageUrl;
  if (dataUrl.startsWith("data:")) {
    const [meta, b64] = dataUrl.split(",") as [string, string];
    const mimeMatch = meta.match(/data:([^;]+)/);
    const mime = mimeMatch?.[1] ?? "image/jpeg";
    const buf = Buffer.from(b64, "base64");
    res.set("Content-Type", mime);
    res.set("Cache-Control", "public, max-age=86400");
    res.end(buf);
  } else {
    res.redirect(302, dataUrl);
  }
});

router.get("/broadcasts", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const rows = await db.select().from(broadcastsTable).where(eq(broadcastsTable.tenantId, tenantId)).orderBy(desc(broadcastsTable.createdAt));
  res.json(rows);
});

router.post("/broadcasts", upload.single("broadcastImage"), async (req, res): Promise<void> => {
  const body = req.body as {
    title?: string;
    messageText?: string;
    imageUrl?: string;
    targetFilter?: string;
    targetLabel?: string;
    scheduledAt?: string;
  };

  if (!body.title || !body.messageText) {
    res.status(400).json({ message: "title and messageText are required" });
    return;
  }

  const file = req.file as Express.Multer.File | undefined;
  const imageUrl = file
    ? `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
    : (body.imageUrl ?? null);

  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const [created] = await db
    .insert(broadcastsTable)
    .values({
      tenantId,
      title: body.title,
      messageText: body.messageText,
      imageUrl,
      targetFilter: body.targetFilter ?? "all",
      targetLabel: body.targetLabel ?? null,
      status: "draft",
      scheduledAt: body.scheduledAt ?? null,
    })
    .returning();

  res.status(201).json(created);
});

router.patch("/broadcasts/:id", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const id = Number(req.params["id"]);
  const body = req.body as {
    title?: string;
    messageText?: string;
    imageUrl?: string;
    targetFilter?: string;
    targetLabel?: string;
    scheduledAt?: string;
  };

  const [broadcast] = await db.select().from(broadcastsTable).where(and(eq(broadcastsTable.id, id), eq(broadcastsTable.tenantId, tenantId))).limit(1);
  if (!broadcast) {
    res.status(404).json({ message: "Broadcast not found" });
    return;
  }

  const [updated] = await db
    .update(broadcastsTable)
    .set({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.messageText !== undefined && { messageText: body.messageText }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
      ...(body.targetFilter !== undefined && { targetFilter: body.targetFilter }),
      ...(body.targetLabel !== undefined && { targetLabel: body.targetLabel }),
      ...(body.scheduledAt !== undefined && { scheduledAt: body.scheduledAt }),
    })
    .where(and(eq(broadcastsTable.id, id), eq(broadcastsTable.tenantId, tenantId)))
    .returning();

  res.json(updated);
});

router.delete("/broadcasts/:id", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const id = Number(req.params["id"]);
  await db.delete(broadcastsTable).where(and(eq(broadcastsTable.id, id), eq(broadcastsTable.tenantId, tenantId)));
  res.json({ message: "Deleted" });
});

async function executeBroadcastSend(
  broadcastId: number,
  tenantId: number,
  token: string,
  fbPageId: string | undefined,
  messageText: string,
  imageUrl: string | null,
  userIds: string[],
): Promise<void> {
  let sentCount = 0;

  for (const userId of userIds) {
    let textSent = false;

    if (imageUrl) {
      try {
        await sendFbImageFromDataUrl(token, userId, imageUrl, fbPageId);
      } catch (e) {
        console.warn(`[broadcast:${broadcastId}] Image send failed for ${userId}:`, e instanceof Error ? e.message : String(e));
      }
    }
    try {
      await sendFbMessage(token, userId, messageText, fbPageId);
      textSent = true;
    } catch (e) {
      console.warn(`[broadcast:${broadcastId}] Text send failed for ${userId}:`, e instanceof Error ? e.message : String(e));
    }
    if (textSent) sentCount++;

    if (sentCount > 0 && sentCount % 10 === 0) {
      await db.update(broadcastsTable)
        .set({ sentCount })
        .where(eq(broadcastsTable.id, broadcastId));
    }

    if (userIds.length > 10) {
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
    }
  }

  await db.update(broadcastsTable)
    .set({
      status: "sent",
      sentCount,
      totalRecipients: userIds.length,
      sentAt: new Date().toISOString(),
    })
    .where(eq(broadcastsTable.id, broadcastId));

  void incrementBroadcastUsage(tenantId, sentCount).catch((err) => {
    console.warn("[quota] incrementBroadcastUsage failed:", (err as Error).message);
  });

  console.log(`[broadcast:${broadcastId}] ✅ Completed: ${sentCount}/${userIds.length} sent`);
}

router.post("/broadcasts/:id/send", async (req, res): Promise<void> => {
  const id       = Number(req.params["id"]);
  const tenantId = (req as AuthenticatedRequest).user?.tenantId ?? 1;

  const quota = await checkBroadcastQuota(tenantId);
  if (!quota.allowed) {
    res.status(403).json({ message: quota.message ?? "تجاوزت حد البث الشهري في خطتك. يرجى الترقية." });
    return;
  }

  const [broadcast] = await db.select().from(broadcastsTable).where(and(eq(broadcastsTable.id, id), eq(broadcastsTable.tenantId, tenantId))).limit(1);
  if (!broadcast) {
    res.status(404).json({ message: "Broadcast not found" });
    return;
  }

  if (broadcast.status === "sending") {
    res.status(409).json({ message: "البث جارٍ بالفعل. انتظر حتى ينتهي أو تحقق من الحالة." });
    return;
  }

  const [fbRow] = await db
    .select({ pageAccessToken: fbSettingsTable.pageAccessToken, pageId: fbSettingsTable.pageId })
    .from(fbSettingsTable)
    .where(eq(fbSettingsTable.tenantId, tenantId))
    .limit(1);
  const token = fbRow?.pageAccessToken ?? null;
  const fbPageId = fbRow?.pageId ?? undefined;
  if (!token) {
    res.status(400).json({ message: "Facebook page not connected" });
    return;
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let activeUserIds: string[] = [];

  if (broadcast.targetFilter === "label" && broadcast.targetLabel) {
    const labelLeads = await db
      .select({ fbUserId: leadsTable.fbUserId })
      .from(leadsTable)
      .where(and(eq(leadsTable.tenantId, tenantId), eq(leadsTable.label, broadcast.targetLabel)));
    const labelUserIds = labelLeads.map((l) => l.fbUserId);

    if (labelUserIds.length > 0) {
      const recentRows = await db.execute(sql`
        SELECT fb_user_id
        FROM conversations
        WHERE tenant_id = ${tenantId} AND fb_user_id = ANY(${labelUserIds})
        GROUP BY fb_user_id
        HAVING MAX(timestamp) > ${twentyFourHoursAgo}
      `);
      activeUserIds = (recentRows.rows as { fb_user_id: string }[]).map((r) => r.fb_user_id);
    }
  } else if (broadcast.targetFilter === "appointments") {
    const apptRows = await db.execute(sql`
      SELECT DISTINCT a.fb_user_id
      FROM appointments a
      WHERE a.tenant_id = ${tenantId}
        AND a.status IN ('pending', 'confirmed')
        AND EXISTS (
          SELECT 1 FROM (
            SELECT fb_user_id, MAX(timestamp) AS last_ts
            FROM conversations
            WHERE tenant_id = ${tenantId}
            GROUP BY fb_user_id
          ) sub
          WHERE sub.fb_user_id = a.fb_user_id
            AND sub.last_ts > ${twentyFourHoursAgo}
        )
    `);
    activeUserIds = (apptRows.rows as { fb_user_id: string }[]).map((r) => r.fb_user_id);
  } else {
    const recentRows = await db.execute(sql`
      SELECT fb_user_id
      FROM conversations
      WHERE tenant_id = ${tenantId}
      GROUP BY fb_user_id
      HAVING MAX(timestamp) > ${twentyFourHoursAgo}
    `);
    activeUserIds = (recentRows.rows as { fb_user_id: string }[]).map((r) => r.fb_user_id);
  }

  const totalRecipients = activeUserIds.length;

  await db.update(broadcastsTable)
    .set({ status: "sending", totalRecipients, sentCount: 0 })
    .where(and(eq(broadcastsTable.id, id), eq(broadcastsTable.tenantId, tenantId)));

  res.json({
    message: "تم إضافة البث إلى قائمة الإرسال",
    status:  "sending",
    totalRecipients,
    broadcastId: id,
  });

  void executeBroadcastSend(
    id, tenantId, token, fbPageId,
    broadcast.messageText, broadcast.imageUrl ?? null,
    activeUserIds,
  ).catch((err: unknown) => {
    console.error(`[broadcast:${id}] Fatal error in executeBroadcastSend:`, (err as Error).message);
    void db.update(broadcastsTable)
      .set({ status: "draft" })
      .where(and(eq(broadcastsTable.id, id), eq(broadcastsTable.tenantId, tenantId)));
  });
});

router.get("/broadcasts/:id/status", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const id = Number(req.params["id"]);
  const [broadcast] = await db
    .select({
      id: broadcastsTable.id,
      title: broadcastsTable.title,
      status: broadcastsTable.status,
      sentCount: broadcastsTable.sentCount,
      totalRecipients: broadcastsTable.totalRecipients,
      sentAt: broadcastsTable.sentAt,
    })
    .from(broadcastsTable)
    .where(and(eq(broadcastsTable.id, id), eq(broadcastsTable.tenantId, tenantId)))
    .limit(1);

  if (!broadcast) {
    res.status(404).json({ message: "Broadcast not found" });
    return;
  }

  const total = broadcast.totalRecipients ?? 0;
  const sent  = broadcast.sentCount ?? 0;
  res.json({
    id:              broadcast.id,
    title:           broadcast.title,
    status:          broadcast.status,
    sentCount:       sent,
    totalRecipients: total,
    sentAt:          broadcast.sentAt ?? null,
    progressPercent: total > 0 ? Math.round((sent / total) * 100) : 0,
    isComplete:      broadcast.status === "sent" || broadcast.status === "draft",
  });
});

router.get("/broadcasts/:id/stats", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const id = Number(req.params["id"]);
  const [broadcast] = await db.select().from(broadcastsTable).where(and(eq(broadcastsTable.id, id), eq(broadcastsTable.tenantId, tenantId))).limit(1);
  if (!broadcast) {
    res.status(404).json({ message: "Broadcast not found" });
    return;
  }
  res.json({
    id: broadcast.id,
    title: broadcast.title,
    status: broadcast.status,
    sentCount: broadcast.sentCount ?? 0,
    totalRecipients: broadcast.totalRecipients ?? 0,
    sentAt: broadcast.sentAt ?? null,
    deliveryRate: broadcast.totalRecipients
      ? Math.round(((broadcast.sentCount ?? 0) / broadcast.totalRecipients) * 100)
      : 0,
  });
});

export default router;
