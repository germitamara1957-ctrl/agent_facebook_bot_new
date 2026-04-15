import { pool } from "@workspace/db";

const shouldClearAllData = process.env.CLEAR_ALL_DATA === "true";

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("[migrate] Connected to database");

    // Fix user_counters: recreate if tenant_id column is missing
    const { rows } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'user_counters' AND column_name = 'tenant_id'
    `);

    if (rows.length === 0) {
      console.log("[migrate] user_counters missing tenant_id — recreating...");
      await client.query(`DROP TABLE IF EXISTS user_counters CASCADE`);
      await client.query(`
        CREATE TABLE user_counters (
          tenant_id INTEGER NOT NULL DEFAULT 1 REFERENCES tenants(id) ON DELETE CASCADE,
          fb_user_id TEXT NOT NULL,
          off_topic_count INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (tenant_id, fb_user_id)
        )
      `);
      console.log("[migrate] user_counters recreated ✓");
    } else {
      console.log("[migrate] user_counters OK");
    }

    // Clear all old business data only when CLEAR_ALL_DATA=true is set
    if (shouldClearAllData) {
      console.log("[migrate] CLEAR_ALL_DATA=true — deleting all data in dependency order...");

      // Delete leaf tables first (no dependents), then parents
      const deletionOrder = [
        "user_counters",
        "processed_messages",
        "webhook_message_queue",
        "platform_events",
        "payment_orders",
        "broadcasts",
        "broadcast_templates",
        "leads",
        "pre_order_sessions",
        "pre_orders",
        "order_sessions",
        "orders",
        "conversation_sessions",
        "conversations",
        "comments_log",
        "product_inquiries",
        "user_product_context",
        "appointments",
        "available_slots",
        "products",
        "product_categories",
        "product_folders",
        "delivery_prices",
        "faqs",
        "ai_config",
        "ai_providers",
        "provider_usage_log",
        "fb_settings",
        "subscription_usage",
        "domain_templates",
        "admin_users",
        "tenants",
      ];

      for (const table of deletionOrder) {
        try {
          await client.query(`DELETE FROM ${table}`);
          console.log(`[migrate]   cleared: ${table}`);
        } catch (_) {
          // Table might not exist yet — that's fine
        }
      }

      console.log("[migrate] All data cleared ✓ — seed will repopulate on server startup");
    }

  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("[migrate] ERROR:", err);
  process.exit(1);
});
