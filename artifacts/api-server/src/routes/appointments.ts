import { Router, type IRouter } from "express";
import { db, appointmentsTable } from "@workspace/db";
import { eq, sql, and, count } from "drizzle-orm";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const router: IRouter = Router();

router.get("/appointments/count", async (req, res): Promise<void> => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const [result] = await db
    .select({ value: count() })
    .from(appointmentsTable)
    .where(and(eq(appointmentsTable.tenantId, tenantId), eq(appointmentsTable.status, "pending")));
  res.json({ pending: result?.value ?? 0 });
});

router.get("/appointments", async (req, res): Promise<void> => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const { status, date } = req.query as { status?: string; date?: string };
  const conditions: ReturnType<typeof eq>[] = [eq(appointmentsTable.tenantId, tenantId)];
  if (status) conditions.push(eq(appointmentsTable.status, status));
  if (date) conditions.push(eq(appointmentsTable.appointmentDate, date));

  const rows = await db
    .select()
    .from(appointmentsTable)
    .where(and(...conditions))
    .orderBy(sql`${appointmentsTable.createdAt} desc`);

  res.json(rows);
});

router.patch("/appointments/:id", async (req, res): Promise<void> => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const id = parseInt(req.params["id"]!, 10);
  const { status, note } = req.body as { status?: string; note?: string };

  const updates: Partial<{ status: string; note: string }> = {};
  if (status !== undefined) updates.status = status;
  if (note !== undefined) updates.note = note;

  const [updated] = await db
    .update(appointmentsTable)
    .set(updates)
    .where(and(eq(appointmentsTable.id, id), eq(appointmentsTable.tenantId, tenantId)))
    .returning();

  if (!updated) {
    res.status(404).json({ message: "Appointment not found" });
    return;
  }
  res.json(updated);
});

router.delete("/appointments/:id", async (req, res): Promise<void> => {
  const tenantId = (req as AuthenticatedRequest).user?.tenantId ?? 1;
  const id = parseInt(req.params["id"]!, 10);
  await db.delete(appointmentsTable).where(and(eq(appointmentsTable.id, id), eq(appointmentsTable.tenantId, tenantId)));
  res.json({ message: "Deleted" });
});

export default router;
