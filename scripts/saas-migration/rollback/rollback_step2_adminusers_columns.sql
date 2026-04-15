-- ============================================================
-- ROLLBACK: Step 2 — Remove tenantId and role from admin_users
-- When to use: If Step 2 (ALTER TABLE admin_users ADD COLUMN tenant_id, role) fails
-- Safe to run: YES — removes columns added in Step 2
-- Depends on: Step 1 rollback NOT needed before this
-- ============================================================

BEGIN;

ALTER TABLE admin_users DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE admin_users DROP COLUMN IF EXISTS role;
ALTER TABLE admin_users DROP COLUMN IF EXISTS email;

-- Verify
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_users' AND column_name = 'tenant_id'
  ) THEN
    RAISE EXCEPTION 'ROLLBACK FAILED: tenant_id column still exists in admin_users';
  END IF;
  RAISE NOTICE 'ROLLBACK STEP 2 OK: admin_users columns reverted';
END $$;

COMMIT;
