-- Multi-tenancy: cada agencia (account) aísla sus datos.
-- Ejecutar en Supabase producción tras deploy del frontend actualizado.

-- ─── 1. Cuentas y membresías ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Mi agencia',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS account_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'staff', 'owner', 'worker')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS account_members_account_id_idx ON account_members(account_id);
CREATE INDEX IF NOT EXISTS account_members_user_id_idx ON account_members(user_id);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_members ENABLE ROW LEVEL SECURITY;

-- ─── 2. Helper: cuenta activa del usuario ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_account_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT account_id FROM account_members WHERE user_id = auth.uid() LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_account_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_account_id() TO authenticated;

-- ─── 3. account_id en tablas de negocio ────────────────────────────────────
ALTER TABLE properties ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id);
ALTER TABLE owner ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id);
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id);
ALTER TABLE staff_tasks ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id);
ALTER TABLE platform_connections ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id);
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contact_notes') THEN
    ALTER TABLE contact_notes ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sync_logs') THEN
    ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS properties_account_id_idx ON properties(account_id);
CREATE INDEX IF NOT EXISTS owner_account_id_idx ON owner(account_id);
CREATE INDEX IF NOT EXISTS bookings_account_id_idx ON bookings(account_id);

-- ─── 4. Backfill: una cuenta para los datos existentes (primer admin) ────────
DO $$
DECLARE
  v_account_id UUID;
  v_admin_user UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM accounts LIMIT 1) THEN
    INSERT INTO accounts (name) VALUES ('Cuenta principal') RETURNING id INTO v_account_id;

    SELECT user_id INTO v_admin_user FROM profiles ORDER BY created_at ASC NULLS LAST LIMIT 1;

    IF v_admin_user IS NOT NULL THEN
      INSERT INTO account_members (account_id, user_id, role)
      VALUES (v_account_id, v_admin_user, 'admin')
      ON CONFLICT (user_id) DO NOTHING;
    END IF;

    UPDATE properties SET account_id = v_account_id WHERE account_id IS NULL;
    UPDATE owner SET account_id = v_account_id WHERE account_id IS NULL;
    UPDATE contacts SET account_id = v_account_id WHERE account_id IS NULL;
    UPDATE expenses SET account_id = v_account_id WHERE account_id IS NULL;
    UPDATE staff_members SET account_id = v_account_id WHERE account_id IS NULL;
    UPDATE staff_tasks SET account_id = v_account_id WHERE account_id IS NULL;
    UPDATE platform_connections SET account_id = v_account_id WHERE account_id IS NULL;
    UPDATE message_logs SET account_id = v_account_id WHERE account_id IS NULL;
    UPDATE contracts SET account_id = v_account_id WHERE account_id IS NULL;

    UPDATE bookings b SET account_id = p.account_id
    FROM properties p WHERE b.property_id = p.id AND b.account_id IS NULL;
    UPDATE bookings SET account_id = v_account_id WHERE account_id IS NULL;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contact_notes') THEN
      UPDATE contact_notes SET account_id = v_account_id WHERE account_id IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'sync_logs') THEN
      UPDATE sync_logs SET account_id = v_account_id WHERE account_id IS NULL;
    END IF;
  END IF;
END $$;

-- ─── 5. Triggers: asignar account_id en INSERT ───────────────────────────────
CREATE OR REPLACE FUNCTION public.set_row_account_id()
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
  IF NEW.account_id IS NULL THEN
    NEW.account_id := v_account;
  ELSIF NEW.account_id IS DISTINCT FROM v_account THEN
    RAISE EXCEPTION 'account_id does not match user tenant';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_bookings_set_account_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_id IS NULL AND NEW.property_id IS NOT NULL THEN
    SELECT account_id INTO NEW.account_id FROM properties WHERE id = NEW.property_id;
  END IF;
  IF NEW.account_id IS NULL THEN
    NEW.account_id := public.current_account_id();
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'properties', 'owner', 'contacts', 'expenses',
    'staff_members', 'staff_tasks', 'platform_connections',
    'message_logs', 'contracts'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_account_id ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_account_id BEFORE INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION public.set_row_account_id()',
      t, t
    );
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS trg_bookings_account_id ON bookings;
CREATE TRIGGER trg_bookings_account_id
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION public.trg_bookings_set_account_id();

-- ─── 6. RLS: accounts / members ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Users see own membership" ON account_members;
CREATE POLICY "Users see own membership"
  ON account_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own membership" ON account_members;
CREATE POLICY "Users insert own membership"
  ON account_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users see own account" ON accounts;
CREATE POLICY "Users see own account"
  ON accounts FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users create accounts" ON accounts;
CREATE POLICY "Users create accounts"
  ON accounts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ─── 7. RLS: aislamiento por tenant (reemplaza USING true) ───────────────────
-- properties
DROP POLICY IF EXISTS "Authenticated users can manage properties" ON properties;
DROP POLICY IF EXISTS "Service role full access to properties" ON properties;
DROP POLICY IF EXISTS "Tenant manage properties" ON properties;

CREATE POLICY "Tenant manage properties"
  ON properties FOR ALL
  TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY "Service role full access to properties"
  ON properties FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- owner
DROP POLICY IF EXISTS "Authenticated users can manage owners" ON owner;
DROP POLICY IF EXISTS "Service role full access to owners" ON owner;
DROP POLICY IF EXISTS "Tenant manage owners" ON owner;

-- Permite enlazar cuenta al login (antes de tener account_members)
DROP POLICY IF EXISTS "Users read owner by email for linking" ON owner;
CREATE POLICY "Users read owner by email for linking"
  ON owner FOR SELECT
  TO authenticated
  USING (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

CREATE POLICY "Tenant manage owners"
  ON owner FOR ALL
  TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY "Service role full access to owners"
  ON owner FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant manage bookings" ON bookings;
CREATE POLICY "Tenant manage bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

-- contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant manage contacts" ON contacts;
CREATE POLICY "Tenant manage contacts"
  ON contacts FOR ALL
  TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

-- expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant manage expenses" ON expenses;
CREATE POLICY "Tenant manage expenses"
  ON expenses FOR ALL
  TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

-- staff
DROP POLICY IF EXISTS "Authenticated users can manage staff_members" ON staff_members;
DROP POLICY IF EXISTS "Authenticated users can manage staff_tasks" ON staff_tasks;
DROP POLICY IF EXISTS "Tenant manage staff_members" ON staff_members;
DROP POLICY IF EXISTS "Tenant manage staff_tasks" ON staff_tasks;

DROP POLICY IF EXISTS "Users read staff by email for linking" ON staff_members;
CREATE POLICY "Users read staff by email for linking"
  ON staff_members FOR SELECT
  TO authenticated
  USING (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

CREATE POLICY "Tenant manage staff_members"
  ON staff_members FOR ALL
  TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY "Tenant manage staff_tasks"
  ON staff_tasks FOR ALL
  TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

-- channel manager
DROP POLICY IF EXISTS "Authenticated users can manage platform_connections" ON platform_connections;
DROP POLICY IF EXISTS "Authenticated users can view sync_logs" ON sync_logs;
DROP POLICY IF EXISTS "Tenant manage platform_connections" ON platform_connections;
DROP POLICY IF EXISTS "Tenant manage sync_logs" ON sync_logs;

CREATE POLICY "Tenant manage platform_connections"
  ON platform_connections FOR ALL
  TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

CREATE POLICY "Tenant manage sync_logs"
  ON sync_logs FOR ALL
  TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

-- messaging
DROP POLICY IF EXISTS "Authenticated users can read message_logs" ON message_logs;
DROP POLICY IF EXISTS "Authenticated users can insert message_logs" ON message_logs;
DROP POLICY IF EXISTS "Tenant manage message_logs" ON message_logs;

CREATE POLICY "Tenant manage message_logs"
  ON message_logs FOR ALL
  TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

-- contracts (además de user_id)
DROP POLICY IF EXISTS "Users manage own contracts" ON contracts;
DROP POLICY IF EXISTS "Tenant manage contracts" ON contracts;

CREATE POLICY "Tenant manage contracts"
  ON contracts FOR ALL
  TO authenticated
  USING (account_id = public.current_account_id())
  WITH CHECK (account_id = public.current_account_id());

-- contact_notes (si existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contact_notes') THEN
    ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "Tenant manage contact_notes" ON contact_notes';
    EXECUTE '
      CREATE POLICY "Tenant manage contact_notes"
        ON contact_notes FOR ALL
        TO authenticated
        USING (account_id = public.current_account_id())
        WITH CHECK (account_id = public.current_account_id())';
    EXECUTE 'DROP TRIGGER IF EXISTS trg_contact_notes_account_id ON contact_notes';
    EXECUTE '
      CREATE TRIGGER trg_contact_notes_account_id
        BEFORE INSERT OR UPDATE ON contact_notes
        FOR EACH ROW EXECUTE FUNCTION public.set_row_account_id()';
  END IF;
END $$;
