-- ============================================================
-- ROLLBACK: Step 4 — Remove RLS policies and disable RLS
-- When to use: If RLS setup (Step 4) needs to be reverted
-- Safe to run: YES — disables RLS and drops all policies
-- ============================================================

BEGIN;

-- Disable RLS on all tables
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

-- Drop all tenant isolation policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    RAISE NOTICE 'Dropped policy % on %', pol.policyname, pol.tablename;
  END LOOP;
END $$;

-- Drop the custom configuration function if it exists
DROP FUNCTION IF EXISTS current_tenant_id() CASCADE;

DO $$ BEGIN
  RAISE NOTICE 'ROLLBACK STEP 4 OK: All RLS policies and configuration removed';
END $$;

COMMIT;
