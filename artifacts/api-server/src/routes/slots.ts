import { Router, type IRouter } from "express";
import { db, availableSlotsTable, appointmentsTable } from "@workspace/db";
import { eq, and, sql, count } from "drizzle-orm";
import { cache } from "../lib/cache.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const router: IRouter = Router();

router.get("/slots", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const rows = await db.select().from(availableSlotsTable).where(eq(availableSlotsTable.tenantId, tenantId)).orderBy(availableSlotsTable.dayOfWeek, availableSlotsTable.timeSlot);
  res.json(rows);
});

router.post("/slots", async (req, res): Promise<void> => {
  const { dayOfWeek, timeSlot, maxBookings } = req.body as { dayOfWeek: number; timeSlot: string; maxBookings?: number };
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const [created] = await db
    .insert(availableSlotsTable)
    .values({ tenantId, dayOfWeek, timeSlot, isActive: 1, maxBookings: maxBookings ?? 1 })
    .returning();
  cache.delByPrefix("slots:");
  res.status(201).json(created);
});

router.patch("/slots/:id", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const id = parseInt(req.params["id"]!, 10);
  if (Number.isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }
  const { isActive, maxBookings } = req.body as { isActive?: number; maxBookings?: number };

  const updates: Partial<{ isActive: number; maxBookings: number }> = {};
  if (isActive !== undefined) updates.isActive = isActive;
  if (maxBookings !== undefined) updates.maxBookings = maxBookings;

  const [updated] = await db
    .update(availableSlotsTable)
    .set(updates)
    .where(and(eq(availableSlotsTable.id, id), eq(availableSlotsTable.tenantId, tenantId)))
    .returning();

  if (!updated) {
    res.status(404).json({ message: "Slot not found" });
    return;
  }
  cache.delByPrefix("slots:");
  res.json(updated);
});

router.delete("/slots/:id", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const id = parseInt(req.params["id"]!, 10);
  if (Number.isNaN(id)) { res.status(400).json({ message: "Invalid ID" }); return; }
  await db.delete(availableSlotsTable).where(and(eq(availableSlotsTable.id, id), eq(availableSlotsTable.tenantId, tenantId)));
  cache.delByPrefix("slots:");
  res.json({ message: "Deleted" });
});

router.get("/slots/available", async (req, res): Promise<void> => {
  const tenantId: number = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const { date } = req.query as { date?: string };
  if (!date) {
    res.status(400).json({ message: "date query parameter required (YYYY-MM-DD)" });
    return;
  }

  const d = new Date(date);
  const dayOfWeek = d.getDay();

  const slots = await db
    .select()
    .from(availableSlotsTable)
    .where(and(eq(availableSlotsTable.tenantId, tenantId), eq(availableSlotsTable.dayOfWeek, dayOfWeek), eq(availableSlotsTable.isActive, 1)));

  const available = [];
  for (const slot of slots) {
    const [bookingCount] = await db
      .select({ value: count() })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.tenantId, tenantId),
          eq(appointmentsTable.appointmentDate, date),
          eq(appointmentsTable.timeSlot, slot.timeSlot),
          sql`${appointmentsTable.status} != 'cancelled'`
        )
      );
    const currentBookings = bookingCount?.value ?? 0;
    if (currentBookings < slot.maxBookings) {
      available.push({ ...slot, currentBookings, remainingCapacity: slot.maxBookings - currentBookings });
    }
  }

  res.json(available);
});

export default router;
