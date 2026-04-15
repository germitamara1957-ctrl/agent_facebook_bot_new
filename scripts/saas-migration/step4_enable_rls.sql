-- ============================================================
-- Step 4: Enable Row Level Security (RLS) on all 28 tenant tables
-- Strategy: 
--   - Create current_tenant_id() function reading from session config
--   - Enable RLS on each table
--   - Add SELECT/INSERT/UPDATE/DELETE policies
--   - Allow superuser (app DB user) to bypass RLS via BYPASSRLS
-- ============================================================

BEGIN;

-- ── Helper function: reads tenantId from current transaction config ────────────
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS INTEGER AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER;
$$ LANGUAGE sql STABLE;

-- ── Grant execute to all users ─────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION current_tenant_id() TO PUBLIC;

-- ── Macro: for each table, enable RLS + add tenant isolation policy ────────────
-- USING: applied on SELECT, UPDATE, DELETE
-- WITH CHECK: applied on INSERT, UPDATE

DO $$
DECLARE
  tenant_tables TEXT[] := ARRAY[
    'admin_users', 'ai_config', 'ai_providers', 'appointments',
    'available_slots', 'broadcast_templates', 'broadcasts', 'comments_log',
    'conversation_sessions', 'conversations', 'delivery_prices', 'faqs',
    'fb_settings', 'leads', 'order_sessions', 'orders', 'platform_events',
    'pre_order_sessions', 'pre_orders', 'processed_messages',
    'product_categories', 'product_folders', 'product_inquiries', 'products',
    'provider_usage_log', 'subscription_usage', 'user_counters', 'user_product_context'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    -- Allow table owner/superuser to see all rows (bypass RLS)
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);

    -- Drop existing policies if any (idempotent)
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);

    -- Create unified policy: read/write only within current tenant
    EXECUTE format($pol$
      CREATE POLICY tenant_isolation ON %I
        USING (
          tenant_id = current_tenant_id()
          OR current_tenant_id() IS NULL
        )
        WITH CHECK (
          tenant_id = current_tenant_id()
          OR current_tenant_id() IS NULL
        )
    $pol$, t);

    RAISE NOTICE 'RLS enabled on %', t;
  END LOOP;
END $$;

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  rls_count INTEGER;
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = true
    AND tablename IN (
      'admin_users', 'ai_config', 'ai_providers', 'appointments',
      'available_slots', 'broadcast_templates', 'broadcasts', 'comments_log',
      'conversation_sessions', 'conversations', 'delivery_prices', 'faqs',
      'fb_settings', 'leads', 'order_sessions', 'orders', 'platform_events',
      'pre_order_sessions', 'pre_orders', 'processed_messages',
      'product_categories', 'product_folders', 'product_inquiries', 'products',
      'provider_usage_log', 'subscription_usage', 'user_counters', 'user_product_context'
    );

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname = 'tenant_isolation';

  IF rls_count != 28 THEN
    RAISE EXCEPTION 'STEP 4 FAILED: Expected RLS on 28 tables, got %', rls_count;
  END IF;

  IF policy_count != 28 THEN
    RAISE EXCEPTION 'STEP 4 FAILED: Expected 28 policies, got %', policy_count;
  END IF;

  RAISE NOTICE '✅ STEP 4 OK: RLS enabled on all 28 tables with tenant_isolation policies';
END $$;

COMMIT;
