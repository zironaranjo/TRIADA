-- Parche si 014 falló por: platform_connections.account_id ya es TEXT (OTA).
-- Ejecutar solo este archivo si el error fue "text = uuid".

ALTER TABLE platform_connections
  ADD COLUMN IF NOT EXISTS agency_account_id UUID REFERENCES accounts(id);

-- Quitar trigger incorrecto si se creó sobre account_id TEXT
DROP TRIGGER IF EXISTS trg_platform_connections_account_id ON platform_connections;

UPDATE platform_connections pc
SET agency_account_id = p.account_id
FROM properties p
WHERE pc.property_id = p.id AND pc.agency_account_id IS NULL;

UPDATE platform_connections pc
SET agency_account_id = (
  SELECT account_id FROM account_members ORDER BY created_at ASC LIMIT 1
)
WHERE pc.agency_account_id IS NULL
  AND EXISTS (SELECT 1 FROM account_members LIMIT 1);

CREATE OR REPLACE FUNCTION public.set_row_agency_account_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account UUID;
BEGIN
  v_account := public.current_account_id();
  IF v_account IS NULL THEN
    RAISE EXCEPTION 'No account membership for user %', auth.uid();
  END IF;
  IF NEW.agency_account_id IS NULL THEN
    NEW.agency_account_id := v_account;
  ELSIF NEW.agency_account_id IS DISTINCT FROM v_account THEN
    RAISE EXCEPTION 'agency_account_id does not match user tenant';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_platform_connections_agency_account_id ON platform_connections;
CREATE TRIGGER trg_platform_connections_agency_account_id
  BEFORE INSERT OR UPDATE ON platform_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_row_agency_account_id();

DROP POLICY IF EXISTS "Tenant manage platform_connections" ON platform_connections;
CREATE POLICY "Tenant manage platform_connections"
  ON platform_connections FOR ALL
  TO authenticated
  USING (agency_account_id = public.current_account_id())
  WITH CHECK (agency_account_id = public.current_account_id());
