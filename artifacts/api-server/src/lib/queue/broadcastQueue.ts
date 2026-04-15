/**
 * queue/broadcastQueue.ts
 *
 * قائمة إرسال Broadcast مع دعم BullMQ عند توفّر Redis،
 * أو تنفيذ مباشر غير متزامن (fire-and-forget) عند غيابه.
 *
 * الفائدة: يُرجع الـ endpoint ردّاً فورياً بدلاً من الانتظار
 * حتى انتهاء إرسال مئات/آلاف الرسائل.
 */

import { Queue, Worker, type Job } from "bullmq";
import { getQueueConnection } from "./connection.js";
import type { BroadcastJobData } from "./types.js";

export const BROADCAST_QUEUE_NAME = "broadcast-send";

let _queue: Queue<BroadcastJobData> | null = null;

export function getBroadcastQueue(): Queue<BroadcastJobData> | null {
  const conn = getQueueConnection();
  if (!conn) return null;

  if (!_queue) {
    _queue = new Queue<BroadcastJobData>(BROADCAST_QUEUE_NAME, {
      connection: conn,
      defaultJobOptions: {
        attempts:    3,
        backoff:     { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail:     { count: 50 },
      },
    });
  }
  return _queue;
}

let _worker: Worker<BroadcastJobData> | null = null;

/**
 * يُشغّل BullMQ Worker لمعالجة وظائف الـ Broadcast.
 * يُستدعى مرة واحدة عند بدء تشغيل الخادم.
 */
export function startBroadcastWorker(
  processor: (job: Job<BroadcastJobData>) => Promise<void>
): void {
  const conn = getQueueConnection();
  if (!conn) return;

  _worker = new Worker<BroadcastJobData>(
    BROADCAST_QUEUE_NAME,
    processor,
    {
      connection:  conn,
      concurrency: 1,
    }
  );

  _worker.on("completed", (job) => {
    console.log(`[broadcast-queue] Job ${job.id} completed`);
  });

  _worker.on("failed", (job, err) => {
    console.error(`[broadcast-queue] Job ${job?.id} failed:`, err.message);
  });

  console.info("[broadcast-queue] BullMQ worker started");
}

export async function closeBroadcastQueue(): Promise<void> {
  await _worker?.close();
  await _queue?.close();
}
