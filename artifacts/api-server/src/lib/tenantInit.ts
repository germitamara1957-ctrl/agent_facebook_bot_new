import {
  db,
  aiConfigTable,
  fbSettingsTable,
  subscriptionUsageTable,
  tenantsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** نسق "YYYY-MM" للشهر الحالي */
function currentMonthYear(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── التحقق من الـ slug ────────────────────────────────────────────────────────

/**
 * قواعد الـ slug:
 * - 3 إلى 30 حرفاً
 * - أحرف صغيرة + أرقام + شرطة (-) فقط
 * - يبدأ وينتهي بحرف أو رقم
 */
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$|^[a-z0-9]{3}$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

export function slugError(slug: string): string | null {
  if (!slug) return "الـ slug مطلوب";
  if (slug.length < 3) return "يجب أن يكون الـ slug 3 أحرف على الأقل";
  if (slug.length > 30) return "يجب أن يكون الـ slug 30 حرفاً أو أقل";
  if (!/^[a-z0-9-]+$/.test(slug)) return "الـ slug يقبل أحرفاً صغيرة وأرقام وشرطة فقط";
  if (/^-|-$/.test(slug)) return "الـ slug لا يبدأ ولا ينتهي بشرطة";
  if (/--/.test(slug)) return "الـ slug لا يحتوي على شرطتين متتاليتين";
  return null;
}

// ── تهيئة بيانات المستأجر الجديد ─────────────────────────────────────────────

/**
 * تُنشئ البيانات الافتراضية لكل tenant جديد:
 * - ai_config    : إعدادات الذكاء الاصطناعي الأولية
 * - fb_settings  : صف فارغ للإعدادات
 * - subscription_usage : عداد الاستهلاك للشهر الحالي
 */
export async function initializeTenant(
  tenantId: number,
  displayName: string
): Promise<void> {
  // 1) إعداد الذكاء الاصطناعي الافتراضي
  const existingConfig = await db
    .select({ id: aiConfigTable.id })
    .from(aiConfigTable)
    .where(eq(aiConfigTable.tenantId, tenantId))
    .limit(1);

  if (existingConfig.length === 0) {
    await db.insert(aiConfigTable).values({
      tenantId,
      botName: displayName ?? "مساعد المتجر",
      language: "auto",
      currency: "DZD",
      timezone: "Africa/Algiers",
      currentPlan: "trial",
    });
  }

  // 2) إعدادات Facebook (صف فارغ)
  const existingSettings = await db
    .select({ id: fbSettingsTable.id })
    .from(fbSettingsTable)
    .where(eq(fbSettingsTable.tenantId, tenantId))
    .limit(1);

  if (existingSettings.length === 0) {
    await db.insert(fbSettingsTable).values({ tenantId });
  }

  // 3) عداد الاستهلاك للشهر الحالي
  const monthYear = currentMonthYear();
  const existingUsage = await db
    .select({ id: subscriptionUsageTable.id })
    .from(subscriptionUsageTable)
    .where(eq(subscriptionUsageTable.tenantId, tenantId))
    .limit(1);

  if (existingUsage.length === 0) {
    await db.insert(subscriptionUsageTable).values({
      tenantId,
      monthYear,
      aiConversationsUsed: 0,
      broadcastSent: 0,
      messagesLimitWarningSent: 0,
      updatedAt: new Date().toISOString(),
    });
  }

  console.log(`[tenantInit] Tenant #${tenantId} "${displayName}" initialized ✓`);
}

// ── استرجاع بيانات المستأجر ───────────────────────────────────────────────────

export async function getTenantById(tenantId: number) {
  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.id, tenantId))
    .limit(1);
  return tenant ?? null;
}
