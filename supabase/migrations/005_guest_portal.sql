-- =============================================
-- Guest Portal: guest tokens + property guest info
-- =============================================

-- Add guest_token to bookings for public access
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_token UUID DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_guest_token ON bookings(guest_token);

-- Auto-generate guest_token on insert if not provided
CREATE OR REPLACE FUNCTION set_booking_guest_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.guest_token IS NULL THEN
    NEW.guest_token = gen_random_uuid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_guest_token ON bookings;
CREATE TRIGGER trg_booking_guest_token
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_guest_token();

-- Backfill existing bookings that have NULL guest_token
UPDATE bookings SET guest_token = gen_random_uuid() WHERE guest_token IS NULL;

-- Add guest-facing columns to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS checkin_instructions TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS checkout_instructions TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS wifi_name TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS wifi_password TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS house_rules TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS checkin_time TEXT DEFAULT '15:00';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS checkout_time TEXT DEFAULT '11:00';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS guest_portal_enabled BOOLEAN DEFAULT true;
