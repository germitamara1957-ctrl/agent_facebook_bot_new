import { pgTable, serial, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { productsTable } from "./products.js";
import { tenantsTable } from "./tenants.js";

export const orderSessionsTable = pgTable("order_sessions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  fbUserId: text("fb_user_id").notNull(),
  productName: text("product_name"),
  productId: integer("product_id").references(() => productsTable.id, { onDelete: "set null" }),
  quantity: integer("quantity").notNull().default(1),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  customerWilaya: text("customer_wilaya"),
  customerCommune: text("customer_commune"),
  customerAddress: text("customer_address"),
  deliveryType: text("delivery_type"),
  deliveryPrice: integer("delivery_price"),
  step: text("step").notNull().default("collecting"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("order_sessions_tenant_fb_user_id_unique").on(table.tenantId, table.fbUserId),
]);

export type OrderSession = typeof orderSessionsTable.$inferSelect;
