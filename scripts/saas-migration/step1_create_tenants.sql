-- ============================================================
-- Step 1: Create tenants table + default tenant for existing data
-- Run once — idempotent via IF NOT EXISTS
-- ============================================================

BEGIN;

-- ── 1A: Create tenants table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id                  SERIAL PRIMARY KEY,
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  owner_email         TEXT NOT NULL UNIQUE,
  plan                TEXT NOT NULL DEFAULT 'free',
  status              TEXT NOT NULL DEFAULT 'trial'
                        CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')),
  trial_ends_at       TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
  subscription_id     TEXT,
  max_conversations   INTEGER NOT NULL DEFAULT 100,
  max_products        INTEGER NOT NULL DEFAULT 10,
  max_providers       INTEGER NOT NULL DEFAULT 1,
  max_broadcasts      INTEGER NOT NULL DEFAULT 0,
  fb_page_id          TEXT,
  created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── 1B: Create webhook_message_queue table ────────────────────────────────────
-- Holds incoming webhook messages when tenant onboarding is incomplete
CREATE TABLE IF NOT EXISTS webhook_message_queue (
  id          SERIAL PRIMARY KEY,
  tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  fb_page_id  TEXT NOT NULL,
  payload     TEXT NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '48 hours')
);

CREATE INDEX IF NOT EXISTS idx_webhook_queue_tenant_id ON webhook_message_queue(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_queue_expires_at ON webhook_message_queue(expires_at);

-- ── 1C: Insert default tenant for existing single-tenant data ─────────────────
-- This represents the original business owner account
INSERT INTO tenants (id, name, slug, owner_email, plan, status, trial_ends_at)
VALUES (1, 'Default Business', 'default', 'admin@default.local', 'agency', 'active', NOW() + INTERVAL '36500 days')
ON CONFLICT (id) DO NOTHING;

-- Reset the sequence to avoid conflicts after manual insert
SELECT setval('tenants_id_seq', GREATEST((SELECT MAX(id) FROM tenants), 1));

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
    RAISE EXCEPTION 'STEP 1 FAILED: tenants table was not created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = 1) THEN
    RAISE EXCEPTION 'STEP 1 FAILED: default tenant was not created';
  END IF;
  RAISE NOTICE '✅ STEP 1 OK: tenants table + default tenant created';
END $$;

COMMIT;
