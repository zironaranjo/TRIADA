-- Migration 009: Add currency field to properties
-- Allows each property to have its own currency (default EUR)

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EUR';

-- Add check constraint for valid currency codes
ALTER TABLE properties
  ADD CONSTRAINT IF NOT EXISTS properties_currency_check
  CHECK (currency IN (
    'EUR','USD','GBP','CHF','CAD','AUD','MXN','BRL','JPY','SEK','NOK','DKK','AED','THB'
  ));

COMMENT ON COLUMN properties.currency IS 'ISO 4217 currency code for this property pricing';
