/**
 * 03_subscription.test.ts — اختبارات الاشتراكات والخطط
 *
 * يختبر:
 * - GET  /api/subscription          (بيانات الاشتراك الحالي)
 * - GET  /api/subscription/plans    (عام — لا يحتاج token)
 * - PUT  /api/subscription/manual-activate  (ترقية الخطة)
 * - التحقق من صحة حدود الخطط
 * - رفض الترقية لخطة غير موجودة
 * - رفض الوصول لغير المالكين
 */

import { describe, it, expect, beforeAll } from "vitest";
import { api, registerTestTenant, type TestCtx } from "./helpers.js";

let ctx: TestCtx;

beforeAll(async () => {
  ctx = await registerTestTenant("sub");
});

// ── GET /api/subscription ─────────────────────────────────────────────────────
describe("GET /api/subscription", () => {
  it("يُرجع بيانات الاشتراك الكاملة", async () => {
    const { status, body } = await api("GET", "/api/subscription", {
      token: ctx.token,
    });
    const d = body as {
      plan:                 string;
      status:               string;
      maxConversations:     number;
      maxProducts:          number;
      maxProviders:         number;
      maxBroadcasts:        number;
      conversationsUsed:    number;
      productsUsed:         number;
      providersUsed:        number;
      broadcastsUsed:       number;
      monthYear:            string;
      statusCheck:          { active: boolean };
      conversationsPercent: number;
    };

    expect(status).toBe(200);
    expect(d.plan).toBe("trial");
    expect(d.status).toBe("trial");
    expect(d.maxConversations).toBe(100);  // حد التجربة
    expect(d.maxProducts).toBe(10);
    expect(d.maxProviders).toBe(1);
    expect(d.maxBroadcasts).toBe(0);
    expect(d.conversationsUsed).toBeGreaterThanOrEqual(0);
    expect(d.productsUsed).toBeGreaterThanOrEqual(0);
    expect(d.monthYear).toMatch(/^\d{4}-\d{2}$/); // YYYY-MM format
    expect(d.statusCheck.active).toBe(true);
    expect(d.conversationsPercent).toBeGreaterThanOrEqual(0);
    expect(d.conversationsPercent).toBeLessThanOrEqual(100);
  });

  it("يرفض بدون token بـ 401", async () => {
    const { status } = await api("GET", "/api/subscription");
    expect(status).toBe(401);
  });
});

// ── GET /api/subscription/plans ───────────────────────────────────────────────
describe("GET /api/subscription/plans (public)", () => {
  it("يُرجع قائمة الخطط بدون token", async () => {
    const { status, body } = await api("GET", "/api/subscription/plans");
    const plans = body as Array<{
      id:         number;
      name:       string;
      priceDzd:   number;
      isActive:   number;
    }>;

    expect(status).toBe(200);
    expect(Array.isArray(plans)).toBe(true);
    expect(plans.length).toBeGreaterThan(0);

    // التحقق من وجود الخطط الأساسية
    const planNames = plans.map((p) => p.name);
    expect(planNames).toContain("free");
    expect(planNames).toContain("starter");
    expect(planNames).toContain("pro");
    expect(planNames).toContain("agency");

    // كل الخطط يجب أن تكون نشطة
    plans.forEach((p) => {
      expect(p.isActive).toBe(1);
      expect(p.priceDzd).toBeGreaterThanOrEqual(0);
    });
  });

  it("الخطط مرتبة تصاعدياً بالسعر", async () => {
    const { body } = await api("GET", "/api/subscription/plans");
    const plans = body as Array<{ priceDzd: number }>;

    for (let i = 1; i < plans.length; i++) {
      expect(plans[i]!.priceDzd).toBeGreaterThanOrEqual(plans[i - 1]!.priceDzd);
    }
  });
});

// ── PUT /api/subscription/manual-activate ────────────────────────────────────
describe("PUT /api/subscription/manual-activate", () => {
  it("يُرقّي الخطة إلى starter", async () => {
    const { status, body } = await api("PUT", "/api/subscription/manual-activate", {
      token: ctx.token,
      body:  { plan: "starter" },
    });
    const d = body as {
      message: string;
      plan:    string;
      status:  string;
      limits:  { maxConversations: number; maxProducts: number };
    };

    expect(status).toBe(200);
    expect(d.plan).toBe("starter");
    expect(d.status).toBe("active");
    expect(d.limits.maxConversations).toBe(300);
    expect(d.limits.maxProducts).toBe(50);
  });

  it("الخطة الجديدة تنعكس في GET /api/subscription", async () => {
    const { body } = await api("GET", "/api/subscription", {
      token: ctx.token,
    });
    const d = body as { plan: string; status: string; maxConversations: number };
    expect(d.plan).toBe("starter");
    expect(d.status).toBe("active");
    expect(d.maxConversations).toBe(300);
  });

  it("يُرقّي إلى pro مع حدود صحيحة", async () => {
    const { status, body } = await api("PUT", "/api/subscription/manual-activate", {
      token: ctx.token,
      body:  { plan: "pro" },
    });
    const d = body as { plan: string; limits: { maxConversations: number; maxProducts: number; maxBroadcasts: number } };

    expect(status).toBe(200);
    expect(d.plan).toBe("pro");
    expect(d.limits.maxConversations).toBe(1000);
    expect(d.limits.maxProducts).toBe(-1); // غير محدود
    expect(d.limits.maxBroadcasts).toBe(-1); // غير محدود
  });

  it("يرفض خطة غير موجودة بـ 400", async () => {
    const { status, body } = await api("PUT", "/api/subscription/manual-activate", {
      token: ctx.token,
      body:  { plan: "golden" },
    });
    const d = body as { message: string };
    expect(status).toBe(400);
    expect(d.message).toContain("الخطة غير صالحة");
  });

  it("يرفض بدون خطة في الـ body بـ 400", async () => {
    const { status } = await api("PUT", "/api/subscription/manual-activate", {
      token: ctx.token,
      body:  {},
    });
    expect(status).toBe(400);
  });

  it("يرفض بدون token بـ 401", async () => {
    const { status } = await api("PUT", "/api/subscription/manual-activate", {
      body: { plan: "starter" },
    });
    expect(status).toBe(401);
  });
});

// ── التحقق من حدود كل خطة ────────────────────────────────────────────────────
describe("حدود الخطط — PLAN_LIMITS consistency", () => {
  const expectedLimits: Record<string, {
    maxConversations: number;
    maxProducts:      number;
    maxProviders:     number;
    maxBroadcasts:    number;
  }> = {
    free:    { maxConversations: 30,   maxProducts: 10, maxProviders: 1, maxBroadcasts: 0  },
    trial:   { maxConversations: 100,  maxProducts: 10, maxProviders: 1, maxBroadcasts: 0  },
    starter: { maxConversations: 300,  maxProducts: 50, maxProviders: 3, maxBroadcasts: 500 },
    pro:     { maxConversations: 1000, maxProducts: -1, maxProviders: 6, maxBroadcasts: -1  },
    agency:  { maxConversations: -1,   maxProducts: -1, maxProviders: 6, maxBroadcasts: -1  },
  };

  for (const [plan, expected] of Object.entries(expectedLimits)) {
    it(`خطة ${plan}: حدود صحيحة`, async () => {
      const { body } = await api("PUT", "/api/subscription/manual-activate", {
        token: ctx.token,
        body:  { plan },
      });
      const d = body as {
        plan:   string;
        limits: typeof expected;
      };
      expect(d.plan).toBe(plan);
      expect(d.limits.maxConversations).toBe(expected.maxConversations);
      expect(d.limits.maxProducts).toBe(expected.maxProducts);
      expect(d.limits.maxProviders).toBe(expected.maxProviders);
      expect(d.limits.maxBroadcasts).toBe(expected.maxBroadcasts);
    });
  }
});
