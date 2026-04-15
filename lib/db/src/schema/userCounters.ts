import { pgTable, text, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants.js";

export const userCountersTable = pgTable("user_counters", {
  tenantId:      integer("tenant_id").notNull().default(1).references(() => tenantsTable.id, { onDelete: "cascade" }),
  fbUserId:      text("fb_user_id").notNull(),
  offTopicCount: integer("off_topic_count").notNull().default(0),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.tenantId, table.fbUserId] }),
]);
