/**
 * quotaGuard.ts — التحقق من حصص الاشتراك وتتبع الاستخدام
 *
 * قواعد:
 * - limit = -1 → غير محدود
 * - limit = 0  → محظور تماماً (الخطة لا تدعم هذه الميزة)
 * - limit > 0  → محدود بالرقم
 */

import {
  db,
  tenantsTable,
  subscriptionUsageTable,
  productsTable,
  aiProvidersTable,
} from "@workspace/db";
import { eq, and, count, sql, lte } from "drizzle-orm";
import type { Tenant } from "@workspace/db";

// ── نسق شهر-سنة ─────────────────────────────────────────────────────────────
function currentMonthYear(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── نتيجة فحص الحصة ──────────────────────────────────────────────────────────
export interface QuotaResult {
  allowed:  boolean;
  used:     number;
  limit:    number;
  message?: string;
}

// ── التأكد من وجود صف الاستخدام للشهر الحالي ────────────────────────────────
export async function ensureUsageRow(tenantId: number): Promise<void> {
  const monthYear = currentMonthYear();
  const existing = await db
    .select({ id: subscriptionUsageTable.id })
    .from(subscriptionUsageTable)
    .where(
      and(
        eq(subscriptionUsageTable.tenantId, tenantId),
        eq(subscriptionUsageTable.monthYear, monthYear)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(subscriptionUsageTable).values({
      tenantId,
      monthYear,
      aiConversationsUsed:      0,
      broadcastSent:            0,
      messagesLimitWarningSent: 0,
      updatedAt: new Date().toISOString(),
    });
  }
}

// ── التحقق من حالة المستأجر (Trial/Expired/Suspended) ───────────────────────
export interface TenantStatusResult {
  active:  boolean;
  reason?: "trial_expired" | "expired" | "suspended";
}

export function checkTenantActive(tenant: Tenant): TenantStatusResult {
  if (tenant.status === "suspended") {
    return { active: false, reason: "suspended" };
  }
  if (tenant.status === "expired") {
    return { active: false, reason: "expired" };
  }
  if (
    tenant.status === "trial" &&
    tenant.trialEndsAt &&
    tenant.trialEndsAt < new Date()
  ) {
    return { active: false, reason: "trial_expired" };
  }
  return { active: true };
}

// ── رسائل الحد المتجاوز حسب السبب ───────────────────────────────────────────
export function getTenantStatusMessage(reason: TenantStatusResult["reason"]): string {
  switch (reason) {
    case "trial_expired":
      return "انتهت فترة التجربة المجانية. يرجى الاشتراك لمواصلة الاستخدام. 🔄";
    case "expired":
      return "انتهت صلاحية اشتراكك. يرجى تجديده لمواصلة الاستخدام. 🔄";
    case "suspended":
      return "حسابك موقوف مؤقتاً. يرجى التواصل مع الدعم.";
    default:
      return "خدمتك غير متاحة حالياً. يرجى التواصل مع الدعم.";
  }
}

// ── فحص حصة المحادثات (AI) ──────────────────────────────────────────────────
export async function checkConversationQuota(tenantId: number): Promise<QuotaResult> {
  const [tenant] = await db
    .select({ maxConversations: tenantsTable.maxConversations })
    .from(tenantsTable)
    .where(eq(tenantsTable.id, tenantId))
    .limit(1);

  const limit = tenant?.maxConversations ?? 100;

  if (limit === -1) return { allowed: true, used: 0, limit: -1 };

  await ensureUsageRow(tenantId);
  const monthYear = currentMonthYear();

  const [row] = await db
    .select({ used: subscriptionUsageTable.aiConversationsUsed })
    .from(subscriptionUsageTable)
    .where(
      and(
        eq(subscriptionUsageTable.tenantId, tenantId),
        eq(subscriptionUsageTable.monthYear, monthYear)
      )
    )
    .limit(1);

  const used = row?.used ?? 0;
  const allowed = used < limit;

  return {
    allowed,
    used,
    limit,
    message: allowed
      ? undefined
      : `تجاوزت حد المحادثات الشهرية (${used}/${limit}). يرجى الترقية إلى خطة أعلى. 🔄`,
  };
}

// ── زيادة عداد المحادثات ─────────────────────────────────────────────────────
export async function incrementConversationUsage(tenantId: number): Promise<void> {
  await ensureUsageRow(tenantId);
  const monthYear = currentMonthYear();

  await db
    .update(subscriptionUsageTable)
    .set({
      aiConversationsUsed: sql`${subscriptionUsageTable.aiConversationsUsed} + 1`,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(subscriptionUsageTable.tenantId, tenantId),
        eq(subscriptionUsageTable.monthYear, monthYear)
      )
    );
}

// ── فحص حصة المنتجات ────────────────────────────────────────────────────────
export async function checkProductQuota(tenantId: number): Promise<QuotaResult> {
  const [tenant] = await db
    .select({ maxProducts: tenantsTable.maxProducts })
    .from(tenantsTable)
    .where(eq(tenantsTable.id, tenantId))
    .limit(1);

  const limit = tenant?.maxProducts ?? 10;
  if (limit === -1) return { allowed: true, used: 0, limit: -1 };

  const [row] = await db
    .select({ cnt: count() })
    .from(productsTable)
    .where(eq(productsTable.tenantId, tenantId));

  const used = Number(row?.cnt ?? 0);
  const allowed = used < limit;

  return {
    allowed,
    used,
    limit,
    message: allowed
      ? undefined
      : `تجاوزت الحد الأقصى للمنتجات (${used}/${limit}). يرجى الترقية إلى خطة أعلى. 🔄`,
  };
}

// ── فحص حصة مزودي الذكاء الاصطناعي ─────────────────────────────────────────
export async function checkProviderQuota(tenantId: number): Promise<QuotaResult> {
  const [tenant] = await db
    .select({ maxProviders: tenantsTable.maxProviders })
    .from(tenantsTable)
    .where(eq(tenantsTable.id, tenantId))
    .limit(1);

  const limit = tenant?.maxProviders ?? 1;
  if (limit === -1) return { allowed: true, used: 0, limit: -1 };

  const [row] = await db
    .select({ cnt: count() })
    .from(aiProvidersTable)
    .where(eq(aiProvidersTable.tenantId, tenantId));

  const used = Number(row?.cnt ?? 0);
  const allowed = used < limit;

  return {
    allowed,
    used,
    limit,
    message: allowed
      ? undefined
      : `تجاوزت الحد الأقصى لمزودي الذكاء الاصطناعي (${used}/${limit}). يرجى الترقية إلى خطة أعلى. 🔄`,
  };
}

// ── فحص حصة البث الجماعي ────────────────────────────────────────────────────
export async function checkBroadcastQuota(tenantId: number): Promise<QuotaResult> {
  const [tenant] = await db
    .select({ maxBroadcasts: tenantsTable.maxBroadcasts })
    .from(tenantsTable)
    .where(eq(tenantsTable.id, tenantId))
    .limit(1);

  const limit = tenant?.maxBroadcasts ?? 0;

  if (limit === 0) {
    return {
      allowed: false,
      used: 0,
      limit: 0,
      message: "خطتك الحالية لا تدعم البث الجماعي. يرجى الترقية إلى خطة أعلى.",
    };
  }
  if (limit === -1) return { allowed: true, used: 0, limit: -1 };

  await ensureUsageRow(tenantId);
  const monthYear = currentMonthYear();

  const [row] = await db
    .select({ used: subscriptionUsageTable.broadcastSent })
    .from(subscriptionUsageTable)
    .where(
      and(
        eq(subscriptionUsageTable.tenantId, tenantId),
        eq(subscriptionUsageTable.monthYear, monthYear)
      )
    )
    .limit(1);

  const used = row?.used ?? 0;
  const allowed = used < limit;

  return {
    allowed,
    used,
    limit,
    message: allowed
      ? undefined
      : `تجاوزت حد رسائل البث الشهرية (${used}/${limit}). يرجى الترقية إلى خطة أعلى. 🔄`,
  };
}

// ── زيادة عداد البث ──────────────────────────────────────────────────────────
export async function incrementBroadcastUsage(
  tenantId: number,
  sentCount: number
): Promise<void> {
  if (sentCount <= 0) return;
  await ensureUsageRow(tenantId);
  const monthYear = currentMonthYear();

  await db
    .update(subscriptionUsageTable)
    .set({
      broadcastSent: sql`${subscriptionUsageTable.broadcastSent} + ${sentCount}`,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(subscriptionUsageTable.tenantId, tenantId),
        eq(subscriptionUsageTable.monthYear, monthYear)
      )
    );
}

// ── ملخص الاستخدام الكامل ─────────────────────────────────────────────────────
export interface UsageSummary {
  plan:                string;
  status:              string;
  trialEndsAt:         Date | null;
  maxConversations:    number;
  maxProducts:         number;
  maxProviders:        number;
  maxBroadcasts:       number;
  conversationsUsed:   number;
  productsUsed:        number;
  providersUsed:       number;
  broadcastsUsed:      number;
  monthYear:           string;
}

export async function getUsageSummary(tenantId: number): Promise<UsageSummary> {
  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.id, tenantId))
    .limit(1);

  if (!tenant) throw new Error("Tenant not found");

  await ensureUsageRow(tenantId);
  const monthYear = currentMonthYear();

  const [usageRow] = await db
    .select()
    .from(subscriptionUsageTable)
    .where(
      and(
        eq(subscriptionUsageTable.tenantId, tenantId),
        eq(subscriptionUsageTable.monthYear, monthYear)
      )
    )
    .limit(1);

  const [prodCount] = await db
    .select({ cnt: count() })
    .from(productsTable)
    .where(eq(productsTable.tenantId, tenantId));

  const [provCount] = await db
    .select({ cnt: count() })
    .from(aiProvidersTable)
    .where(eq(aiProvidersTable.tenantId, tenantId));

  return {
    plan:             tenant.plan,
    status:           tenant.status,
    trialEndsAt:      tenant.trialEndsAt ?? null,
    maxConversations: tenant.maxConversations,
    maxProducts:      tenant.maxProducts,
    maxProviders:     tenant.maxProviders,
    maxBroadcasts:    tenant.maxBroadcasts,
    conversationsUsed: usageRow?.aiConversationsUsed ?? 0,
    productsUsed:     Number(prodCount?.cnt ?? 0),
    providersUsed:    Number(provCount?.cnt ?? 0),
    broadcastsUsed:   usageRow?.broadcastSent ?? 0,
    monthYear,
  };
}

// ── انتهاء صلاحية حسابات Trial ────────────────────────────────────────────────
/**
 * يُشغَّل كل 4 ساعات — يحوّل المستأجرين الذين انتهت فترة تجربتهم إلى حالة "expired".
 * الشرط: plan = 'trial' AND trialEndsAt < NOW() AND status != 'expired'
 */
export async function expireTrials(): Promise<void> {
  try {
    const now = new Date();
    const expired = await db
      .update(tenantsTable)
      .set({ status: "expired", updatedAt: now })
      .where(
        and(
          eq(tenantsTable.plan, "trial"),
          lte(tenantsTable.trialEndsAt, now),
          eq(tenantsTable.status, "trial"),
        )
      )
      .returning({ id: tenantsTable.id });

    if (expired.length > 0) {
      console.log(`[trial-expiry] Expired ${expired.length} tenant(s): ids=${expired.map((t) => t.id).join(",")}`);
    }
  } catch (err) {
    console.error("[trial-expiry] Error:", (err as Error).message);
  }
}

export const PLAN_LIMITS: Record<string, {
  maxConversations: number;
  maxProducts:      number;
  maxProviders:     number;
  maxBroadcasts:    number;
}> = {
  free:    { maxConversations: 30,     maxProducts: 10,     maxProviders: 1, maxBroadcasts: 0    },
  trial:   { maxConversations: 100,    maxProducts: 10,     maxProviders: 1, maxBroadcasts: 0    },
  starter: { maxConversations: 300,    maxProducts: 50,     maxProviders: 3, maxBroadcasts: 500  },
  pro:     { maxConversations: 1000,   maxProducts: -1,     maxProviders: 6, maxBroadcasts: -1   },
  agency:  { maxConversations: -1,     maxProducts: -1,     maxProviders: 6, maxBroadcasts: -1   },
};
