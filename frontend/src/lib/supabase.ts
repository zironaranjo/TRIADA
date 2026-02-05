
import { createClient } from '@supabase/supabase-js';

// Fallback values to prevent crash during build time or missing envs
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (!import.meta.env.VITE_SUPABASE_URL) {
    console.error('⚠️ CRITICAL: VITE_SUPABASE_URL is missing!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
