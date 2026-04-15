import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants.js";

export const processedMessagesTable = pgTable("processed_messages", {
  mid:         text("mid").primaryKey(),
  tenantId:    integer("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  senderId:    text("sender_id").notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});
