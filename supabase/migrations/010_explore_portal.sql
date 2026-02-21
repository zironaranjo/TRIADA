-- =============================================
-- Explore Portal: public property listing
-- =============================================

-- Published flag
ALTER TABLE properties ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;

-- Location fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS country TEXT;

-- Property specs
ALTER TABLE properties ADD COLUMN IF NOT EXISTS max_guests INTEGER DEFAULT 2;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 1;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 1;

-- Description for public portal
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description TEXT;

-- Property type (apartment, house, villa, cabin, etc.)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'apartment';

-- Amenities (array of strings)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';

-- RLS policy: anyone can read published properties
DROP POLICY IF EXISTS "Public can view published properties" ON properties;
CREATE POLICY "Public can view published properties"
  ON properties FOR SELECT
  USING (published = true);
