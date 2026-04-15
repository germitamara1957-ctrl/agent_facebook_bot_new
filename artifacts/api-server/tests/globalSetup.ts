/**
 * globalSetup.ts — يُشغَّل مرة واحدة قبل جميع الاختبارات
 *
 * ينشئ مستأجراً مشتركاً واحداً ويكتب بياناته إلى /tmp/test-shared-ctx.json
 * حتى تتمكن جميع ملفات الاختبار من الوصول إليه دون إعادة التسجيل.
 */

import fs from "fs";
import { API_URL } from "./helpers.js";

const SHARED_CTX_FILE = "/tmp/test-shared-ctx.json";

export async function setup(): Promise<void> {
  const runId = Date.now().toString(36);

  const slug  = `shared-${runId}`;
  const email = `shared_${runId}@test.local`;

  // انتظر حتى يصبح الخادم جاهزاً
  let ready = false;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`${API_URL}/api/healthz`);
      if (res.status === 200) { ready = true; break; }
    } catch {
      /* يواصل المحاولة */
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  if (!ready) {
    console.warn("[globalSetup] ⚠️  Server not ready — tests may fail");
  }

  const res = await fetch(`${API_URL}/api/auth/register`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      name:       `Shared Test Tenant ${runId}`,
      ownerEmail: email,
      password:   "SharedPass1!",
      phone:      "0550000001",
      slug,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[globalSetup] Failed to register shared tenant: ${err}`);
  }

  const data = await res.json() as {
    token:  string;
    user:   { id: number; tenantId: number };
    tenant: { plan: string; status: string };
  };

  const ctx = {
    token:    data.token,
    tenantId: data.user.tenantId,
    userId:   data.user.id,
    slug,
    email,
    plan:     data.tenant.plan,
    status:   data.tenant.status,
  };

  fs.writeFileSync(SHARED_CTX_FILE, JSON.stringify(ctx, null, 2), "utf-8");
  console.log(`[globalSetup] ✅ Shared tenant created: slug=${slug}, tenantId=${ctx.tenantId}`);
}

export async function teardown(): Promise<void> {
  try { fs.unlinkSync("/tmp/test-shared-ctx.json"); } catch {}
  console.log("[globalSetup] 🧹 Cleaned up shared context file");
}
