-- ============================================================
-- Step 2: Alter admin_users — add tenant_id, role, email
-- Idempotent via IF NOT EXISTS / DO blocks
-- ============================================================

BEGIN;

-- Add tenant_id column (nullable first, will set value, then constrain)
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'owner';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS email TEXT;

-- Assign existing admin users to the default tenant
UPDATE admin_users SET tenant_id = 1 WHERE tenant_id IS NULL;

-- Now add FK constraint (after data is populated)
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS fk_admin_users_tenant;
ALTER TABLE admin_users
  ADD CONSTRAINT fk_admin_users_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Make tenant_id NOT NULL
ALTER TABLE admin_users ALTER COLUMN tenant_id SET NOT NULL;

-- Index for fast tenant lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_tenant_id ON admin_users(tenant_id);

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'admin_users'
    AND column_name IN ('tenant_id', 'role', 'email');

  IF col_count != 3 THEN
    RAISE EXCEPTION 'STEP 2 FAILED: Expected 3 new columns, found %', col_count;
  END IF;

  IF EXISTS (SELECT 1 FROM admin_users WHERE tenant_id IS NULL) THEN
    RAISE EXCEPTION 'STEP 2 FAILED: Some admin_users still have NULL tenant_id';
  END IF;

  RAISE NOTICE '✅ STEP 2 OK: admin_users updated with tenant_id, role, email';
END $$;

COMMIT;
