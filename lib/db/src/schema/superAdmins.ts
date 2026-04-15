import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const superAdminsTable = pgTable("super_admins", {
  id:           serial("id").primaryKey(),
  username:     text("username").notNull().unique(),
  email:        text("email").unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SuperAdmin = typeof superAdminsTable.$inferSelect;
