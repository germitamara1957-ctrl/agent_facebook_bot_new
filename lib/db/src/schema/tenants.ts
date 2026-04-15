import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tenantsTable = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerEmail: text("owner_email").notNull().unique(),
  plan: text("plan").notNull().default("free"),
  status: text("status").notNull().default("trial"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  subscriptionId: text("subscription_id"),
  maxConversations: integer("max_conversations").notNull().default(100),
  maxProducts: integer("max_products").notNull().default(10),
  maxProviders: integer("max_providers").notNull().default(1),
  maxBroadcasts: integer("max_broadcasts").notNull().default(0),
  fbPageId: text("fb_page_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTenantSchema = createInsertSchema(tenantsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenantsTable.$inferSelect;

export const webhookMessageQueueTable = pgTable("webhook_message_queue", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  fbPageId: text("fb_page_id").notNull(),
  payload: text("payload").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  processed: boolean("processed").notNull().default(false),
  processingStartedAt: timestamp("processing_started_at", { withTimezone: true }),
});

export type WebhookMessageQueue = typeof webhookMessageQueueTable.$inferSelect;
