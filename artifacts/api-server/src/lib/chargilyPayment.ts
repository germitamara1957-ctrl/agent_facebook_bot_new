/**
 * chargilyPayment.ts — تكامل بوابة الدفع Chargily Pay v2
 *
 * متغيرات البيئة المطلوبة:
 *   CHARGILY_API_KEY         — المفتاح السري لـ API
 *   CHARGILY_WEBHOOK_SECRET  — للتحقق من توقيع الـ webhook
 *   APP_URL                  — رابط التطبيق (لتحديد success/failure URL)
 *
 * وثائق Chargily Pay v2: https://developers.chargily.com/api-reference
 */

import crypto from "crypto";
import { PLAN_LIMITS } from "./quotaGuard.js";

const CHARGILY_BASE_URL = "https://pay.chargily.net/api/v2";

// ── أسعار الخطط بالدينار الجزائري ────────────────────────────────────────────
export const PLAN_PRICES_DZD: Record<string, number> = {
  starter: 2900,
  pro:     6900,
  agency:  14900,
};

// خطط قابلة للشراء (لا يمكن الشراء للـ free أو trial)
export const PURCHASABLE_PLANS = Object.keys(PLAN_PRICES_DZD);

// ── نوع استجابة Chargily ──────────────────────────────────────────────────────
export interface ChargilyCheckoutResponse {
  checkoutUrl:  string;
  checkoutId:   string;
}

export interface ChargilyWebhookPayload {
  id:     string;
  entity: string;
  type:   string;
  data: {
    id:       string;
    entity:   string;
    status:   string;
    amount:   number;
    currency: string;
    metadata?: Record<string, string>;
  };
}

// ── التحقق من إعداد Chargily ─────────────────────────────────────────────────
export function isChargilyConfigured(): boolean {
  return !!(
    process.env["CHARGILY_API_KEY"] &&
    process.env["CHARGILY_WEBHOOK_SECRET"]
  );
}

// ── إنشاء جلسة دفع ───────────────────────────────────────────────────────────
export async function createChargilyCheckout(params: {
  tenantId:  number;
  plan:      string;
  backUrl?:  string;
}): Promise<ChargilyCheckoutResponse> {
  const apiKey = process.env["CHARGILY_API_KEY"];
  if (!apiKey) {
    throw new Error("CHARGILY_API_KEY غير مضبوط. يرجى إضافته كمتغير بيئة.");
  }

  const amountDzd = PLAN_PRICES_DZD[params.plan];
  if (!amountDzd) {
    throw new Error(`خطة غير صالحة: ${params.plan}`);
  }

  const appUrl     = (process.env["APP_URL"] ?? "").replace(/\/$/, "");
  const successUrl = `${appUrl}/subscription?payment=success&plan=${params.plan}`;
  const failureUrl = `${appUrl}/subscription?payment=failed`;

  const body = {
    amount:      amountDzd,
    currency:    "dzd",
    success_url: successUrl,
    failure_url: failureUrl,
    locale:      "ar",
    description: `اشتراك خطة ${params.plan} — Social-AI`,
    metadata: {
      tenant_id: String(params.tenantId),
      plan:      params.plan,
    },
  };

  const response = await fetch(`${CHARGILY_BASE_URL}/checkouts`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "unknown error");
    throw new Error(`Chargily API error ${response.status}: ${errText}`);
  }

  const data = await response.json() as {
    id:          string;
    checkout_url: string;
  };

  return {
    checkoutUrl: data.checkout_url,
    checkoutId:  data.id,
  };
}

// ── التحقق من توقيع الـ webhook ──────────────────────────────────────────────
export function verifyChargilySignature(
  signature: string | undefined,
  rawBody:   Buffer,
  secret:    string
): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

// ── إرجاع حدود الخطة لتحديث tenantsTable ────────────────────────────────────
export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS["free"]!;
}
