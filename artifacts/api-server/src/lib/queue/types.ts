/**
 * queue/types.ts — تعريفات أنواع بيانات وظائف Queue
 */

// ── وظيفة معالجة Webhook ────────────────────────────────────────────────────
export interface WebhookJobData {
  tenantId:   number;
  fbPageId:   string;
  payload:    string;
  receivedAt: string;
  queueId:    number;
}

// ── وظيفة إرسال Broadcast ──────────────────────────────────────────────────
export interface BroadcastJobData {
  broadcastId:   number;
  tenantId:      number;
  recipientIds:  string[];
  messageText:   string;
  imageUrl:      string | null;
  pageAccessToken: string;
  fbPageId:      string | undefined;
}

// ── حالة وظيفة Broadcast ───────────────────────────────────────────────────
export type BroadcastJobStatus =
  | "queued"
  | "sending"
  | "sent"
  | "failed"
  | "draft";
