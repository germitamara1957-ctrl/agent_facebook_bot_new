/**
 * 02_tenant.test.ts — اختبارات إدارة بيانات المستأجر
 *
 * يختبر:
 * - GET /api/tenant  (قراءة بيانات المستأجر الحالي)
 * - PUT /api/tenant  (تعديل البيانات المسموح بها)
 * - عزل المستأجرين (لا يرى مستأجر بيانات مستأجر آخر)
 */

import { describe, it, expect, beforeAll } from "vitest";
import { api, registerTestTenant, type TestCtx } from "./helpers.js";

let ctxA: TestCtx;
let ctxB: TestCtx;

beforeAll(async () => {
  [ctxA, ctxB] = await Promise.all([
    registerTestTenant("tenant-a"),
    registerTestTenant("tenant-b"),
  ]);
});

// ── GET /api/tenant ───────────────────────────────────────────────────────────
describe("GET /api/tenant", () => {
  it("يُرجع بيانات المستأجر الحالي", async () => {
    const { status, body } = await api("GET", "/api/tenant", {
      token: ctxA.token,
    });
    const d = body as {
      id:       number;
      name:     string;
      slug:     string;
      plan:     string;
      status:   string;
    };

    expect(status).toBe(200);
    expect(d.id).toBe(ctxA.tenantId);
    expect(d.slug).toBe(ctxA.slug);
    expect(d.plan).toBe("trial");
    expect(d.status).toBe("trial");
  });

  it("يُرجع بيانات مستأجر B مستقلة عن مستأجر A", async () => {
    const [resA, resB] = await Promise.all([
      api("GET", "/api/tenant", { token: ctxA.token }),
      api("GET", "/api/tenant", { token: ctxB.token }),
    ]);

    const dA = resA.body as { id: number };
    const dB = resB.body as { id: number };

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);
    expect(dA.id).not.toBe(dB.id);
  });

  it("يرفض بدون token بـ 401", async () => {
    const { status } = await api("GET", "/api/tenant");
    expect(status).toBe(401);
  });
});

// ── PUT /api/tenant ───────────────────────────────────────────────────────────
describe("PUT /api/tenant", () => {
  it("يعدّل اسم المستأجر بنجاح", async () => {
    const newName = "Updated Business Name";
    const { status, body } = await api("PUT", "/api/tenant", {
      token: ctxA.token,
      body:  { name: newName },
    });
    const d = body as { name: string };

    expect(status).toBe(200);
    expect(d.name).toBe(newName);
  });

  it("التعديل ينعكس فعلياً عند القراءة", async () => {
    const { body } = await api("GET", "/api/tenant", { token: ctxA.token });
    const d = body as { name: string };
    expect(d.name).toBe("Updated Business Name");
  });

  it("يرفض اسماً قصيراً جداً (أقل من 2 محارف)", async () => {
    const { status } = await api("PUT", "/api/tenant", {
      token: ctxA.token,
      body:  { name: "X" },
    });
    expect(status).toBe(400);
  });

  it("يرفض تعديل slug (slug غير قابل للتغيير)", async () => {
    const { body } = await api("PUT", "/api/tenant", {
      token: ctxA.token,
      body:  { name: "New Name", slug: "new-slug-attempt" },
    });
    // الـ slug يجب أن يبقى بدون تغيير
    const d = body as { slug: string };
    expect(d.slug).toBe(ctxA.slug);
  });

  it("يرفض بدون token بـ 401", async () => {
    const { status } = await api("PUT", "/api/tenant", {
      body: { name: "No Auth" },
    });
    expect(status).toBe(401);
  });
});
