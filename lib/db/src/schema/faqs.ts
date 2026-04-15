import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants.js";

export const faqsTable = pgTable("faqs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Faq = typeof faqsTable.$inferSelect;
