import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants.js";

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  fbUserId: text("fb_user_id").notNull(),
  fbUserName: text("fb_user_name"),
  fbProfileUrl: text("fb_profile_url"),
  serviceName: text("service_name"),
  appointmentDate: text("appointment_date"),
  timeSlot: text("time_slot"),
  status: text("status").notNull().default("pending"),
  note: text("note"),
  source: text("source").notNull().default("messenger"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Appointment = typeof appointmentsTable.$inferSelect;
