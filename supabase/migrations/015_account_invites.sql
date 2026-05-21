-- Invitaciones de equipo: unir usuarios a la misma agencia (account_id) de forma segura.

CREATE TABLE IF NOT EXISTS account_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff', 'owner', 'worker')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days')
);

CREATE UNIQUE INDEX IF NOT EXISTS account_invites_pending_unique
  ON account_invites (account_id, lower(email))
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS account_invites_email_idx ON account_invites (lower(email));

ALTER TABLE account_invites ENABLE ROW LEVEL SECURITY;

-- Ver invitaciones de mi agencia o las enviadas a mi email
DROP POLICY IF EXISTS "Account invites visible to team or invitee" ON account_invites;
CREATE POLICY "Account invites visible to team or invitee"
  ON account_invites FOR SELECT
  TO authenticated
  USING (
    account_id = public.current_account_id()
    OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Solo admin de la agencia puede invitar
DROP POLICY IF EXISTS "Admins create account invites" ON account_invites;
CREATE POLICY "Admins create account invites"
  ON account_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    account_id = public.current_account_id()
    AND EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.user_id = auth.uid()
        AND am.account_id = account_invites.account_id
        AND am.role = 'admin'
    )
    AND lower(email) <> lower(coalesce(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "Admins update account invites" ON account_invites;
CREATE POLICY "Admins update account invites"
  ON account_invites FOR UPDATE
  TO authenticated
  USING (
    account_id = public.current_account_id()
    AND EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.user_id = auth.uid() AND am.role = 'admin' AND am.account_id = account_invites.account_id
    )
  );

-- Invitado acepta su propia invitación (cambio de status)
DROP POLICY IF EXISTS "Invitee accepts own invite" ON account_invites;
CREATE POLICY "Invitee accepts own invite"
  ON account_invites FOR UPDATE
  TO authenticated
  USING (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    AND status = 'pending'
  )
  WITH CHECK (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- account_members: ver todo el equipo de la agencia
DROP POLICY IF EXISTS "Users see own membership" ON account_members;
DROP POLICY IF EXISTS "Members see account team" ON account_members;
CREATE POLICY "Members see account team"
  ON account_members FOR SELECT
  TO authenticated
  USING (account_id = public.current_account_id());

-- Admin puede quitar miembros (no a sí mismo)
DROP POLICY IF EXISTS "Admins remove team members" ON account_members;
CREATE POLICY "Admins remove team members"
  ON account_members FOR DELETE
  TO authenticated
  USING (
    account_id = public.current_account_id()
    AND user_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.user_id = auth.uid() AND am.role = 'admin' AND am.account_id = account_members.account_id
    )
  );

-- Admin puede actualizar rol en la agencia
DROP POLICY IF EXISTS "Admins update team roles" ON account_members;
CREATE POLICY "Admins update team roles"
  ON account_members FOR UPDATE
  TO authenticated
  USING (
    account_id = public.current_account_id()
    AND EXISTS (
      SELECT 1 FROM account_members am
      WHERE am.user_id = auth.uid() AND am.role = 'admin' AND am.account_id = account_members.account_id
    )
  )
  WITH CHECK (account_id = public.current_account_id());
