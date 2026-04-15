import { pgTable, serial, integer, text, uniqueIndex } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants.js";

export const deliveryPricesTable = pgTable("delivery_prices", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  wilayaId: integer("wilaya_id").notNull(),
  wilayaName: text("wilaya_name").notNull(),
  homePrice: integer("home_price").notNull().default(0),
  officePrice: integer("office_price").notNull().default(0),
}, (table) => [
  uniqueIndex("delivery_prices_tenant_wilaya_id_unique").on(table.tenantId, table.wilayaId),
]);
