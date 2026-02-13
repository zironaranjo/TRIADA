// supabase/functions/send-reminders/index.ts
// Edge Function: Check-in/Check-out Reminder Generator
// Designed to run as a cron job every hour via Supabase pg_cron or external scheduler
//
// Setup (SQL in Supabase):
//   SELECT cron.schedule(
//     'send-booking-reminders',
//     '0 * * * *',  -- every hour
//     $$
//     SELECT net.http_post(
//       url := 'https://dknhrstvlajlktahxeqs.supabase.co/functions/v1/send-reminders',
//       headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb,
//       body := '{}'::jsonb
//     );
//     $$
//   );

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Booking {
  id: string;
  guest_name: string;
  start_date: string;
  end_date: string;
  property_id: string;
  status: string;
  properties?: { name: string; owner_id: string | null } | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const results = { checkin: 0, checkout: 0, errors: 0 };

    // ─── Fetch all confirmed bookings within the next 48 hours ───
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const nowISO = now.toISOString().split('T')[0];
    const futureISO = in48h.toISOString().split('T')[0];

    // Check-in reminders: bookings starting within next 48 hours
    const { data: checkinBookings, error: checkinError } = await supabase
      .from('bookings')
      .select('id, guest_name, start_date, end_date, property_id, status, properties(name, owner_id)')
      .gte('start_date', nowISO)
      .lte('start_date', futureISO)
      .in('status', ['confirmed', 'pending']);

    if (checkinError) {
      console.error('Error fetching check-in bookings:', checkinError);
    }

    // Check-out reminders: bookings ending within next 48 hours
    const { data: checkoutBookings, error: checkoutError } = await supabase
      .from('bookings')
      .select('id, guest_name, start_date, end_date, property_id, status, properties(name, owner_id)')
      .gte('end_date', nowISO)
      .lte('end_date', futureISO)
      .in('status', ['confirmed', 'checked_in']);

    if (checkoutError) {
      console.error('Error fetching check-out bookings:', checkoutError);
    }

    // ─── Get all admin/staff users to notify ─────────────
    const { data: staffUsers } = await supabase
      .from('profiles')
      .select('id, role, email, full_name')
      .in('role', ['admin', 'staff']);

    const usersToNotify = staffUsers || [];

    // ─── Generate check-in reminders ─────────────────────
    for (const booking of (checkinBookings || []) as Booking[]) {
      const hoursUntilCheckin = Math.round(
        (new Date(booking.start_date).getTime() - now.getTime()) / (1000 * 60 * 60)
      );

      // Skip if more than 48h away
      if (hoursUntilCheckin > 48 || hoursUntilCheckin < 0) continue;

      // Check if we already sent a reminder for this booking
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('type', 'checkin_reminder')
        .eq('metadata->>booking_id', booking.id)
        .limit(1);

      if (existing && existing.length > 0) continue; // Already notified

      const propertyName = booking.properties?.name || 'Unknown Property';
      const title = `Check-in in ${hoursUntilCheckin}h`;
      const message = `${booking.guest_name} arrives at ${propertyName} on ${new Date(booking.start_date).toLocaleDateString()}`;

      // Create notifications for all staff/admin users
      for (const user of usersToNotify) {
        const { error } = await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'checkin_reminder',
          title,
          message,
          read: false,
          metadata: {
            booking_id: booking.id,
            property_id: booking.property_id,
            guest_name: booking.guest_name,
            date: booking.start_date,
            hours_until: hoursUntilCheckin,
          },
        });

        if (error) {
          console.error(`Notification error for user ${user.id}:`, error);
          results.errors++;
        } else {
          results.checkin++;
        }
      }
    }

    // ─── Generate check-out reminders ────────────────────
    for (const booking of (checkoutBookings || []) as Booking[]) {
      const hoursUntilCheckout = Math.round(
        (new Date(booking.end_date).getTime() - now.getTime()) / (1000 * 60 * 60)
      );

      if (hoursUntilCheckout > 48 || hoursUntilCheckout < 0) continue;

      // Check if already notified
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('type', 'checkout_reminder')
        .eq('metadata->>booking_id', booking.id)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const propertyName = booking.properties?.name || 'Unknown Property';
      const title = `Check-out in ${hoursUntilCheckout}h`;
      const message = `${booking.guest_name} departs from ${propertyName} on ${new Date(booking.end_date).toLocaleDateString()}`;

      for (const user of usersToNotify) {
        const { error } = await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'checkout_reminder',
          title,
          message,
          read: false,
          metadata: {
            booking_id: booking.id,
            property_id: booking.property_id,
            guest_name: booking.guest_name,
            date: booking.end_date,
            hours_until: hoursUntilCheckout,
          },
        });

        if (error) {
          console.error(`Notification error for user ${user.id}:`, error);
          results.errors++;
        } else {
          results.checkout++;
        }
      }
    }

    // ─── Response ────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        results,
        bookings_scanned: {
          checkin: (checkinBookings || []).length,
          checkout: (checkoutBookings || []).length,
        },
        users_notified: usersToNotify.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
