-- =============================================
-- Channel Manager: Platform Connections & Sync Logs
-- =============================================

-- Platform Connections table
CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- airbnb, booking_com, vrbo, lodgify, other
  connection_type TEXT NOT NULL DEFAULT 'ical', -- ical, api
  ical_url TEXT,
  api_key TEXT,
  account_id TEXT,
  external_property_id TEXT,
  auto_sync_enabled BOOLEAN NOT NULL DEFAULT false,
  sync_interval_minutes INTEGER NOT NULL DEFAULT 60,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT, -- success, error, partial
  last_sync_message TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_connections_property_id ON platform_connections(property_id);
CREATE INDEX IF NOT EXISTS idx_platform_connections_platform ON platform_connections(platform);

-- Unique constraint: one connection per property per platform
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_connections_unique
  ON platform_connections(property_id, platform);

-- Sync Logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES platform_connections(id) ON DELETE CASCADE,
  property_id UUID NOT NULL,
  platform TEXT NOT NULL,
  sync_type TEXT NOT NULL DEFAULT 'manual', -- manual, auto
  status TEXT NOT NULL DEFAULT 'success', -- success, error, partial
  added INTEGER NOT NULL DEFAULT 0,
  updated INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_connection_id ON sync_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at DESC);

-- Auto-update updated_at trigger for platform_connections
CREATE OR REPLACE FUNCTION update_platform_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_platform_connections_updated_at ON platform_connections;
CREATE TRIGGER trg_platform_connections_updated_at
  BEFORE UPDATE ON platform_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_connections_updated_at();

-- RLS Policies
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (multi-tenancy can be added later via user_id)
CREATE POLICY "Authenticated users can manage platform_connections"
  ON platform_connections FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view sync_logs"
  ON sync_logs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service role full access
CREATE POLICY "Service role full access to platform_connections"
  ON platform_connections FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to sync_logs"
  ON sync_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
