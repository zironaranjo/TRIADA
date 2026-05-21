-- RLS policies for properties table (INSERT/UPDATE blocked for authenticated admins)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Keep public explore portal reads
DROP POLICY IF EXISTS "Public can view published properties" ON properties;
CREATE POLICY "Public can view published properties"
  ON properties FOR SELECT
  USING (published = true);

-- Admin / staff: full CRUD while logged in (matches owner table pattern)
DROP POLICY IF EXISTS "Authenticated users can manage properties" ON properties;
CREATE POLICY "Authenticated users can manage properties"
  ON properties FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to properties" ON properties;
CREATE POLICY "Service role full access to properties"
  ON properties FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
