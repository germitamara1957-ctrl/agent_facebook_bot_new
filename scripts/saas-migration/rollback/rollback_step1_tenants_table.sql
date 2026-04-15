-- ============================================================
-- ROLLBACK: Step 1 — Drop tenants table
-- When to use: If Step 1 (CREATE TABLE tenants) fails or needs to be reverted
-- Safe to run: YES — only removes the tenants table (no other table depends on it yet)
-- ============================================================

BEGIN;

DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS webhook_message_queue CASCADE;

-- Verify
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    RAISE EXCEPTION 'ROLLBACK FAILED: tenants table still exists';
  END IF;
  RAISE NOTICE 'ROLLBACK STEP 1 OK: tenants table dropped successfully';
END $$;

COMMIT;
