
import { createClient } from '@supabase/supabase-js';

// Fallback to production Supabase values if env vars are missing (e.g. Docker build)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dknhrstvlajlktahxeqs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_rV7bQaTazFEffBD0riQ1UQ_JggijzBR';

if (!import.meta.env.VITE_SUPABASE_URL) {
    console.error('⚠️ CRITICAL: VITE_SUPABASE_URL is missing!');
}

// Standard client (authenticated pages)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Public client — sin auth session para páginas públicas (/explore, /property/:id)
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});
