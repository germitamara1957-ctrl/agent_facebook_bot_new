import { Router, type IRouter } from "express";
import { db, deliveryPricesTable, aiConfigTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { rDel } from "../lib/redisCache.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const router: IRouter = Router();

export const ALGERIA_WILAYAS = [
  { wilayaId: 1, wilayaName: "أدرار" },
  { wilayaId: 2, wilayaName: "الشلف" },
  { wilayaId: 3, wilayaName: "الأغواط" },
  { wilayaId: 4, wilayaName: "أم البواقي" },
  { wilayaId: 5, wilayaName: "باتنة" },
  { wilayaId: 6, wilayaName: "بجاية" },
  { wilayaId: 7, wilayaName: "بسكرة" },
  { wilayaId: 8, wilayaName: "بشار" },
  { wilayaId: 9, wilayaName: "البليدة" },
  { wilayaId: 10, wilayaName: "البويرة" },
  { wilayaId: 11, wilayaName: "تمنراست" },
  { wilayaId: 12, wilayaName: "تبسة" },
  { wilayaId: 13, wilayaName: "تلمسان" },
  { wilayaId: 14, wilayaName: "تيارت" },
  { wilayaId: 15, wilayaName: "تيزي وزو" },
  { wilayaId: 16, wilayaName: "الجزائر العاصمة" },
  { wilayaId: 17, wilayaName: "الجلفة" },
  { wilayaId: 18, wilayaName: "جيجل" },
  { wilayaId: 19, wilayaName: "سطيف" },
  { wilayaId: 20, wilayaName: "سعيدة" },
  { wilayaId: 21, wilayaName: "سكيكدة" },
  { wilayaId: 22, wilayaName: "سيدي بلعباس" },
  { wilayaId: 23, wilayaName: "عنابة" },
  { wilayaId: 24, wilayaName: "قالمة" },
  { wilayaId: 25, wilayaName: "قسنطينة" },
  { wilayaId: 26, wilayaName: "المدية" },
  { wilayaId: 27, wilayaName: "مستغانم" },
  { wilayaId: 28, wilayaName: "المسيلة" },
  { wilayaId: 29, wilayaName: "معسكر" },
  { wilayaId: 30, wilayaName: "ورقلة" },
  { wilayaId: 31, wilayaName: "وهران" },
  { wilayaId: 32, wilayaName: "البيض" },
  { wilayaId: 33, wilayaName: "إليزي" },
  { wilayaId: 34, wilayaName: "برج بوعريريج" },
  { wilayaId: 35, wilayaName: "بومرداس" },
  { wilayaId: 36, wilayaName: "الطارف" },
  { wilayaId: 37, wilayaName: "تندوف" },
  { wilayaId: 38, wilayaName: "تيسمسيلت" },
  { wilayaId: 39, wilayaName: "الوادي" },
  { wilayaId: 40, wilayaName: "خنشلة" },
  { wilayaId: 41, wilayaName: "سوق أهراس" },
  { wilayaId: 42, wilayaName: "تيبازة" },
  { wilayaId: 43, wilayaName: "ميلة" },
  { wilayaId: 44, wilayaName: "عين الدفلى" },
  { wilayaId: 45, wilayaName: "النعامة" },
  { wilayaId: 46, wilayaName: "عين تموشنت" },
  { wilayaId: 47, wilayaName: "غرداية" },
  { wilayaId: 48, wilayaName: "غليزان" },
  { wilayaId: 49, wilayaName: "تيميمون" },
  { wilayaId: 50, wilayaName: "برج باجي مختار" },
  { wilayaId: 51, wilayaName: "أولاد جلال" },
  { wilayaId: 52, wilayaName: "بني عباس" },
  { wilayaId: 53, wilayaName: "عين صالح" },
  { wilayaId: 54, wilayaName: "عين قزام" },
  { wilayaId: 55, wilayaName: "تقرت" },
  { wilayaId: 56, wilayaName: "جانت" },
  { wilayaId: 57, wilayaName: "المغير" },
  { wilayaId: 58, wilayaName: "المنيعة" },
  { wilayaId: 59, wilayaName: "آفلو" },
  { wilayaId: 60, wilayaName: "بريكة" },
  { wilayaId: 61, wilayaName: "عين وسارة" },
  { wilayaId: 62, wilayaName: "مسعد" },
  { wilayaId: 63, wilayaName: "بوسعادة" },
  { wilayaId: 64, wilayaName: "بئر العاتر" },
  { wilayaId: 65, wilayaName: "الأبيض سيدي الشيخ" },
  { wilayaId: 66, wilayaName: "قصر البخاري" },
  { wilayaId: 67, wilayaName: "قصر الشلالة" },
  { wilayaId: 68, wilayaName: "القنطرة" },
  { wilayaId: 69, wilayaName: "العريشة" },
];

async function ensureWilayasExist(tenantId: number): Promise<void> {
  const existing = await db
    .select({ wilayaId: deliveryPricesTable.wilayaId, wilayaName: deliveryPricesTable.wilayaName })
    .from(deliveryPricesTable)
    .where(eq(deliveryPricesTable.tenantId, tenantId));
  const existingMap = new Map(existing.map((r) => [r.wilayaId, r.wilayaName]));

  const missing = ALGERIA_WILAYAS.filter((w) => !existingMap.has(w.wilayaId));
  if (missing.length > 0) {
    await db.insert(deliveryPricesTable).values(
      missing.map((w) => ({ tenantId, wilayaId: w.wilayaId, wilayaName: w.wilayaName, homePrice: 0, officePrice: 0 }))
    );
  }

  for (const w of ALGERIA_WILAYAS) {
    if (existingMap.has(w.wilayaId) && existingMap.get(w.wilayaId) !== w.wilayaName) {
      await db.update(deliveryPricesTable)
        .set({ wilayaName: w.wilayaName })
        .where(and(eq(deliveryPricesTable.wilayaId, w.wilayaId), eq(deliveryPricesTable.tenantId, tenantId)));
    }
  }
}

router.get("/delivery-prices", async (req, res) => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  try {
    await ensureWilayasExist(tenantId);
    const prices = await db
      .select()
      .from(deliveryPricesTable)
      .where(eq(deliveryPricesTable.tenantId, tenantId))
      .orderBy(deliveryPricesTable.wilayaId);
    const [config] = await db
      .select({ deliveryEnabled: aiConfigTable.deliveryEnabled })
      .from(aiConfigTable)
      .where(eq(aiConfigTable.tenantId, tenantId))
      .limit(1);
    res.json({ deliveryEnabled: config?.deliveryEnabled ?? 0, prices });
  } catch (err) {
    res.status(500).json({ message: String(err) });
  }
});

router.patch("/delivery-prices/toggle", async (req, res) => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  try {
    const [config] = await db
      .select({ deliveryEnabled: aiConfigTable.deliveryEnabled })
      .from(aiConfigTable)
      .where(eq(aiConfigTable.tenantId, tenantId))
      .limit(1);
    const newValue = config?.deliveryEnabled ? 0 : 1;
    await db.update(aiConfigTable).set({ deliveryEnabled: newValue }).where(eq(aiConfigTable.tenantId, tenantId));
    await rDel("config");
    res.json({ deliveryEnabled: newValue });
  } catch (err) {
    res.status(500).json({ message: String(err) });
  }
});

router.put("/delivery-prices", async (req, res) => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  try {
    const { prices } = req.body as { prices: { wilayaId: number; homePrice: number; officePrice: number }[] };
    if (!Array.isArray(prices)) {
      res.status(400).json({ message: "prices must be an array" });
      return;
    }
    for (const p of prices) {
      await db
        .update(deliveryPricesTable)
        .set({ homePrice: p.homePrice ?? 0, officePrice: p.officePrice ?? 0 })
        .where(and(eq(deliveryPricesTable.wilayaId, p.wilayaId), eq(deliveryPricesTable.tenantId, tenantId)));
    }
    await rDel("config");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: String(err) });
  }
});

router.post("/delivery-prices/custom", async (req, res) => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  try {
    const { wilayaName, homePrice, officePrice } = req.body as {
      wilayaName: string;
      homePrice?: number;
      officePrice?: number;
    };
    if (!wilayaName?.trim()) {
      res.status(400).json({ message: "wilayaName is required" });
      return;
    }

    const [{ maxId }] = await db
      .select({ maxId: sql<number>`COALESCE(MAX(${deliveryPricesTable.wilayaId}), 69)` })
      .from(deliveryPricesTable)
      .where(eq(deliveryPricesTable.tenantId, tenantId));
    const newId = Math.max(Number(maxId) + 1, 70);

    const [inserted] = await db
      .insert(deliveryPricesTable)
      .values({
        tenantId,
        wilayaId: newId,
        wilayaName: wilayaName.trim(),
        homePrice: homePrice ?? 0,
        officePrice: officePrice ?? 0,
      })
      .returning();

    await rDel("config");
    res.json({ success: true, wilaya: inserted });
  } catch (err) {
    res.status(500).json({ message: String(err) });
  }
});

router.delete("/delivery-prices/:wilayaId", async (req, res) => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  try {
    const wilayaId = parseInt(req.params.wilayaId, 10);
    if (isNaN(wilayaId) || wilayaId < 70) {
      res.status(400).json({ message: "لا يمكن حذف الولايات القياسية (1-69)" });
      return;
    }
    await db.delete(deliveryPricesTable).where(and(eq(deliveryPricesTable.wilayaId, wilayaId), eq(deliveryPricesTable.tenantId, tenantId)));
    await rDel("config");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: String(err) });
  }
});

export default router;
