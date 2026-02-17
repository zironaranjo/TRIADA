-- =============================================
-- Messaging: WhatsApp & SMS via Twilio
-- =============================================

-- Message Logs table
CREATE TABLE IF NOT EXISTS message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    recipient_name TEXT,
    recipient_phone TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'sms')),
    template_key TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'queued')),
    external_sid TEXT,
    error_message TEXT,
    sent_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_message_logs_booking ON message_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_property ON message_logs(property_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_channel ON message_logs(channel);
CREATE INDEX IF NOT EXISTS idx_message_logs_created ON message_logs(created_at DESC);

-- RLS
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read message_logs"
    ON message_logs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert message_logs"
    ON message_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Service role full access to message_logs"
    ON message_logs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
