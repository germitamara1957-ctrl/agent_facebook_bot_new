import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants.js";

export const paymentOrdersTable = pgTable("payment_orders", {
  id:                 serial("id").primaryKey(),
  tenantId:           integer("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  chargilyCheckoutId: text("chargily_checkout_id").unique(),
  plan:               text("plan").notNull(),
  amountDzd:          real("amount_dzd").notNull(),
  status:             text("status").notNull().default("pending"),
  checkoutUrl:        text("checkout_url"),
  paidAt:             timestamp("paid_at", { withTimezone: true }),
  metadata:           text("metadata"),
  createdAt:          timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PaymentOrder = typeof paymentOrdersTable.$inferSelect;
