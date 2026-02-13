// supabase/functions/daily-digest/index.ts
// Edge Function: Daily Digest - Morning summary of today's activity
// Designed to run daily at 08:00 via Supabase pg_cron
//
// Setup (SQL in Supabase):
//   SELECT cron.schedule(
//     'daily-digest',
//     '0 8 * * *',  -- every day at 08:00 UTC
//     $$
//     SELECT net.http_post(
//       url := 'https://dknhrstvlajlktahxeqs.supabase.co/functions/v1/daily-digest',
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    const tomorrowISO = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // ─── Today's Check-ins ───────────────────────────────
    const { data: todayCheckins } = await supabase
      .from('bookings')
      .select('id, guest_name, start_date, end_date, total_price, platform, properties(name)')
      .eq('start_date', todayISO)
      .in('status', ['confirmed', 'pending'])
      .order('start_date');

    // ─── Today's Check-outs ──────────────────────────────
    const { data: todayCheckouts } = await supabase
      .from('bookings')
      .select('id, guest_name, start_date, end_date, total_price, platform, properties(name)')
      .eq('end_date', todayISO)
      .in('status', ['confirmed', 'checked_in'])
      .order('end_date');

    // ─── Tomorrow's Check-ins (preview) ──────────────────
    const { data: tomorrowCheckins } = await supabase
      .from('bookings')
      .select('id, guest_name, start_date, properties(name)')
      .eq('start_date', tomorrowISO)
      .in('status', ['confirmed', 'pending']);

    // ─── Get admin/staff users ───────────────────────────
    const { data: staffUsers } = await supabase
      .from('profiles')
      .select('id, role, email, full_name')
      .in('role', ['admin', 'staff']);

    const checkinCount = (todayCheckins || []).length;
    const checkoutCount = (todayCheckouts || []).length;
    const tomorrowCount = (tomorrowCheckins || []).length;

    const checkinNames = (todayCheckins || []).map((b: any) => `${b.guest_name} → ${b.properties?.name || '?'}`).join(', ');
    const checkoutNames = (todayCheckouts || []).map((b: any) => `${b.guest_name} → ${b.properties?.name || '?'}`).join(', ');

    const title = `📋 Daily Digest — ${new Date(todayISO).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
    
    const messageParts = [];
    if (checkinCount > 0) {
      messageParts.push(`🟢 ${checkinCount} check-in${checkinCount > 1 ? 's' : ''}: ${checkinNames}`);
    }
    if (checkoutCount > 0) {
      messageParts.push(`🔴 ${checkoutCount} check-out${checkoutCount > 1 ? 's' : ''}: ${checkoutNames}`);
    }
    if (tomorrowCount > 0) {
      messageParts.push(`📅 Tomorrow: ${tomorrowCount} arrival${tomorrowCount > 1 ? 's' : ''}`);
    }
    if (messageParts.length === 0) {
      messageParts.push('No arrivals or departures today. Enjoy a quiet day!');
    }

    const message = messageParts.join(' | ');

    let notificationsCreated = 0;

    for (const user of (staffUsers || [])) {
      // Check if digest already sent today
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'system')
        .gte('created_at', `${todayISO}T00:00:00`)
        .like('title', '%Daily Digest%')
        .limit(1);

      if (existing && existing.length > 0) continue;

      const { error } = await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'system',
        title,
        message,
        read: false,
        metadata: {
          digest_date: todayISO,
          checkin_count: checkinCount,
          checkout_count: checkoutCount,
          tomorrow_count: tomorrowCount,
        },
      });

      if (!error) notificationsCreated++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: todayISO,
        summary: {
          checkins: checkinCount,
          checkouts: checkoutCount,
          tomorrow_arrivals: tomorrowCount,
        },
        notifications_created: notificationsCreated,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Daily digest error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
