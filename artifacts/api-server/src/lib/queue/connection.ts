/**
 * queue/connection.ts
 *
 * اتصال Redis لـ BullMQ.
 * - إذا كان REDIS_URL مضبوطاً: يُنشئ اتصال BullMQ حقيقي
 * - إذا لم يكن مضبوطاً: يُرجع null ويُسجّل تحذيراً
 *
 * النظام يعمل بالكامل بدون Redis (fallback إلى DB queue)
 */

import type { ConnectionOptions } from "bullmq";

let _connection: ConnectionOptions | null = null;
let _checked = false;

export function getQueueConnection(): ConnectionOptions | null {
  if (_checked) return _connection;
  _checked = true;

  const redisUrl = process.env["REDIS_URL"];
  if (!redisUrl) {
    console.info("[queue] REDIS_URL not set — BullMQ disabled, using DB queue fallback");
    return null;
  }

  try {
    const url = new URL(redisUrl);
    _connection = {
      host:     url.hostname,
      port:     Number(url.port) || 6379,
      password: url.password || undefined,
      username: url.username || undefined,
      tls:      redisUrl.startsWith("rediss://") ? {} : undefined,
    };
    console.info("[queue] Redis connection configured — BullMQ active");
    return _connection;
  } catch (err) {
    console.warn("[queue] Invalid REDIS_URL — falling back to DB queue:", (err as Error).message);
    return null;
  }
}

export const isQueueRedisAvailable = (): boolean => getQueueConnection() !== null;
