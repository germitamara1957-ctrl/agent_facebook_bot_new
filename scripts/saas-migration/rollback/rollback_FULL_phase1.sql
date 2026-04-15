-- ============================================================
-- ROLLBACK: FULL Phase 1 — Complete revert of all Phase 1 changes
-- When to use: Emergency — revert everything from Phase 1 at once
-- Safe to run: YES — idempotent, uses IF EXISTS everywhere
-- Order: Step 4 → Step 3 → Step 2 → Step 1
-- ============================================================

BEGIN;

-- ── Step 4: Remove RLS ────────────────────────────────────────────────────────
ALTER TABLE admin_users          DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_config            DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_providers         DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments         DISABLE ROW LEVEL SECURITY;
ALTER TABLE available_slots      DISABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_templates  DISABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts           DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments_log         DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations        DISABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_prices      DISABLE ROW LEVEL SECURITY;
ALTER TABLE faqs                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE fb_settings          DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads                DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_sessions       DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders               DISABLE ROW LEVEL SECURITY;
ALTER TABLE platform_events      DISABLE ROW LEVEL SECURITY;
ALTER TABLE pre_order_sessions   DISABLE ROW LEVEL SECURITY;
ALTER TABLE pre_orders           DISABLE ROW LEVEL SECURITY;
ALTER TABLE processed_messages   DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories   DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_folders      DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_inquiries    DISABLE ROW LEVEL SECURITY;
ALTER TABLE products             DISABLE ROW LEVEL SECURITY;
ALTER TABLE provider_usage_log   DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage   DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_counters        DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_product_context DISABLE ROW LEVEL SECURITY;
DROP FUNCTION IF EXISTS current_tenant_id() CASCADE;

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ── Step 3: Remove tenant_id from all tables ──────────────────────────────────
ALTER TABLE admin_users          DROP CONSTRAINT IF EXISTS fk_admin_users_tenant;
ALTER TABLE ai_config            DROP CONSTRAINT IF EXISTS fk_ai_config_tenant;
ALTER TABLE ai_providers         DROP CONSTRAINT IF EXISTS fk_ai_providers_tenant;
ALTER TABLE appointments         DROP CONSTRAINT IF EXISTS fk_appointments_tenant;
ALTER TABLE available_slots      DROP CONSTRAINT IF EXISTS fk_available_slots_tenant;
ALTER TABLE broadcast_templates  DROP CONSTRAINT IF EXISTS fk_broadcast_templates_tenant;
ALTER TABLE broadcasts           DROP CONSTRAINT IF EXISTS fk_broadcasts_tenant;
ALTER TABLE comments_log         DROP CONSTRAINT IF EXISTS fk_comments_log_tenant;
ALTER TABLE conversation_sessions DROP CONSTRAINT IF EXISTS fk_conversation_sessions_tenant;
ALTER TABLE conversations        DROP CONSTRAINT IF EXISTS fk_conversations_tenant;
ALTER TABLE delivery_prices      DROP CONSTRAINT IF EXISTS fk_delivery_prices_tenant;
ALTER TABLE faqs                 DROP CONSTRAINT IF EXISTS fk_faqs_tenant;
ALTER TABLE fb_settings          DROP CONSTRAINT IF EXISTS fk_fb_settings_tenant;
ALTER TABLE leads                DROP CONSTRAINT IF EXISTS fk_leads_tenant;
ALTER TABLE order_sessions       DROP CONSTRAINT IF EXISTS fk_order_sessions_tenant;
ALTER TABLE orders               DROP CONSTRAINT IF EXISTS fk_orders_tenant;
ALTER TABLE platform_events      DROP CONSTRAINT IF EXISTS fk_platform_events_tenant;
ALTER TABLE pre_order_sessions   DROP CONSTRAINT IF EXISTS fk_pre_order_sessions_tenant;
ALTER TABLE pre_orders           DROP CONSTRAINT IF EXISTS fk_pre_orders_tenant;
ALTER TABLE processed_messages   DROP CONSTRAINT IF EXISTS fk_processed_messages_tenant;
ALTER TABLE product_categories   DROP CONSTRAINT IF EXISTS fk_product_categories_tenant;
ALTER TABLE product_folders      DROP CONSTRAINT IF EXISTS fk_product_folders_tenant;
ALTER TABLE product_inquiries    DROP CONSTRAINT IF EXISTS fk_product_inquiries_tenant;
ALTER TABLE products             DROP CONSTRAINT IF EXISTS fk_products_tenant;
ALTER TABLE provider_usage_log   DROP CONSTRAINT IF EXISTS fk_provider_usage_log_tenant;
ALTER TABLE subscription_usage   DROP CONSTRAINT IF EXISTS fk_subscription_usage_tenant;
ALTER TABLE user_counters        DROP CONSTRAINT IF EXISTS fk_user_counters_tenant;
ALTER TABLE user_product_context DROP CONSTRAINT IF EXISTS fk_user_product_context_tenant;

DROP INDEX IF EXISTS idx_admin_users_tenant_id;
DROP INDEX IF EXISTS idx_ai_config_tenant_id;
DROP INDEX IF EXISTS idx_ai_providers_tenant_id;
DROP INDEX IF EXISTS idx_appointments_tenant_id;
DROP INDEX IF EXISTS idx_available_slots_tenant_id;
DROP INDEX IF EXISTS idx_broadcast_templates_tenant_id;
DROP INDEX IF EXISTS idx_broadcasts_tenant_id;
DROP INDEX IF EXISTS idx_comments_log_tenant_id;
DROP INDEX IF EXISTS idx_conversation_sessions_tenant_id;
DROP INDEX IF EXISTS idx_conversations_tenant_id;
DROP INDEX IF EXISTS idx_delivery_prices_tenant_id;
DROP INDEX IF EXISTS idx_faqs_tenant_id;
DROP INDEX IF EXISTS idx_fb_settings_tenant_id;
DROP INDEX IF EXISTS idx_leads_tenant_id;
DROP INDEX IF EXISTS idx_order_sessions_tenant_id;
DROP INDEX IF EXISTS idx_orders_tenant_id;
DROP INDEX IF EXISTS idx_platform_events_tenant_id;
DROP INDEX IF EXISTS idx_pre_order_sessions_tenant_id;
DROP INDEX IF EXISTS idx_pre_orders_tenant_id;
DROP INDEX IF EXISTS idx_processed_messages_tenant_id;
DROP INDEX IF EXISTS idx_product_categories_tenant_id;
DROP INDEX IF EXISTS idx_product_folders_tenant_id;
DROP INDEX IF EXISTS idx_product_inquiries_tenant_id;
DROP INDEX IF EXISTS idx_products_tenant_id;
DROP INDEX IF EXISTS idx_provider_usage_log_tenant_id;
DROP INDEX IF EXISTS idx_subscription_usage_tenant_id;
DROP INDEX IF EXISTS idx_user_counters_tenant_id;
DROP INDEX IF EXISTS idx_user_product_context_tenant_id;

-- Restore UNIQUE constraints that were replaced
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_tenant_fb_user_id_unique;
ALTER TABLE order_sessions DROP CONSTRAINT IF EXISTS order_sessions_tenant_fb_user_id_unique;
ALTER TABLE user_product_context DROP CONSTRAINT IF EXISTS user_product_context_tenant_fb_user_id_unique;
ALTER TABLE user_counters DROP CONSTRAINT IF EXISTS user_counters_tenant_fb_user_id_unique;
ALTER TABLE pre_order_sessions DROP CONSTRAINT IF EXISTS pre_order_sessions_tenant_fb_user_id_unique;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'leads' AND constraint_name = 'leads_fb_user_id_unique') THEN
    ALTER TABLE leads ADD CONSTRAINT leads_fb_user_id_unique UNIQUE (fb_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'order_sessions' AND constraint_name = 'order_sessions_fb_user_id_unique') THEN
    ALTER TABLE order_sessions ADD CONSTRAINT order_sessions_fb_user_id_unique UNIQUE (fb_user_id);
  END IF;
END $$;

ALTER TABLE admin_users          DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE ai_config            DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE ai_providers         DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE appointments         DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE available_slots      DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE broadcast_templates  DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE broadcasts           DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE comments_log         DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE conversation_sessions DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE conversations        DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE delivery_prices      DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE faqs                 DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE fb_settings          DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE leads                DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE order_sessions       DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE orders               DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE platform_events      DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE pre_order_sessions   DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE pre_orders           DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE processed_messages   DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE product_categories   DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE product_folders      DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE product_inquiries    DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE products             DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE provider_usage_log   DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE subscription_usage   DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE user_counters        DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE user_product_context DROP COLUMN IF EXISTS tenant_id;

-- ── Step 2: Remove admin_users added columns ──────────────────────────────────
ALTER TABLE admin_users DROP COLUMN IF EXISTS role;
ALTER TABLE admin_users DROP COLUMN IF EXISTS email;

-- ── Step 1: Drop tenants table ────────────────────────────────────────────────
DROP TABLE IF EXISTS webhook_message_queue CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- ── Final Verification ────────────────────────────────────────────────────────
DO $$
DECLARE
  tenant_cols INTEGER;
  tenants_table_exists BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO tenant_cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND column_name = 'tenant_id';
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants'
  ) INTO tenants_table_exists;
  
  IF tenant_cols > 0 THEN
    RAISE EXCEPTION 'FULL ROLLBACK FAILED: % tables still have tenant_id', tenant_cols;
  END IF;
  IF tenants_table_exists THEN
    RAISE EXCEPTION 'FULL ROLLBACK FAILED: tenants table still exists';
  END IF;
  
  RAISE NOTICE '✅ FULL PHASE 1 ROLLBACK SUCCESSFUL — Database restored to pre-SaaS state';
END $$;

COMMIT;
