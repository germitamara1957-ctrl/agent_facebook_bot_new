import { pgTable, text, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { productsTable } from "./products.js";
import { tenantsTable } from "./tenants.js";

export const userProductContextTable = pgTable("user_product_context", {
  tenantId:  integer("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  fbUserId:  text("fb_user_id").notNull(),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.tenantId, table.fbUserId] }),
]);
