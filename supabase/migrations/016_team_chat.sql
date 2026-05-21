-- Chat interno por agencia (admin, staff, operativos con cuenta)

CREATE TABLE IF NOT EXISTS team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(trim(body)) > 0),
  message_type TEXT NOT NULL DEFAULT 'chat' CHECK (message_type IN ('chat', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS team_messages_account_created_idx
  ON team_messages (account_id, created_at DESC);

ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant read team messages" ON team_messages;
CREATE POLICY "Tenant read team messages"
  ON team_messages FOR SELECT
  TO authenticated
  USING (account_id = public.current_account_id());

DROP POLICY IF EXISTS "Tenant insert team messages" ON team_messages;
CREATE POLICY "Tenant insert team messages"
  ON team_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    account_id = public.current_account_id()
    AND sender_user_id = auth.uid()
  );

CREATE OR REPLACE FUNCTION public.set_team_message_account_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_id IS NULL THEN
    NEW.account_id := public.current_account_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_team_messages_account_id ON team_messages;
CREATE TRIGGER trg_team_messages_account_id
  BEFORE INSERT ON team_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_team_message_account_id();

-- Realtime (opcional en Supabase dashboard si falla aquí)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE team_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN others THEN NULL;
END $$;
