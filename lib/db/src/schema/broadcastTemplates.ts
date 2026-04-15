import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants.js";

export const broadcastTemplatesTable = pgTable("broadcast_templates", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull().default("offers"),
  messageText: text("message_text").notNull(),
  createdAt: text("created_at").notNull(),
});

export type BroadcastTemplate = typeof broadcastTemplatesTable.$inferSelect;
