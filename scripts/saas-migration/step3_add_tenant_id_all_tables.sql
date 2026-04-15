-- ============================================================
-- Step 3: Add tenant_id to 27 tables (admin_users done in Step 2)
-- Groups:
--   A) Simple tables: add tenant_id column + FK + index
--   B) UNIQUE constraint tables: restructure UNIQUE
--   C) PK tables: rebuild composite PK
-- All idempotent via IF NOT EXISTS / DO blocks
-- ============================================================

BEGIN;

-- ════════════════════════════════════════════════════════════
-- GROUP A: Simple tables (add tenant_id, FK, index)
-- ════════════════════════════════════════════════════════════

-- ── ai_config ────────────────────────────────────────────────
ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE ai_config SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE ai_config DROP CONSTRAINT IF EXISTS fk_ai_config_tenant;
ALTER TABLE ai_config ADD CONSTRAINT fk_ai_config_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE ai_config ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_config_tenant_id ON ai_config(tenant_id);

-- ── ai_providers ─────────────────────────────────────────────
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE ai_providers SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE ai_providers DROP CONSTRAINT IF EXISTS fk_ai_providers_tenant;
ALTER TABLE ai_providers ADD CONSTRAINT fk_ai_providers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE ai_providers ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_providers_tenant_id ON ai_providers(tenant_id);

-- ── appointments ─────────────────────────────────────────────
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE appointments SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS fk_appointments_tenant;
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE appointments ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON appointments(tenant_id);

-- ── available_slots ──────────────────────────────────────────
ALTER TABLE available_slots ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE available_slots SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE available_slots DROP CONSTRAINT IF EXISTS fk_available_slots_tenant;
ALTER TABLE available_slots ADD CONSTRAINT fk_available_slots_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE available_slots ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_available_slots_tenant_id ON available_slots(tenant_id);

-- ── broadcast_templates ───────────────────────────────────────
ALTER TABLE broadcast_templates ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE broadcast_templates SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE broadcast_templates DROP CONSTRAINT IF EXISTS fk_broadcast_templates_tenant;
ALTER TABLE broadcast_templates ADD CONSTRAINT fk_broadcast_templates_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE broadcast_templates ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_broadcast_templates_tenant_id ON broadcast_templates(tenant_id);

-- ── broadcasts ───────────────────────────────────────────────
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE broadcasts SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE broadcasts DROP CONSTRAINT IF EXISTS fk_broadcasts_tenant;
ALTER TABLE broadcasts ADD CONSTRAINT fk_broadcasts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE broadcasts ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_broadcasts_tenant_id ON broadcasts(tenant_id);

-- ── comments_log ─────────────────────────────────────────────
ALTER TABLE comments_log ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE comments_log SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE comments_log DROP CONSTRAINT IF EXISTS fk_comments_log_tenant;
ALTER TABLE comments_log ADD CONSTRAINT fk_comments_log_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE comments_log ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_log_tenant_id ON comments_log(tenant_id);

-- ── conversation_sessions ────────────────────────────────────
ALTER TABLE conversation_sessions ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE conversation_sessions SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE conversation_sessions DROP CONSTRAINT IF EXISTS fk_conversation_sessions_tenant;
ALTER TABLE conversation_sessions ADD CONSTRAINT fk_conversation_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE conversation_sessions ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_tenant_id ON conversation_sessions(tenant_id);

-- ── conversations ─────────────────────────────────────────────
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE conversations SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS fk_conversations_tenant;
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE conversations ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_id ON conversations(tenant_id);

-- ── faqs ─────────────────────────────────────────────────────
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE faqs SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE faqs DROP CONSTRAINT IF EXISTS fk_faqs_tenant;
ALTER TABLE faqs ADD CONSTRAINT fk_faqs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE faqs ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_faqs_tenant_id ON faqs(tenant_id);

-- ── fb_settings ───────────────────────────────────────────────
ALTER TABLE fb_settings ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE fb_settings SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE fb_settings DROP CONSTRAINT IF EXISTS fk_fb_settings_tenant;
ALTER TABLE fb_settings ADD CONSTRAINT fk_fb_settings_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE fb_settings ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fb_settings_tenant_id ON fb_settings(tenant_id);

-- ── orders ────────────────────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE orders SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_tenant;
ALTER TABLE orders ADD CONSTRAINT fk_orders_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE orders ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);

-- ── platform_events ───────────────────────────────────────────
ALTER TABLE platform_events ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE platform_events SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE platform_events DROP CONSTRAINT IF EXISTS fk_platform_events_tenant;
ALTER TABLE platform_events ADD CONSTRAINT fk_platform_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE platform_events ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_platform_events_tenant_id ON platform_events(tenant_id);

-- ── pre_orders ────────────────────────────────────────────────
ALTER TABLE pre_orders ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE pre_orders SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE pre_orders DROP CONSTRAINT IF EXISTS fk_pre_orders_tenant;
ALTER TABLE pre_orders ADD CONSTRAINT fk_pre_orders_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE pre_orders ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pre_orders_tenant_id ON pre_orders(tenant_id);

-- ── processed_messages ────────────────────────────────────────
-- NOTE: PK remains as 'mid' (Facebook message ID is globally unique)
-- tenant_id is added for query filtering only
ALTER TABLE processed_messages ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE processed_messages SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE processed_messages DROP CONSTRAINT IF EXISTS fk_processed_messages_tenant;
ALTER TABLE processed_messages ADD CONSTRAINT fk_processed_messages_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE processed_messages ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_processed_messages_tenant_id ON processed_messages(tenant_id);

-- ── product_categories ────────────────────────────────────────
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE product_categories SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE product_categories DROP CONSTRAINT IF EXISTS fk_product_categories_tenant;
ALTER TABLE product_categories ADD CONSTRAINT fk_product_categories_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE product_categories ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_categories_tenant_id ON product_categories(tenant_id);

-- ── product_folders ───────────────────────────────────────────
ALTER TABLE product_folders ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE product_folders SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE product_folders DROP CONSTRAINT IF EXISTS fk_product_folders_tenant;
ALTER TABLE product_folders ADD CONSTRAINT fk_product_folders_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE product_folders ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_folders_tenant_id ON product_folders(tenant_id);

-- ── product_inquiries ─────────────────────────────────────────
ALTER TABLE product_inquiries ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE product_inquiries SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE product_inquiries DROP CONSTRAINT IF EXISTS fk_product_inquiries_tenant;
ALTER TABLE product_inquiries ADD CONSTRAINT fk_product_inquiries_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE product_inquiries ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_inquiries_tenant_id ON product_inquiries(tenant_id);

-- ── products ──────────────────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE products SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_tenant;
ALTER TABLE products ADD CONSTRAINT fk_products_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE products ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);

-- ── provider_usage_log ────────────────────────────────────────
ALTER TABLE provider_usage_log ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE provider_usage_log SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE provider_usage_log DROP CONSTRAINT IF EXISTS fk_provider_usage_log_tenant;
ALTER TABLE provider_usage_log ADD CONSTRAINT fk_provider_usage_log_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE provider_usage_log ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_provider_usage_log_tenant_id ON provider_usage_log(tenant_id);

-- ── subscription_usage ────────────────────────────────────────
ALTER TABLE subscription_usage ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE subscription_usage SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE subscription_usage DROP CONSTRAINT IF EXISTS fk_subscription_usage_tenant;
ALTER TABLE subscription_usage ADD CONSTRAINT fk_subscription_usage_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE subscription_usage ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscription_usage_tenant_id ON subscription_usage(tenant_id);

-- ════════════════════════════════════════════════════════════
-- GROUP B: UNIQUE constraint tables
-- ════════════════════════════════════════════════════════════

-- ── leads: UNIQUE(fb_user_id) → UNIQUE(tenant_id, fb_user_id) ────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE leads SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS fk_leads_tenant;
ALTER TABLE leads ADD CONSTRAINT fk_leads_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE leads ALTER COLUMN tenant_id SET NOT NULL;
-- Replace UNIQUE constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_fb_user_id_unique;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_tenant_fb_user_id_unique;
ALTER TABLE leads ADD CONSTRAINT leads_tenant_fb_user_id_unique UNIQUE (tenant_id, fb_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON leads(tenant_id);

-- ── order_sessions: UNIQUE(fb_user_id) → UNIQUE(tenant_id, fb_user_id) ───────
ALTER TABLE order_sessions ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE order_sessions SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE order_sessions DROP CONSTRAINT IF EXISTS fk_order_sessions_tenant;
ALTER TABLE order_sessions ADD CONSTRAINT fk_order_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE order_sessions ALTER COLUMN tenant_id SET NOT NULL;
-- Replace UNIQUE constraint
ALTER TABLE order_sessions DROP CONSTRAINT IF EXISTS order_sessions_fb_user_id_unique;
ALTER TABLE order_sessions DROP CONSTRAINT IF EXISTS order_sessions_tenant_fb_user_id_unique;
ALTER TABLE order_sessions ADD CONSTRAINT order_sessions_tenant_fb_user_id_unique UNIQUE (tenant_id, fb_user_id);
CREATE INDEX IF NOT EXISTS idx_order_sessions_tenant_id ON order_sessions(tenant_id);

-- ── delivery_prices: UNIQUE(wilaya_id) → UNIQUE(tenant_id, wilaya_id) ────────
ALTER TABLE delivery_prices ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE delivery_prices SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE delivery_prices DROP CONSTRAINT IF EXISTS fk_delivery_prices_tenant;
ALTER TABLE delivery_prices ADD CONSTRAINT fk_delivery_prices_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE delivery_prices ALTER COLUMN tenant_id SET NOT NULL;
-- Replace UNIQUE constraint
ALTER TABLE delivery_prices DROP CONSTRAINT IF EXISTS delivery_prices_wilaya_id_unique;
ALTER TABLE delivery_prices DROP CONSTRAINT IF EXISTS delivery_prices_tenant_wilaya_id_unique;
ALTER TABLE delivery_prices ADD CONSTRAINT delivery_prices_tenant_wilaya_id_unique UNIQUE (tenant_id, wilaya_id);
CREATE INDEX IF NOT EXISTS idx_delivery_prices_tenant_id ON delivery_prices(tenant_id);

-- ════════════════════════════════════════════════════════════
-- GROUP C: Tables with PK → Composite PK (tenant_id, fb_user_id)
-- Safe: all three tables currently have 0 rows
-- ════════════════════════════════════════════════════════════

-- ── pre_order_sessions: PK(fb_user_id) → PK(tenant_id, fb_user_id) ───────────
ALTER TABLE pre_order_sessions ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE pre_order_sessions SET tenant_id = 1 WHERE tenant_id IS NULL;
-- Drop old PK, set NOT NULL, add FK, rebuild composite PK
ALTER TABLE pre_order_sessions DROP CONSTRAINT IF EXISTS pre_order_sessions_pkey;
ALTER TABLE pre_order_sessions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE pre_order_sessions DROP CONSTRAINT IF EXISTS fk_pre_order_sessions_tenant;
ALTER TABLE pre_order_sessions ADD CONSTRAINT fk_pre_order_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE pre_order_sessions ADD PRIMARY KEY (tenant_id, fb_user_id);
CREATE INDEX IF NOT EXISTS idx_pre_order_sessions_tenant_id ON pre_order_sessions(tenant_id);

-- ── user_counters: PK(fb_user_id) → PK(tenant_id, fb_user_id) ────────────────
ALTER TABLE user_counters ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE user_counters SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE user_counters DROP CONSTRAINT IF EXISTS user_counters_pkey;
ALTER TABLE user_counters ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE user_counters DROP CONSTRAINT IF EXISTS fk_user_counters_tenant;
ALTER TABLE user_counters ADD CONSTRAINT fk_user_counters_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE user_counters ADD PRIMARY KEY (tenant_id, fb_user_id);
CREATE INDEX IF NOT EXISTS idx_user_counters_tenant_id ON user_counters(tenant_id);

-- ── user_product_context: PK(fb_user_id) → PK(tenant_id, fb_user_id) ─────────
ALTER TABLE user_product_context ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE user_product_context SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE user_product_context DROP CONSTRAINT IF EXISTS user_product_context_pkey;
ALTER TABLE user_product_context ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE user_product_context DROP CONSTRAINT IF EXISTS fk_user_product_context_tenant;
ALTER TABLE user_product_context ADD CONSTRAINT fk_user_product_context_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE user_product_context ADD PRIMARY KEY (tenant_id, fb_user_id);
CREATE INDEX IF NOT EXISTS idx_user_product_context_tenant_id ON user_product_context(tenant_id);

-- ════════════════════════════════════════════════════════════
-- VERIFICATION
-- ════════════════════════════════════════════════════════════
DO $$
DECLARE
  tables_with_tenant_id INTEGER;
  tables_without INTEGER;
  expected_tables TEXT[] := ARRAY[
    'ai_config', 'ai_providers', 'appointments', 'available_slots',
    'broadcast_templates', 'broadcasts', 'comments_log', 'conversation_sessions',
    'conversations', 'delivery_prices', 'faqs', 'fb_settings',
    'leads', 'order_sessions', 'orders', 'platform_events',
    'pre_order_sessions', 'pre_orders', 'processed_messages',
    'product_categories', 'product_folders', 'product_inquiries',
    'products', 'provider_usage_log', 'subscription_usage',
    'user_counters', 'user_product_context',
    'admin_users'  -- done in Step 2
  ];
BEGIN
  SELECT COUNT(DISTINCT table_name) INTO tables_with_tenant_id
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'tenant_id'
    AND table_name = ANY(expected_tables);

  IF tables_with_tenant_id != array_length(expected_tables, 1) THEN
    RAISE EXCEPTION 'STEP 3 FAILED: Expected % tables with tenant_id, got %',
      array_length(expected_tables, 1), tables_with_tenant_id;
  END IF;

  -- Verify no NULL tenant_ids remain (checking a sample)
  IF EXISTS (SELECT 1 FROM ai_config WHERE tenant_id IS NULL) THEN
    RAISE EXCEPTION 'STEP 3 FAILED: NULL tenant_id found in ai_config';
  END IF;
  IF EXISTS (SELECT 1 FROM leads WHERE tenant_id IS NULL) THEN
    RAISE EXCEPTION 'STEP 3 FAILED: NULL tenant_id found in leads';
  END IF;

  RAISE NOTICE '✅ STEP 3 OK: tenant_id added to all 28 tables (27 + admin_users from Step 2)';
END $$;

COMMIT;
