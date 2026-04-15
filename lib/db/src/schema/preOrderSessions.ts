import { pgTable, text, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { productsTable } from "./products.js";
import { tenantsTable } from "./tenants.js";

export const preOrderSessionsTable = pgTable("pre_order_sessions", {
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  fbUserId: text("fb_user_id").notNull(),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  productName: text("product_name"),
  step: text("step").notNull().default("awaiting_name"),
  customerName: text("customer_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.tenantId, table.fbUserId] }),
]);
