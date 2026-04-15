import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants.js";

export const conversationSessionsTable = pgTable("conversation_sessions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  fbUserId: text("fb_user_id").notNull(),
  sessionStart: text("session_start").notNull(),
  sessionEnd: text("session_end").notNull(),
  messageCount: integer("message_count").notNull().default(0),
  aiCallsCount: integer("ai_calls_count").notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ConversationSession = typeof conversationSessionsTable.$inferSelect;
