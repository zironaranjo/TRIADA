-- ================================================
-- 003: Stripe Connect Accounts
-- Run this in Supabase SQL Editor
-- ================================================

-- Table for Stripe Express connected accounts
CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, restricted
  charges_enabled BOOLEAN NOT NULL DEFAULT false,
  payouts_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(stripe_account_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_connect_user_id ON stripe_connect_accounts(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_connect_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_connect_updated_at
  BEFORE UPDATE ON stripe_connect_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_connect_updated_at();

-- RLS Policies
ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

-- Users can read their own connect account
CREATE POLICY "Users can view own connect account"
  ON stripe_connect_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (backend) can do everything
CREATE POLICY "Service role full access to connect accounts"
  ON stripe_connect_accounts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Ensure subscriptions table has the stripe fields (if not already)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_subscription_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_customer_id TEXT;
  END IF;
END $$;
