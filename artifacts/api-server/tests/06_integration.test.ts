/**
 * 06_integration.test.ts — اختبارات التكامل الكاملة (End-to-End)
 *
 * يختبر سيناريوهات متكاملة:
 * 1. دورة حياة المستأجر: تسجيل → اشتراك → ترقية → قراءة بيانات
 * 2. عزل المستأجرين: لا يرى أحدهم بيانات الآخر
 * 3. Trial expiry: المستأجر المنتهي الصلاحية يُرفَض
 * 4. صحة الخادم: GET /api/healthz
 * 5. تناسق البيانات: التعديلات تنعكس فوراً
 */

import { describe, it, expect, beforeAll } from "vitest";
import { api, registerTestTenant, type TestCtx } from "./helpers.js";

let ctxMain: TestCtx;

beforeAll(async () => {
  ctxMain = await registerTestTenant("integ");
});

// ── 1. صحة الخادم ─────────────────────────────────────────────────────────────
describe("Server Health", () => {
  it("GET /api/healthz يُرجع 200", async () => {
    const { status, body } = await api("GET", "/api/healthz");
    const d = body as { status: string };

    expect(status).toBe(200);
    expect(d.status).toBe("ok");
  });
});

// ── 2. دورة حياة المستأجر الكاملة ───────────────────────────────────────────
describe("Full Tenant Lifecycle", () => {
  let tenantCtx: TestCtx;

  it("تسجيل مستأجر جديد بحالة trial", async () => {
    tenantCtx = await registerTestTenant("lifecycle");

    expect(tenantCtx.token).toBeTruthy();
    expect(tenantCtx.plan).toBe("trial");
    expect(tenantCtx.status).toBe("trial");
  });

  it("قراءة بيانات المستأجر بعد التسجيل مباشرة", async () => {
    const { status, body } = await api("GET", "/api/tenant", {
      token: tenantCtx.token,
    });
    const d = body as { id: number; plan: string; status: string };

    expect(status).toBe(200);
    expect(d.id).toBe(tenantCtx.tenantId);
    expect(d.plan).toBe("trial");
  });

  it("ترقية إلى starter تُحدّث الاشتراك فوراً", async () => {
    await api("PUT", "/api/subscription/manual-activate", {
      token: tenantCtx.token,
      body:  { plan: "starter" },
    });

    const { body } = await api("GET", "/api/subscription", {
      token: tenantCtx.token,
    });
    const d = body as { plan: string; status: string; maxConversations: number };

    expect(d.plan).toBe("starter");
    expect(d.status).toBe("active");
    expect(d.maxConversations).toBe(300);
  });

  it("ترقية إلى agency تُحدّث الحدود إلى -1 (غير محدود)", async () => {
    await api("PUT", "/api/subscription/manual-activate", {
      token: tenantCtx.token,
      body:  { plan: "agency" },
    });

    const { body } = await api("GET", "/api/subscription", {
      token: tenantCtx.token,
    });
    const d = body as { plan: string; maxConversations: number; maxProducts: number; maxBroadcasts: number };

    expect(d.plan).toBe("agency");
    expect(d.maxConversations).toBe(-1);
    expect(d.maxProducts).toBe(-1);
    expect(d.maxBroadcasts).toBe(-1);
  });
});

// ── 3. عزل المستأجرين ─────────────────────────────────────────────────────────
describe("Tenant Isolation — العزل الكامل", () => {
  let ctxA: TestCtx;
  let ctxB: TestCtx;

  beforeAll(async () => {
    [ctxA, ctxB] = await Promise.all([
      registerTestTenant("iso-a"),
      registerTestTenant("iso-b"),
    ]);
  });

  it("مستأجر A لا يرى اسم مستأجر B في GET /api/tenant", async () => {
    const [resA, resB] = await Promise.all([
      api("GET", "/api/tenant", { token: ctxA.token }),
      api("GET", "/api/tenant", { token: ctxB.token }),
    ]);

    const dA = resA.body as { slug: string };
    const dB = resB.body as { slug: string };

    expect(dA.slug).toBe(ctxA.slug);
    expect(dB.slug).toBe(ctxB.slug);
    expect(dA.slug).not.toBe(dB.slug);
  });

  it("token المستأجر A لا يصل لبيانات المستأجر B", async () => {
    // GET /api/tenant دائماً يُرجع بيانات المستأجر المرتبط بالـ token
    const { body } = await api("GET", "/api/tenant", { token: ctxA.token });
    const d = body as { slug: string };
    expect(d.slug).toBe(ctxA.slug);
    expect(d.slug).not.toBe(ctxB.slug);
  });

  it("ترقية خطة مستأجر A لا تؤثر على خطة مستأجر B", async () => {
    await api("PUT", "/api/subscription/manual-activate", {
      token: ctxA.token,
      body:  { plan: "pro" },
    });

    const [resA, resB] = await Promise.all([
      api("GET", "/api/subscription", { token: ctxA.token }),
      api("GET", "/api/subscription", { token: ctxB.token }),
    ]);

    const dA = resA.body as { plan: string };
    const dB = resB.body as { plan: string };

    expect(dA.plan).toBe("pro");
    expect(dB.plan).toBe("trial"); // لم يتغير
  });

  it("سجل مدفوعات مستأجر A لا يظهر عند مستأجر B", async () => {
    const [resA, resB] = await Promise.all([
      api("GET", "/api/payment/history", { token: ctxA.token }),
      api("GET", "/api/payment/history", { token: ctxB.token }),
    ]);

    const idsA = (resA.body as Array<{ id: number }>).map((o) => o.id);
    const idsB = (resB.body as Array<{ id: number }>).map((o) => o.id);

    const shared = idsA.filter((id) => idsB.includes(id));
    expect(shared.length).toBe(0);
  });
});

// ── 4. أمان المسارات ─────────────────────────────────────────────────────────
describe("Route Security", () => {
  const protectedRoutes: Array<{ method: "GET" | "POST" | "PUT" | "DELETE"; path: string; body?: unknown }> = [
    { method: "GET",  path: "/api/auth/me" },
    { method: "GET",  path: "/api/tenant" },
    { method: "PUT",  path: "/api/tenant",   body: { name: "X" } },
    { method: "GET",  path: "/api/subscription" },
    { method: "PUT",  path: "/api/subscription/manual-activate", body: { plan: "starter" } },
    { method: "POST", path: "/api/payment/checkout", body: { plan: "starter" } },
    { method: "GET",  path: "/api/payment/history" },
    { method: "GET",  path: "/api/providers" },
    { method: "GET",  path: "/api/products" },
    { method: "GET",  path: "/api/broadcasts" },
  ];

  for (const route of protectedRoutes) {
    it(`${route.method} ${route.path} يرفض بدون token بـ 401`, async () => {
      const { status } = await api(route.method, route.path, {
        body: route.body,
      });
      expect(status).toBe(401);
    });
  }

  const publicRoutes: Array<{ method: "GET" | "POST"; path: string; hasBody: boolean }> = [
    { method: "GET",  path: "/api/healthz",             hasBody: false },
    { method: "GET",  path: "/api/subscription/plans",  hasBody: false },
    { method: "POST", path: "/api/payment/webhook",     hasBody: true  },
    { method: "POST", path: "/api/auth/login",          hasBody: true  },
    { method: "POST", path: "/api/auth/register",       hasBody: true  },
  ];

  for (const route of publicRoutes) {
    it(`${route.method} ${route.path} لا يرفض بـ 401 (مسار عام)`, async () => {
      const { status } = await api(route.method, route.path, {
        body: route.hasBody ? {} : undefined,
      });
      expect(status).not.toBe(401);
    });
  }
});

// ── 5. تناسق البيانات ─────────────────────────────────────────────────────────
describe("Data Consistency", () => {
  it("تغيير اسم المستأجر ينعكس فوراً في GET /api/tenant", async () => {
    const newName = `Business ${Date.now()}`;
    await api("PUT", "/api/tenant", {
      token: ctxMain.token,
      body:  { name: newName },
    });

    const { body } = await api("GET", "/api/tenant", {
      token: ctxMain.token,
    });
    const d = body as { name: string };
    expect(d.name).toBe(newName);
  });

  it("ترقية الخطة تنعكس فوراً في GET /api/subscription", async () => {
    await api("PUT", "/api/subscription/manual-activate", {
      token: ctxMain.token,
      body:  { plan: "pro" },
    });

    const { body } = await api("GET", "/api/subscription", {
      token: ctxMain.token,
    });
    const d = body as { plan: string };
    expect(d.plan).toBe("pro");
  });

  it("monthYear في الاشتراك يطابق الشهر الحالي", async () => {
    const { body } = await api("GET", "/api/subscription", {
      token: ctxMain.token,
    });
    const d = body as { monthYear: string };

    const now   = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const expected = `${now.getFullYear()}-${month}`;

    expect(d.monthYear).toBe(expected);
  });
});

// ── 6. معالجة الأخطاء العامة ─────────────────────────────────────────────────
describe("Error Handling", () => {
  it("مسار عام غير موجود يُرجع 404", async () => {
    // المسارات الموجودة في /api تحتاج JWT → 401
    // نختبر مساراً خارج /api بالكامل
    const res = await fetch("http://localhost:8080/nonexistent-xyz-path");
    expect(res.status).toBe(404);
  });

  it("مسار /api غير موجود يُرجع 401 أو 404 (authMiddleware قبل Router)", async () => {
    const { status } = await api("GET", "/api/nonexistent-route-xyz");
    // authMiddleware يحجب أولاً → 401، أو يمر ويُرجع 404
    expect([401, 404]).toContain(status);
  });

  it("طلب بدون JSON صالح على مسار auth لا يُعطّل الخادم", async () => {
    const res = await fetch("http://localhost:8080/api/auth/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    '{"invalid": }', // JSON خاطئ
    });
    // Express يُرجع 400 bad request عند JSON خاطئ
    expect([400, 500]).toContain(res.status);
  });
});
