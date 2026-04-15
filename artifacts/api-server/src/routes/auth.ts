import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { db, adminUsersTable, tenantsTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { signToken, verifyToken } from "../lib/auth.js";
import { initializeTenant, slugError } from "../lib/tenantInit.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const router: IRouter = Router();

// ── Rate limiter بسيط للتسجيل ─────────────────────────────────────────────────
// في الإنتاج: 5 محاولات / ساعة / IP
// في التطوير/اختبار: 500 محاولة / ساعة / IP (لأغراض الاختبار المتكرر)
const registerAttempts = new Map<string, { count: number; resetAt: number }>();
const REGISTER_LIMIT  = process.env["NODE_ENV"] === "production" ? 5 : 500;
const REGISTER_WINDOW = 60 * 60 * 1000; // 1 ساعة

function checkRegisterRateLimit(ip: string): boolean {
  const now    = Date.now();
  const entry  = registerAttempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    registerAttempts.set(ip, { count: 1, resetAt: now + REGISTER_WINDOW });
    return true;
  }
  if (entry.count >= REGISTER_LIMIT) return false;
  entry.count++;
  return true;
}

// تنظيف دوري للـ map (كل ساعة)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of registerAttempts.entries()) {
    if (entry.resetAt <= now) registerAttempts.delete(ip);
  }
}, REGISTER_WINDOW);

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = (req.body ?? {}) as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ message: "Username and password required" });
    return;
  }

  const [user] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.username, username))
    .limit(1);

  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const token = signToken({
    id: user.id,
    username: user.username,
    tenantId: user.tenantId,
    role: user.role,
  });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      tenantId: user.tenantId,
      role: user.role,
    },
  });
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.json({ message: "Logged out" });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const payload = verifyToken(authHeader.slice(7));
  if (!payload) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }

  res.json({
    id: payload.id,
    username: payload.username,
    tenantId: payload.tenantId,
    role: payload.role,
  });
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
/**
 * تسجيل مستأجر جديد (عام — لا يحتاج JWT).
 * Body: { name, slug, ownerEmail, password }
 * Response: { token, user, tenant }
 */
router.post("/auth/register", async (req, res): Promise<void> => {
  // Rate limiting
  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
           ?? req.socket.remoteAddress
           ?? "unknown";
  if (!checkRegisterRateLimit(ip)) {
    res.status(429).json({ message: "كثير من محاولات التسجيل. حاول مرة أخرى لاحقاً." });
    return;
  }

  const body = req.body as {
    name?: string;
    slug?: string;
    ownerEmail?: string;
    password?: string;
  };

  // ── التحقق من المدخلات ────────────────────────────────────────────────────
  const name       = body.name?.trim()       ?? "";
  const slug       = body.slug?.trim().toLowerCase() ?? "";
  const ownerEmail = body.ownerEmail?.trim().toLowerCase() ?? "";
  const password   = body.password ?? "";

  if (!name || name.length < 2 || name.length > 60) {
    res.status(400).json({ message: "اسم النشاط التجاري مطلوب (2-60 حرف)" });
    return;
  }

  const slError = slugError(slug);
  if (slError) {
    res.status(400).json({ message: slError });
    return;
  }

  if (!ownerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
    res.status(400).json({ message: "البريد الإلكتروني غير صالح" });
    return;
  }

  if (!password || password.length < 8) {
    res.status(400).json({ message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
    return;
  }

  // ── فحص uniqueness قبل الـ transaction (لإعطاء رسائل واضحة) ─────────────
  const existing = await db
    .select({ id: tenantsTable.id, slug: tenantsTable.slug, email: tenantsTable.ownerEmail })
    .from(tenantsTable)
    .where(or(eq(tenantsTable.slug, slug), eq(tenantsTable.ownerEmail, ownerEmail)))
    .limit(2);

  for (const row of existing) {
    if (row.slug === slug) {
      res.status(409).json({ message: "هذا الـ slug مستخدم بالفعل. اختر آخر." });
      return;
    }
    if (row.email === ownerEmail) {
      res.status(409).json({ message: "هذا البريد الإلكتروني مسجّل بالفعل." });
      return;
    }
  }

  // ── إنشاء المستأجر والمستخدم في transaction ──────────────────────────────
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const trialEndsAt  = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 يوماً
    const username     = slug; // اسم المستخدم = الـ slug

    const { tenantId, adminId } = await db.transaction(async (tx) => {
      // 1) إنشاء المستأجر
      const [tenant] = await tx
        .insert(tenantsTable)
        .values({
          name,
          slug,
          ownerEmail,
          plan: "trial",
          status: "trial",
          trialEndsAt,
        })
        .returning({ id: tenantsTable.id });

      if (!tenant) throw new Error("فشل إنشاء المستأجر");

      // 2) إنشاء المستخدم المشرف
      const [admin] = await tx
        .insert(adminUsersTable)
        .values({
          tenantId: tenant.id,
          username,
          passwordHash,
          role: "owner",
          email: ownerEmail,
        })
        .returning({ id: adminUsersTable.id });

      if (!admin) throw new Error("فشل إنشاء المستخدم");

      return { tenantId: tenant.id, adminId: admin.id };
    });

    // 3) تهيئة البيانات الافتراضية (خارج الـ transaction لأنها غير حرجة)
    await initializeTenant(tenantId, name);

    // 4) إنشاء JWT
    const token = signToken({ id: adminId, username, tenantId, role: "owner" });

    console.log(`[register] New tenant created: #${tenantId} "${name}" (slug: ${slug})`);

    res.status(201).json({
      token,
      user: { id: adminId, username, tenantId, role: "owner" },
      tenant: { id: tenantId, name, slug, ownerEmail, plan: "trial", status: "trial", trialEndsAt },
    });
  } catch (err) {
    // Drizzle يُغلّف الخطأ في err.message + err.cause (خطأ pg الأصلي)
    const errObj   = err as Error & { cause?: Error };
    const errMsg   = errObj.message ?? "";
    const causeMsg = errObj.cause?.message ?? "";
    const fullErr  = `${errMsg} ${causeMsg}`.toLowerCase();

    // معالجة انتهاك قيود الفرادة (unique constraint)
    if (
      fullErr.includes("unique") ||
      fullErr.includes("duplicate") ||
      fullErr.includes("already exists") ||
      (errObj as unknown as { code?: string }).code === "23505"
    ) {
      if (fullErr.includes("slug")) {
        res.status(409).json({ message: "هذا الـ slug مستخدم بالفعل. اختر آخر." });
      } else if (fullErr.includes("owner_email") || fullErr.includes("email")) {
        res.status(409).json({ message: "هذا البريد الإلكتروني مسجّل بالفعل." });
      } else if (fullErr.includes("username")) {
        res.status(409).json({ message: "اسم المستخدم مستخدم بالفعل. اختر slug مختلفاً." });
      } else {
        res.status(409).json({ message: "البيانات مستخدمة بالفعل." });
      }
      return;
    }

    console.error("[register] Error:", errMsg, causeMsg ? `| cause: ${causeMsg}` : "");
    res.status(500).json({ message: "حدث خطأ أثناء التسجيل. حاول مرة أخرى." });
  }
});

// ── PUT /api/auth/change-password ─────────────────────────────────────────────
/**
 * تغيير كلمة مرور المستخدم الحالي (يحتاج JWT).
 * Body: { currentPassword, newPassword }
 */
router.put("/auth/change-password", async (req, res): Promise<void> => {
  // يعيش هذا المسار تحت /api/auth الذي هو prefix عام.
  // لذا نتحقق من الـ JWT يدوياً بدلاً من الاعتماد على authMiddleware.
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const payload = verifyToken(authHeader.slice(7));
  if (!payload) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const userId = payload.id;

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: "كلمة المرور الحالية والجديدة مطلوبتان" });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ message: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" });
    return;
  }

  const [user] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.id, userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ message: "المستخدم غير موجود" });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "كلمة المرور الحالية غير صحيحة" });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(adminUsersTable)
    .set({ passwordHash: newHash })
    .where(eq(adminUsersTable.id, userId));

  res.json({ message: "تم تغيير كلمة المرور بنجاح" });
});

export default router;
