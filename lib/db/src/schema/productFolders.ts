import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants.js";

export const productFoldersTable = pgTable("product_folders", {
  id:        serial("id").primaryKey(),
  tenantId:  integer("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  name:      text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
