-- =============================================
-- Migration 008: Audit Logs
-- =============================================

-- Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email   TEXT,
  action       TEXT NOT NULL,        -- 'created' | 'updated' | 'deleted'
  entity_type  TEXT NOT NULL,        -- 'booking' | 'property' | 'contact' | 'expense' | 'owner' | 'staff' | 'contract' | 'settings'
  entity_id    UUID,
  entity_name  TEXT,
  old_data     JSONB,
  new_data     JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx     ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_entity_type_idx ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx  ON audit_logs(created_at DESC);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read audit logs
CREATE POLICY "Authenticated users can view audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Anyone (including triggers running as postgres) can insert
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- =============================================
-- Generic trigger function
-- =============================================
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_action      TEXT;
  v_entity_name TEXT;
  v_user_id     UUID;
  v_user_email  TEXT;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN v_action := 'created';
  ELSIF TG_OP = 'UPDATE' THEN v_action := 'updated';
  ELSIF TG_OP = 'DELETE' THEN v_action := 'deleted';
  END IF;

  -- Try to get authenticated user
  BEGIN
    v_user_id    := auth.uid();
    v_user_email := current_setting('request.jwt.claims', true)::json->>'email';
  EXCEPTION WHEN OTHERS THEN
    v_user_id    := NULL;
    v_user_email := 'system';
  END;

  -- Determine entity display name per table
  IF TG_TABLE_NAME = 'bookings' THEN
    v_entity_name := COALESCE(
      CASE WHEN TG_OP = 'DELETE' THEN OLD.guest_name ELSE NEW.guest_name END,
      'Unknown'
    );
  ELSIF TG_TABLE_NAME = 'properties' THEN
    v_entity_name := COALESCE(
      CASE WHEN TG_OP = 'DELETE' THEN OLD.name ELSE NEW.name END,
      'Unknown'
    );
  ELSIF TG_TABLE_NAME = 'contacts' THEN
    v_entity_name := COALESCE(
      CASE WHEN TG_OP = 'DELETE' THEN OLD.name ELSE NEW.name END,
      'Unknown'
    );
  ELSIF TG_TABLE_NAME = 'expenses' THEN
    v_entity_name := COALESCE(
      CASE WHEN TG_OP = 'DELETE' THEN OLD.description ELSE NEW.description END,
      'Unknown'
    );
  ELSE
    v_entity_name := TG_TABLE_NAME;
  END IF;

  -- Insert log entry
  INSERT INTO audit_logs (
    user_id, user_email, action, entity_type, entity_id, entity_name,
    old_data, new_data
  ) VALUES (
    v_user_id,
    v_user_email,
    v_action,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    v_entity_name,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Attach triggers to key tables
-- =============================================

-- Bookings
DROP TRIGGER IF EXISTS trg_audit_bookings ON bookings;
CREATE TRIGGER trg_audit_bookings
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- Properties
DROP TRIGGER IF EXISTS trg_audit_properties ON properties;
CREATE TRIGGER trg_audit_properties
  AFTER INSERT OR UPDATE OR DELETE ON properties
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- Contacts
DROP TRIGGER IF EXISTS trg_audit_contacts ON contacts;
CREATE TRIGGER trg_audit_contacts
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- Expenses
DROP TRIGGER IF EXISTS trg_audit_expenses ON expenses;
CREATE TRIGGER trg_audit_expenses
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
