/**
 * 01_auth.test.ts — اختبارات المصادقة وتسجيل المستأجرين
 *
 * يختبر:
 * - POST /api/auth/register  (التسجيل + إنشاء المستأجر)
 * - POST /api/auth/login     (تسجيل الدخول)
 * - GET  /api/auth/me        (بيانات المستخدم الحالي)
 * - PUT  /api/auth/change-password (تغيير كلمة المرور)
 * - حالات الخطأ (بيانات ناقصة، بريد مكرر، كلمة سر خاطئة)
 */

import { describe, it, expect, beforeAll } from "vitest";
import { api, uniqueSlug, uniqueEmail, type TestCtx } from "./helpers.js";

let ctx: TestCtx;
const slug  = uniqueSlug("auth");
const email = uniqueEmail("auth");

// ── suite 1: التسجيل ──────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  it("ينشئ مستأجراً جديداً ويُرجع token", async () => {
    const { status, body } = await api("POST", "/api/auth/register", {
      body: {
        name:       "Auth Test Business",
        ownerEmail: email,
        password:   "SecurePass1!",
        phone:      "0551112233",
        slug,
      },
    });

    const d = body as {
      token:  string;
      user:   { id: number; tenantId: number; role: string; username: string };
      tenant: { id: number; name: string; slug: string; plan: string; status: string; trialEndsAt: string };
    };

    expect(status).toBe(201);
    expect(d.token).toBeTruthy();
    expect(d.token.split(".").length).toBe(3); // JWT format
    expect(d.user.role).toBe("owner");
    expect(d.user.username).toBe(slug);
    expect(d.tenant.slug).toBe(slug);
    expect(d.tenant.plan).toBe("trial");
    expect(d.tenant.status).toBe("trial");
    expect(new Date(d.tenant.trialEndsAt).getTime()).toBeGreaterThan(Date.now());

    ctx = {
      token:    d.token,
      tenantId: d.user.tenantId,
      userId:   d.user.id,
      slug:     d.tenant.slug,
      email,
      plan:     d.tenant.plan,
      status:   d.tenant.status,
    };
  });

  it("يرفض بريد إلكتروني مكرر", async () => {
    const { status, body } = await api("POST", "/api/auth/register", {
      body: {
        name:       "Duplicate Business",
        ownerEmail: email,
        password:   "SecurePass1!",
        phone:      "0559988776",
        slug:       uniqueSlug("dup"),
      },
    });
    const d = body as { message: string };
    expect(status).toBe(409);
    expect(d.message).toBeTruthy();
  });

  it("يرفض slug مكرر", async () => {
    const { status, body } = await api("POST", "/api/auth/register", {
      body: {
        name:       "Another Business",
        ownerEmail: uniqueEmail("slug-dup"),
        password:   "SecurePass1!",
        phone:      "0559988774",
        slug,
      },
    });
    const d = body as { message: string };
    expect(status).toBe(409);
    expect(d.message).toBeTruthy();
  });

  it("يرفض كلمة سر ضعيفة (أقل من 8 محارف)", async () => {
    const { status, body } = await api("POST", "/api/auth/register", {
      body: {
        name:       "Weak Pass Business",
        ownerEmail: uniqueEmail("weak"),
        password:   "123",
        phone:      "0551234567",
        slug:       uniqueSlug("weak"),
      },
    });
    const d = body as { message: string };
    expect(status).toBe(400);
    expect(d.message).toBeTruthy();
  });

  it("يرفض اسم تجاري قصير جداً (أقل من 2 محارف)", async () => {
    const { status } = await api("POST", "/api/auth/register", {
      body: {
        name:       "X",
        ownerEmail: uniqueEmail("short"),
        password:   "SecurePass1!",
        phone:      "0551234567",
        slug:       uniqueSlug("short"),
      },
    });
    expect(status).toBe(400);
  });

  it("يرجع 400 عند غياب الحقول الإلزامية", async () => {
    const { status } = await api("POST", "/api/auth/register", {
      body: { name: "Missing Fields" },
    });
    expect(status).toBe(400);
  });
});

// ── suite 2: تسجيل الدخول ────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
  it("يُسجّل الدخول بالبيانات الصحيحة", async () => {
    const { status, body } = await api("POST", "/api/auth/login", {
      body: { username: slug, password: "SecurePass1!" },
    });
    const d = body as { token: string; user: { tenantId: number } };

    expect(status).toBe(200);
    expect(d.token).toBeTruthy();
    expect(d.user.tenantId).toBe(ctx.tenantId);
  });

  it("يرفض كلمة السر الخاطئة بـ 401", async () => {
    const { status } = await api("POST", "/api/auth/login", {
      body: { username: slug, password: "WrongPass999!" },
    });
    expect(status).toBe(401);
  });

  it("يرفض مستخدم غير موجود بـ 401", async () => {
    const { status } = await api("POST", "/api/auth/login", {
      body: { username: "nonexistent-user-xyz", password: "AnyPass1!" },
    });
    expect(status).toBe(401);
  });
});

// ── suite 3: بيانات المستخدم الحالي ──────────────────────────────────────────
describe("GET /api/auth/me", () => {
  it("يُرجع بيانات المستخدم بـ token صحيح", async () => {
    const { status, body } = await api("GET", "/api/auth/me", {
      token: ctx.token,
    });
    const d = body as { id: number; tenantId: number; role: string };

    expect(status).toBe(200);
    expect(d.id).toBe(ctx.userId);
    expect(d.tenantId).toBe(ctx.tenantId);
    expect(d.role).toBe("owner");
  });

  it("يرفض بدون token بـ 401", async () => {
    const { status } = await api("GET", "/api/auth/me");
    expect(status).toBe(401);
  });

  it("يرفض token مزيف بـ 401", async () => {
    const { status } = await api("GET", "/api/auth/me", {
      token: "fake.token.here",
    });
    expect(status).toBe(401);
  });
});

// ── suite 4: تغيير كلمة المرور ───────────────────────────────────────────────
describe("PUT /api/auth/change-password", () => {
  it("يغيّر كلمة المرور بالبيانات الصحيحة", async () => {
    const { status } = await api("PUT", "/api/auth/change-password", {
      token: ctx.token,
      body: {
        currentPassword: "SecurePass1!",
        newPassword:     "NewSecurePass2!",
      },
    });
    expect(status).toBe(200);
  });

  it("يمكن الدخول بكلمة المرور الجديدة", async () => {
    const { status, body } = await api("POST", "/api/auth/login", {
      body: { username: slug, password: "NewSecurePass2!" },
    });
    const d = body as { token: string };
    expect(status).toBe(200);
    expect(d.token).toBeTruthy();
    // تحديث الـ token للاستخدام في الاختبارات اللاحقة
    ctx.token = d.token;
  });

  it("يرفض كلمة المرور القديمة بعد التغيير بـ 401", async () => {
    const { status } = await api("POST", "/api/auth/login", {
      body: { username: slug, password: "SecurePass1!" },
    });
    expect(status).toBe(401);
  });

  it("يرفض تغيير كلمة المرور بكلمة سر حالية خاطئة", async () => {
    const { status } = await api("PUT", "/api/auth/change-password", {
      token: ctx.token,
      body: {
        currentPassword: "WrongCurrentPass!",
        newPassword:     "AnotherNewPass1!",
      },
    });
    expect(status).toBe(401);
  });

  it("يرفض كلمة مرور جديدة ضعيفة", async () => {
    const { status } = await api("PUT", "/api/auth/change-password", {
      token: ctx.token,
      body: {
        currentPassword: "NewSecurePass2!",
        newPassword:     "123",
      },
    });
    expect(status).toBe(400);
  });
});

// تصدير السياق للاختبارات الأخرى
export { ctx as authCtx };
