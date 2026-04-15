import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants.js";

export const availableSlotsTable = pgTable("available_slots", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  timeSlot: text("time_slot").notNull(),
  isActive: integer("is_active").notNull().default(1),
  maxBookings: integer("max_bookings").notNull().default(1),
});

export type AvailableSlot = typeof availableSlotsTable.$inferSelect;
