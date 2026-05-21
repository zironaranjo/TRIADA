-- RLS policies for owner table (was blocking authenticated CRUD)
ALTER TABLE owner ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage owners" ON owner;
CREATE POLICY "Authenticated users can manage owners"
  ON owner FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access to owners" ON owner;
CREATE POLICY "Service role full access to owners"
  ON owner FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
