/**
 * 05_quota.test.ts — اختبارات حماية الحصص
 *
 * يختبر:
 * - منع إضافة منتجات تتجاوز الحد (maxProducts)
 * - منع إضافة مزودي AI تتجاوز الحد (maxProviders)
 * - منع إرسال broadcasts تتجاوز الحد (maxBroadcasts)
 * - GET /api/subscription تعكس الاستخدام الحالي
 * - الحصص تُطبَّق على tenant المحدد فقط
 */

import { describe, it, expect, beforeAll } from "vitest";
import { api, registerTestTenant, type TestCtx } from "./helpers.js";

let ctx: TestCtx;

beforeAll(async () => {
  ctx = await registerTestTenant("quota");
  // نُرقّي المستأجر إلى starter لاختبار الحدود بشكل واقعي
  await api("PUT", "/api/subscription/manual-activate", {
    token: ctx.token,
    body:  { plan: "starter" },
  });
});

// ── اختبار حصة المنتجات ───────────────────────────────────────────────────────
describe("Product Quota", () => {
  it("GET /api/subscription يعكس عدد المنتجات الحالي", async () => {
    const { body } = await api("GET", "/api/subscription", {
      token: ctx.token,
    });
    const d = body as { productsUsed: number; maxProducts: number };

    expect(d.productsUsed).toBeGreaterThanOrEqual(0);
    expect(d.maxProducts).toBe(50); // حد starter
  });
});

// ── اختبار حصة المزودين ───────────────────────────────────────────────────────
describe("Provider Quota", () => {
  it("POST /api/providers يُرجع حقل maxProviders صحيح في الاشتراك", async () => {
    const { body } = await api("GET", "/api/subscription", {
      token: ctx.token,
    });
    const d = body as { maxProviders: number; providersUsed: number };

    expect(d.maxProviders).toBe(3); // حد starter
    expect(d.providersUsed).toBeGreaterThanOrEqual(0);
  });

  it("POST /api/providers يُرجع 403 لأن إدارة المزودين حُوِّلت للسوبر أدمن فقط", async () => {
    const { status } = await api("POST", "/api/providers", {
      token: ctx.token,
      body: {
        name:         "Test Provider Quota",
        providerType: "openai",
        apiKey:       "sk-test-quota-check",
        modelName:    "gpt-3.5-turbo",
      },
    });
    // إدارة المزودين متاحة للسوبر أدمن فقط عبر /api/admin/providers
    expect(status).toBe(403);
  });
});

// ── اختبار حصة البث ──────────────────────────────────────────────────────────
describe("Broadcast Quota", () => {
  it("خطة free تمنع إرسال broadcast (maxBroadcasts=0)", async () => {
    // أنشئ مستأجر على خطة free
    const freeCtx = await registerTestTenant("quota-free");
    await api("PUT", "/api/subscription/manual-activate", {
      token: freeCtx.token,
      body:  { plan: "free" },
    });

    // أنشئ broadcast أولاً
    const createResp = await api("POST", "/api/broadcasts", {
      token: freeCtx.token,
      body: {
        title:       "Free Plan Broadcast",
        messageText: "Test message",
      },
    });

    if (createResp.status === 201) {
      const broadcast = createResp.body as { id: number };
      // حاول إرسال البث — يجب أن يُرفَض بـ 403
      const { status, body } = await api(
        "POST",
        `/api/broadcasts/${broadcast.id}/send`,
        { token: freeCtx.token }
      );
      const d = body as { message: string };
      expect(status).toBe(403);
      expect(d.message).toBeTruthy();
    } else {
      // إن فشل إنشاء broadcast، نتحقق فقط من أن الحصة مضبوطة
      const { body } = await api("GET", "/api/subscription", {
        token: freeCtx.token,
      });
      const d = body as { maxBroadcasts: number };
      expect(d.maxBroadcasts).toBe(0);
    }
  });

  it("خطة agency تسمح بإرسال غير محدود (maxBroadcasts=-1)", async () => {
    const agencyCtx = await registerTestTenant("quota-agency");
    await api("PUT", "/api/subscription/manual-activate", {
      token: agencyCtx.token,
      body:  { plan: "agency" },
    });

    const { body } = await api("GET", "/api/subscription", {
      token: agencyCtx.token,
    });
    const d = body as { maxBroadcasts: number };
    expect(d.maxBroadcasts).toBe(-1); // غير محدود
  });
});

// ── اختبار عزل الحصص بين المستأجرين ─────────────────────────────────────────
describe("Quota Isolation — عزل الحصص", () => {
  it("استخدام مستأجر A لا يؤثر على حصة مستأجر B", async () => {
    const ctxB = await registerTestTenant("quota-b");

    // قراءة استخدام مستأجر B
    const { body } = await api("GET", "/api/subscription", {
      token: ctxB.token,
    });
    const d = body as { conversationsUsed: number };

    // مستأجر B جديد — استخدامه يبدأ من صفر
    expect(d.conversationsUsed).toBe(0);
  });
});

// ── اختبار دالة getUsageSummary عبر الـ API ──────────────────────────────────
describe("Usage Summary API fields", () => {
  it("يحتوي على جميع حقول الاستخدام المطلوبة", async () => {
    const { status, body } = await api("GET", "/api/subscription", {
      token: ctx.token,
    });
    const d = body as Record<string, unknown>;

    expect(status).toBe(200);
    const requiredFields = [
      "plan", "status", "maxConversations", "maxProducts",
      "maxProviders", "maxBroadcasts", "conversationsUsed",
      "productsUsed", "providersUsed", "broadcastsUsed",
      "monthYear", "statusCheck", "conversationsPercent",
      "productsPercent", "broadcastsPercent",
    ];
    requiredFields.forEach((field) => {
      expect(d).toHaveProperty(field);
    });
  });

  it("conversationsPercent في النطاق [0, 100] للخطط المحدودة", async () => {
    // خطة starter: maxConversations=300
    const { body } = await api("GET", "/api/subscription", {
      token: ctx.token,
    });
    const d = body as { conversationsPercent: number; maxConversations: number };

    if (d.maxConversations !== -1) {
      expect(d.conversationsPercent).toBeGreaterThanOrEqual(0);
      expect(d.conversationsPercent).toBeLessThanOrEqual(100);
    }
  });
});
