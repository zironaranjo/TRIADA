-- Permisos y realtime para team_messages (por si 016 se aplicó sin grants/realtime)

GRANT SELECT, INSERT ON public.team_messages TO authenticated;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE team_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN others THEN NULL;
END $$;
