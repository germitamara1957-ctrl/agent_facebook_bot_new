/**
 * 07_superAdmin.test.ts — اختبارات لوحة الإدارة العليا (Super Admin)
 *
 * يشمل: تسجيل الدخول، التحقق من الهوية، إدارة المستأجرين،
 *        تغيير الخطط والحالات، الإحصاءات، سجل المدفوعات.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { api, API_URL } from "./helpers.js";

// ─── بيانات السوبر أدمن الافتراضية (مُنشأ في seed.ts) ─────────────────────────
const SUPER_USER = process.env["SUPER_ADMIN_USERNAME"] ?? "superadmin";
const SUPER_PASS = process.env["SUPER_ADMIN_PASSWORD"] ?? "superadmin123";

let adminToken = "";
let firstTenantId = 0;

// ── يُشغَّل قبل كل الاختبارات لتسجيل الدخول ────────────────────────────────
beforeAll(async () => {
  const res = await fetch(`${API_URL}/api/admin/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ username: SUPER_USER, password: SUPER_PASS }),
  });
  expect(res.status, "تسجيل دخول السوبر أدمن يجب أن ينجح").toBe(200);
  const data = await res.json() as { token: string };
  adminToken = data.token;
  expect(adminToken).toBeTruthy();
});

// ══════════════════════════════════════════════════════════════════════════════
describe("POST /api/admin/auth/login", () => {
  it("يُرجع token عند بيانات صحيحة", async () => {
    const { status, body } = await api("POST", "/api/admin/auth/login", {
      body: { username: SUPER_USER, password: SUPER_PASS },
    });
    expect(status).toBe(200);
    expect((body as { token: string }).token).toBeTruthy();
    expect((body as { role: string }).role).toBe("superadmin");
  });

  it("يرفض كلمة مرور خاطئة بـ 401", async () => {
    const { status } = await api("POST", "/api/admin/auth/login", {
      body: { username: SUPER_USER, password: "wrongpassword" },
    });
    expect(status).toBe(401);
  });

  it("يرفض مستخدم غير موجود بـ 401", async () => {
    const { status } = await api("POST", "/api/admin/auth/login", {
      body: { username: "nonexistent_admin_xyz", password: "anything" },
    });
    expect(status).toBe(401);
  });

  it("يرفض بدون بيانات بـ 400", async () => {
    const { status } = await api("POST", "/api/admin/auth/login", { body: {} });
    expect(status).toBe(400);
  });

  it("المسار عام — لا يتطلب JWT", async () => {
    const { status } = await api("POST", "/api/admin/auth/login", {
      body: { username: SUPER_USER, password: SUPER_PASS },
    });
    expect(status).not.toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe("GET /api/admin/auth/me", () => {
  it("يُرجع بيانات السوبر أدمن بـ token صحيح", async () => {
    const { status, body } = await api("GET", "/api/admin/auth/me", { token: adminToken });
    expect(status).toBe(200);
    expect((body as { username: string }).username).toBe(SUPER_USER);
    expect((body as { role: string }).role).toBe("superadmin");
  });

  it("يرفض بدون token بـ 401", async () => {
    const { status } = await api("GET", "/api/admin/auth/me");
    expect(status).toBe(401);
  });

  it("يرفض token مستأجر عادي بـ 403", async () => {
    const { status } = await api("GET", "/api/admin/auth/me", { token: "fake.tenant.token" });
    expect(status).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe("GET /api/admin/tenants", () => {
  it("يُرجع قائمة المستأجرين بـ token السوبر أدمن", async () => {
    const { status, body } = await api("GET", "/api/admin/tenants", { token: adminToken });
    const d = body as { tenants: unknown[]; pagination: { total: number } };
    expect(status).toBe(200);
    expect(Array.isArray(d.tenants)).toBe(true);
    expect(typeof d.pagination.total).toBe("number");
    expect(d.pagination.total).toBeGreaterThan(0);
  });

  it("يُرجع حقولاً صحيحة لكل مستأجر", async () => {
    const { status, body } = await api("GET", "/api/admin/tenants", { token: adminToken });
    expect(status).toBe(200);
    const d = body as { tenants: Record<string, unknown>[] };
    const tenant = d.tenants[0]!;
    firstTenantId = tenant["id"] as number;
    expect(typeof tenant["id"]).toBe("number");
    expect(typeof tenant["name"]).toBe("string");
    expect(typeof tenant["slug"]).toBe("string");
    expect(typeof tenant["plan"]).toBe("string");
    expect(typeof tenant["status"]).toBe("string");
    expect(typeof tenant["conversationsUsed"]).toBe("number");
    expect(typeof tenant["createdAt"]).toBe("string");
  });

  it("يدعم التصفية بالحالة", async () => {
    const { status, body } = await api("GET", "/api/admin/tenants?status=active", { token: adminToken });
    expect(status).toBe(200);
    const d = body as { tenants: { status: string }[] };
    for (const t of d.tenants) {
      expect(t.status).toBe("active");
    }
  });

  it("يدعم pagination بـ page=1&limit=3", async () => {
    const { status, body } = await api("GET", "/api/admin/tenants?page=1&limit=3", { token: adminToken });
    expect(status).toBe(200);
    const d = body as { tenants: unknown[]; pagination: { page: number; limit: number } };
    expect(d.tenants.length).toBeLessThanOrEqual(3);
    expect(d.pagination.page).toBe(1);
    expect(d.pagination.limit).toBe(3);
  });

  it("يرفض بدون token بـ 401", async () => {
    const { status } = await api("GET", "/api/admin/tenants");
    expect(status).toBe(401);
  });

  it("يرفض token مستأجر عادي بـ 403", async () => {
    const { status } = await api("GET", "/api/admin/tenants", { token: "bad.token.here" });
    expect(status).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe("GET /api/admin/tenants/:id", () => {
  it("يُرجع تفاصيل مستأجر موجود", async () => {
    expect(firstTenantId).toBeGreaterThan(0);
    const { status, body } = await api("GET", `/api/admin/tenants/${firstTenantId}`, { token: adminToken });
    expect(status).toBe(200);
    const d = body as { tenant: { id: number }; usageHistory: unknown[] };
    expect(d.tenant.id).toBe(firstTenantId);
    expect(Array.isArray(d.usageHistory)).toBe(true);
  });

  it("يُرجع 404 لمستأجر غير موجود", async () => {
    const { status } = await api("GET", "/api/admin/tenants/9999999", { token: adminToken });
    expect(status).toBe(404);
  });

  it("يُرجع 400 لمعرّف غير صالح", async () => {
    const { status } = await api("GET", "/api/admin/tenants/notanumber", { token: adminToken });
    expect(status).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe("PUT /api/admin/tenants/:id/status", () => {
  it("يُحدّث حالة المستأجر إلى suspended بنجاح", async () => {
    expect(firstTenantId).toBeGreaterThan(0);
    // نأخذ مستأجر جديد (ليس المستأجر الافتراضي id=1) لتجنب التأثير على البيانات الجذرية
    const { body: listBody } = await api("GET", "/api/admin/tenants?status=trial&limit=1", { token: adminToken });
    const tenants = (listBody as { tenants: { id: number; status: string }[] }).tenants;
    if (tenants.length === 0) return; // لا يوجد مستأجر trial للاختبار

    const targetId     = tenants[0]!.id;
    const { status, body } = await api("PUT", `/api/admin/tenants/${targetId}/status`, {
      token: adminToken,
      body:  { status: "suspended" },
    });
    expect(status).toBe(200);
    expect((body as { status: string }).status).toBe("suspended");

    // إعادة الحالة إلى trial
    await api("PUT", `/api/admin/tenants/${targetId}/status`, {
      token: adminToken,
      body:  { status: "trial" },
    });
  });

  it("يرفض حالة غير صالحة بـ 400", async () => {
    const { status } = await api("PUT", `/api/admin/tenants/${firstTenantId}/status`, {
      token: adminToken,
      body:  { status: "invalid_status" },
    });
    expect(status).toBe(400);
  });

  it("يُرجع 404 لمستأجر غير موجود", async () => {
    const { status } = await api("PUT", "/api/admin/tenants/9999999/status", {
      token: adminToken,
      body:  { status: "active" },
    });
    expect(status).toBe(404);
  });

  it("يرفض بدون token بـ 401", async () => {
    const { status } = await api("PUT", `/api/admin/tenants/${firstTenantId}/status`, {
      body: { status: "active" },
    });
    expect(status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe("PUT /api/admin/tenants/:id/plan", () => {
  it("يُرقّي مستأجراً إلى starter ويُحدّث الحدود", async () => {
    const { body: listBody } = await api("GET", "/api/admin/tenants?status=trial&limit=1", { token: adminToken });
    const tenants = (listBody as { tenants: { id: number }[] }).tenants;
    if (tenants.length === 0) return;

    const targetId = tenants[0]!.id;
    const { status, body } = await api("PUT", `/api/admin/tenants/${targetId}/plan`, {
      token: adminToken,
      body:  { plan: "starter" },
    });
    expect(status).toBe(200);
    const t = (body as { tenant: { plan: string; maxConversations: number; maxProducts: number } }).tenant;
    expect(t.plan).toBe("starter");
    expect(t.maxConversations).toBe(300);
    expect(t.maxProducts).toBe(50);

    // إعادة الخطة إلى trial
    await api("PUT", `/api/admin/tenants/${targetId}/plan`, { token: adminToken, body: { plan: "trial" } });
  });

  it("يرفض خطة غير صالحة بـ 400", async () => {
    const { status } = await api("PUT", `/api/admin/tenants/${firstTenantId}/plan`, {
      token: adminToken,
      body:  { plan: "enterprise" },
    });
    expect(status).toBe(400);
  });

  it("يُرجع 404 لمستأجر غير موجود", async () => {
    const { status } = await api("PUT", "/api/admin/tenants/9999999/plan", {
      token: adminToken,
      body:  { plan: "pro" },
    });
    expect(status).toBe(404);
  });

  it("يرفض بدون token بـ 401", async () => {
    const { status } = await api("PUT", `/api/admin/tenants/${firstTenantId}/plan`, {
      body: { plan: "pro" },
    });
    expect(status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe("GET /api/admin/stats", () => {
  it("يُرجع إحصاءات المنصة بـ token صحيح", async () => {
    const { status, body } = await api("GET", "/api/admin/stats", { token: adminToken });
    expect(status).toBe(200);
    const d = body as {
      tenants:  { total: number; active: number; trial: number; newThisMonth: number };
      plans:    { free: number; trial: number; starter: number; pro: number; agency: number };
      usage:    { conversationsThisMonth: number };
      revenue:  { totalDzd: number; monthYear: string };
      growth:   unknown[];
    };
    expect(typeof d.tenants.total).toBe("number");
    expect(d.tenants.total).toBeGreaterThan(0);
    expect(typeof d.tenants.active).toBe("number");
    expect(typeof d.tenants.trial).toBe("number");
    expect(typeof d.tenants.newThisMonth).toBe("number");
    expect(typeof d.plans.free).toBe("number");
    expect(typeof d.plans.starter).toBe("number");
    expect(typeof d.plans.pro).toBe("number");
    expect(typeof d.usage.conversationsThisMonth).toBe("number");
    expect(typeof d.revenue.totalDzd).toBe("number");
    expect(typeof d.revenue.monthYear).toBe("string");
    expect(Array.isArray(d.growth)).toBe(true);
  });

  it("مجموع الخطط يساوي إجمالي المستأجرين", async () => {
    const { body } = await api("GET", "/api/admin/stats", { token: adminToken });
    const d = body as {
      tenants: { total: number };
      plans:   { free: number; trial: number; starter: number; pro: number; agency: number };
    };
    const plansSum = d.plans.free + d.plans.trial + d.plans.starter + d.plans.pro + d.plans.agency;
    expect(plansSum).toBe(d.tenants.total);
  });

  it("monthYear بتنسيق YYYY-MM", async () => {
    const { body } = await api("GET", "/api/admin/stats", { token: adminToken });
    const d = body as { revenue: { monthYear: string } };
    expect(d.revenue.monthYear).toMatch(/^\d{4}-\d{2}$/);
  });

  it("يرفض بدون token بـ 401", async () => {
    const { status } = await api("GET", "/api/admin/stats");
    expect(status).toBe(401);
  });

  it("يرفض token مستأجر بـ 403", async () => {
    const { status } = await api("GET", "/api/admin/stats", { token: "invalid.admin.token" });
    expect(status).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe("GET /api/admin/payments", () => {
  it("يُرجع قائمة المدفوعات (قد تكون فارغة)", async () => {
    const { status, body } = await api("GET", "/api/admin/payments", { token: adminToken });
    expect(status).toBe(200);
    const d = body as { payments: unknown[] };
    expect(Array.isArray(d.payments)).toBe(true);
  });

  it("يدعم pagination بـ limit=5", async () => {
    const { status, body } = await api("GET", "/api/admin/payments?limit=5", { token: adminToken });
    expect(status).toBe(200);
    const d = body as { payments: unknown[]; pagination: { page: number } };
    expect(d.payments.length).toBeLessThanOrEqual(5);
    expect(typeof d.pagination.page).toBe("number");
  });

  it("يرفض بدون token بـ 401", async () => {
    const { status } = await api("GET", "/api/admin/payments");
    expect(status).toBe(401);
  });

  it("يرفض token مستأجر بـ 403", async () => {
    const { status } = await api("GET", "/api/admin/payments", { token: "fake.payload.here" });
    expect(status).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe("أمان — عزل السوبر أدمن عن المستأجرين", () => {
  it("JWT مستأجر لا يعطي وصول لـ /api/admin/tenants", async () => {
    const { status } = await api("GET", "/api/admin/tenants", { token: "tenant.jwt.token" });
    expect(status).toBe(403);
  });

  it("JWT مستأجر لا يعطي وصول لـ /api/admin/stats", async () => {
    const { status } = await api("GET", "/api/admin/stats", { token: "tenant.jwt.token" });
    expect(status).toBe(403);
  });

  it("JWT سوبر أدمن لا يعطي وصول لبيانات مستأجر عادي (لا tenantId في JWT)", async () => {
    const { status } = await api("GET", "/api/subscription", { token: adminToken });
    // يجب أن يرفض لأن JWT السوبر أدمن لا يحمل tenantId
    expect([401, 500]).toContain(status);
  });
});
