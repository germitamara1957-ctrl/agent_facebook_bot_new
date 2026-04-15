import { pgTable, serial, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants.js";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  fbUserId: text("fb_user_id").notNull(),
  fbUserName: text("fb_user_name"),
  fbProfileUrl: text("fb_profile_url"),
  phone: text("phone"),
  email: text("email"),
  label: text("label").notNull().default("new"),
  notes: text("notes"),
  source: text("source").notNull().default("messenger"),
  lastInteractionAt: text("last_interaction_at"),
  totalMessages: integer("total_messages").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("leads_tenant_fb_user_id_unique").on(table.tenantId, table.fbUserId),
]);

export type Lead = typeof leadsTable.$inferSelect;
