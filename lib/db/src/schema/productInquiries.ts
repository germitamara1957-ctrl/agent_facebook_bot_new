import { pgTable, serial, integer, text } from "drizzle-orm/pg-core";
import { productsTable } from "./products.js";
import { tenantsTable } from "./tenants.js";

export const productInquiriesTable = pgTable("product_inquiries", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  fbUserId: text("fb_user_id").notNull(),
  fbUserName: text("fb_user_name"),
  productName: text("product_name").notNull(),
  productId: integer("product_id").references(() => productsTable.id, { onDelete: "set null" }),
  inquiredAt: text("inquired_at").notNull(),
  reminderSent: integer("reminder_sent").notNull().default(0),
  converted: integer("converted").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export type ProductInquiry = typeof productInquiriesTable.$inferSelect;
