import { Router, type IRouter } from "express";
import { db, superAdminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { signSuperAdminToken, verifySuperAdminToken } from "../../lib/auth.js";
import type { SuperAdminRequest } from "../../middleware/superAdminMiddleware.js";
import { superAdminMiddleware } from "../../middleware/superAdminMiddleware.js";

const router: IRouter = Router();

// ── POST /api/admin/auth/login ────────────────────────────────────────────────
router.post("/admin/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ message: "اسم المستخدم وكلمة السر مطلوبان" });
    return;
  }

  try {
    const [admin] = await db
      .select()
      .from(superAdminsTable)
      .where(eq(superAdminsTable.username, username))
      .limit(1);

    if (!admin) {
      res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
      return;
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
      return;
    }

    const token = signSuperAdminToken({ id: admin.id, username: admin.username, role: "superadmin" });
    res.json({ token, username: admin.username, role: "superadmin" });
  } catch (err) {
    console.error("[admin/auth/login] Error:", (err as Error).message);
    res.status(500).json({ message: "خطأ في تسجيل الدخول" });
  }
});

// ── GET /api/admin/auth/me ────────────────────────────────────────────────────
router.get("/admin/auth/me", superAdminMiddleware, async (req, res): Promise<void> => {
  const payload = (req as SuperAdminRequest).superAdmin!;
  res.json({ id: payload.id, username: payload.username, role: payload.role });
});

export default router;
