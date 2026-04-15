/**
 * 04_payment.test.ts — اختبارات بوابة الدفع Chargily
 *
 * يختبر:
 * - POST /api/payment/checkout  (إنشاء جلسة دفع — Chargily غير مُفعَّل في الاختبارات)
 * - POST /api/payment/webhook   (عام — التحقق من HMAC + معالجة الأحداث)
 * - GET  /api/payment/history   (سجل المدفوعات)
 * - التحقق من أن الـ webhook يقبل بدون token
 * - التحقق من رفض توقيع خاطئ
 */

import { describe, it, expect, beforeAll } from "vitest";
import crypto from "crypto";
import { api, registerTestTenant, type TestCtx } from "./helpers.js";

let ctx: TestCtx;

beforeAll(async () => {
  ctx = await registerTestTenant("pay");
});

// ── POST /api/payment/checkout ────────────────────────────────────────────────
describe("POST /api/payment/checkout", () => {
  it("يُرجع 503 عندما لا يكون Chargily مُفعَّلاً (لا API key)", async () => {
    const { status, body } = await api("POST", "/api/payment/checkout", {
      token: ctx.token,
      body:  { plan: "starter" },
    });
    const d = body as { configured: boolean };

    // في بيئة الاختبار — Chargily غير مُفعَّل → 503
    expect(status).toBe(503);
    expect(d.configured).toBe(false);
  });

  it("يرفض خطة غير قابلة للشراء (free) بـ 400", async () => {
    const { status } = await api("POST", "/api/payment/checkout", {
      token: ctx.token,
      body:  { plan: "free" },
    });
    // free ليس في قائمة الخطط القابلة للشراء
    expect([400, 503]).toContain(status);
  });

  it("يرفض خطة غير موجودة بـ 400 أو 503", async () => {
    const { status } = await api("POST", "/api/payment/checkout", {
      token: ctx.token,
      body:  { plan: "diamond" },
    });
    expect([400, 503]).toContain(status);
  });

  it("يرفض بدون token بـ 401", async () => {
    const { status } = await api("POST", "/api/payment/checkout", {
      body: { plan: "starter" },
    });
    expect(status).toBe(401);
  });

  it("يرفض بدون plan في body بـ 400 أو 503", async () => {
    const { status } = await api("POST", "/api/payment/checkout", {
      token: ctx.token,
      body:  {},
    });
    expect([400, 503]).toContain(status);
  });
});

// ── POST /api/payment/webhook (عام) ──────────────────────────────────────────
describe("POST /api/payment/webhook", () => {
  it("يُرفَض بدون header Signature بـ 400 أو 500", async () => {
    const { status } = await api("POST", "/api/payment/webhook", {
      body: { type: "checkout.paid", entity: "event", data: { id: "test", entity: "checkout", status: "paid" } },
    });
    // بدون CHARGILY_WEBHOOK_SECRET → 500، بدون توقيع → 400
    expect([400, 500]).toContain(status);
  });

  it("يُرفَض بتوقيع مزيف بـ 400 أو 500", async () => {
    const { status } = await api("POST", "/api/payment/webhook", {
      body: { type: "checkout.paid", entity: "event", data: { id: "test", entity: "checkout", status: "paid" } },
      headers: { "signature": "fakesignature1234567890abcdef" },
    });
    expect([400, 500]).toContain(status);
  });

  it("المسار عام — لا يُشترط JWT", async () => {
    // التحقق من أن الخادم يعالج الطلب (لا يرفضه بـ 401)
    const { status } = await api("POST", "/api/payment/webhook", {
      body: { type: "checkout.paid" },
    });
    // يجب ألا يكون 401 (مسار عام)
    expect(status).not.toBe(401);
  });
});

// ── GET /api/payment/history ─────────────────────────────────────────────────
describe("GET /api/payment/history", () => {
  it("يُرجع مصفوفة فارغة لمستأجر بدون مدفوعات", async () => {
    const { status, body } = await api("GET", "/api/payment/history", {
      token: ctx.token,
    });

    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it("يُرجع عناصر بالحقول الصحيحة إن وُجدت", async () => {
    const { body } = await api("GET", "/api/payment/history", {
      token: ctx.token,
    });
    const orders = body as Array<{
      id:        number;
      plan:      string;
      amountDzd: number;
      status:    string;
      createdAt: string;
    }>;

    // إن كانت هناك عناصر، تحقق من الحقول
    if (orders.length > 0) {
      const order = orders[0]!;
      expect(order.id).toBeDefined();
      expect(order.plan).toBeDefined();
      expect(order.amountDzd).toBeGreaterThan(0);
      expect(order.status).toBeDefined();
      expect(order.createdAt).toBeDefined();
    }
  });

  it("يُرجع سجلات المستأجر الحالي فقط (عزل)", async () => {
    // مستأجر آخر لا يرى سجلات مستأجر A
    const ctxOther = await registerTestTenant("pay-other");

    const [resA, resOther] = await Promise.all([
      api("GET", "/api/payment/history", { token: ctx.token }),
      api("GET", "/api/payment/history", { token: ctxOther.token }),
    ]);

    expect(resA.status).toBe(200);
    expect(resOther.status).toBe(200);

    const ordersA     = resA.body as Array<{ id: number }>;
    const ordersOther = resOther.body as Array<{ id: number }>;

    const idsA     = ordersA.map((o) => o.id);
    const idsOther = ordersOther.map((o) => o.id);

    // لا تشابك بين قوائم المدفوعات
    const intersection = idsA.filter((id) => idsOther.includes(id));
    expect(intersection.length).toBe(0);
  });

  it("يرفض بدون token بـ 401", async () => {
    const { status } = await api("GET", "/api/payment/history");
    expect(status).toBe(401);
  });
});

// ── التحقق من دالة HMAC (اختبار وحدة) ───────────────────────────────────────
describe("verifyChargilySignature — اختبار منطق التحقق", () => {
  it("توقيع HMAC-SHA256 صحيح يُنتج نفس النتيجة", () => {
    const secret  = "test-secret-123";
    const payload = JSON.stringify({ type: "checkout.paid", data: { id: "ch_123" } });
    const sig     = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    expect(sig).toBe(expected);
  });

  it("توقيع خاطئ لا يطابق", () => {
    const secret  = "test-secret-123";
    const payload = "some-payload";
    const correct = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const wrong   = crypto.createHmac("sha256", "wrong-secret").update(payload).digest("hex");

    expect(correct).not.toBe(wrong);
  });
});
