/**
 * helpers.ts — أدوات مشتركة لجميع الاختبارات
 *
 * - API_URL: عنوان الخادم (localhost:8080)
 * - api(): دالة مساعدة لإرسال طلبات HTTP
 * - uniqueSuffix(): لاحقة فريدة لتجنب التعارض
 * - getSharedCtx(): يُرجع سياق المستأجر المشترك (مُنشأ في globalSetup)
 * - registerTestTenant(): ينشئ مستأجراً جديداً (للاختبارات التي تحتاج عزلاً)
 */

import fs from "fs";

export const API_URL = "http://localhost:8080";

// لاحقة فريدة لكل run
export const RUN_ID = Date.now().toString(36);

export function uniqueSlug(base: string): string {
  return `${base}-${RUN_ID}`;
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}_${RUN_ID}@test.local`;
}

// ── نوع سياق الاختبار ─────────────────────────────────────────────────────────
export interface TestCtx {
  token:     string;
  tenantId:  number;
  userId:    number;
  slug:      string;
  email:     string;
  plan:      string;
  status:    string;
}

// ── قراءة السياق المشترك من ملف globalSetup ──────────────────────────────────
const SHARED_CTX_FILE = "/tmp/test-shared-ctx.json";

export function getSharedCtx(): TestCtx {
  try {
    const raw = fs.readFileSync(SHARED_CTX_FILE, "utf-8");
    return JSON.parse(raw) as TestCtx;
  } catch {
    throw new Error(
      "[helpers] لم يُعثَر على ملف السياق المشترك. هل نسيت globalSetup؟ " +
      SHARED_CTX_FILE
    );
  }
}

// ── دالة API المساعدة ─────────────────────────────────────────────────────────
export async function api(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path:   string,
  opts?: {
    token?:   string;
    body?:    unknown;
    headers?: Record<string, string>;
  }
): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts?.headers ?? {}),
  };

  if (opts?.token) {
    headers["Authorization"] = `Bearer ${opts.token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = await res.text().catch(() => null);
  }

  return { status: res.status, body };
}

// ── تسجيل مستأجر اختباري جديد (للعزل فقط) ───────────────────────────────────
let _regCounter = 0;
export async function registerTestTenant(label?: string): Promise<TestCtx> {
  _regCounter++;
  const tag   = `${RUN_ID}-${label ?? _regCounter}`;
  const slug  = `tt-${tag}`;
  const email = `tt_${tag}@test.local`;

  const { status, body } = await api("POST", "/api/auth/register", {
    body: {
      name:       `Test ${label ?? _regCounter} ${tag}`,
      ownerEmail: email,
      password:   "TestPass1!",
      phone:      "0551234567",
      slug,
    },
  });

  if (status !== 201 && status !== 200) {
    throw new Error(`registerTestTenant(${label}) failed [${status}]: ${JSON.stringify(body)}`);
  }

  const d = body as {
    token:  string;
    user:   { id: number; tenantId: number };
    tenant: { plan: string; status: string };
  };

  return {
    token:    d.token,
    tenantId: d.user.tenantId,
    userId:   d.user.id,
    slug,
    email,
    plan:     d.tenant.plan,
    status:   d.tenant.status,
  };
}
