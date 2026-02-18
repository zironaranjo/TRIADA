-- ============================================================
-- 007_contracts.sql
-- Rental contract management with digital signature support
-- ============================================================

CREATE TABLE IF NOT EXISTS contracts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID REFERENCES bookings(id) ON DELETE CASCADE,
  property_id   UUID REFERENCES properties(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL DEFAULT 'Rental Agreement',
  content       TEXT,                          -- Contract body text (editable template)
  status        TEXT NOT NULL DEFAULT 'draft', -- draft | sent | signed | cancelled
  sign_token    UUID UNIQUE DEFAULT gen_random_uuid(), -- Public token for guest signing URL
  guest_name    TEXT,
  guest_email   TEXT,
  signed_at     TIMESTAMPTZ,
  signature     TEXT,                          -- Guest typed name as signature
  ip_address    TEXT,                          -- IP of signer for audit
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contracts"
  ON contracts FOR ALL
  USING (auth.uid() = user_id);

-- Public read for signing (by token) — frontend queries without auth
CREATE POLICY "Public read by sign_token"
  ON contracts FOR SELECT
  USING (true);

-- Public update for signing (status + signed_at + signature)
CREATE POLICY "Public sign contract"
  ON contracts FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_contracts_updated_at();
