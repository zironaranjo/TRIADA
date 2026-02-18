-- Migration 009: Add currency field to properties
-- Allows each property to have its own currency (default EUR)

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EUR';

-- Add check constraint for valid currency codes (IF NOT EXISTS workaround for PostgreSQL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'properties_currency_check'
  ) THEN
    ALTER TABLE properties ADD CONSTRAINT properties_currency_check
      CHECK (currency IN (
        'EUR','USD','GBP','CHF','CAD','AUD','MXN','BRL','JPY','SEK','NOK','DKK','AED','THB'
      ));
  END IF;
END$$;

COMMENT ON COLUMN properties.currency IS 'ISO 4217 currency code for this property pricing';
