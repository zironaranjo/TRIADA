import { supabase, supabaseUrl, supabaseAnonKey } from './supabase';

const AUTH_STORAGE_KEY = 'sb-dknhrstvlajlktahxeqs-auth-token';

function readStoredTokens(): { access_token: string; refresh_token: string } | null {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { access_token?: string; refresh_token?: string };
        if (parsed.access_token && parsed.refresh_token) {
            return { access_token: parsed.access_token, refresh_token: parsed.refresh_token };
        }
    } catch {
        /* ignore */
    }
    return null;
}

/** Comprueba que hay JWT (localStorage o cliente). No bloquea con setSession. */
export async function waitForSupabaseSession(maxAttempts = 6, delayMs = 400): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) return true;
        if (readStoredTokens()?.access_token) return true;
        await new Promise(r => setTimeout(r, delayMs));
    }
    return false;
}

async function getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;
    return readStoredTokens()?.access_token ?? null;
}

/** Consulta REST autenticada (fiable en Playwright / túnel TestSprite). */
export async function fetchOwnerRows<T = Record<string, unknown>>(
    select = 'id,firstName,lastName,email,phone,avatar_url',
): Promise<T[]> {
    const token = await getAccessToken();
    if (!token) return [];

    const url = `${supabaseUrl}/rest/v1/owner?select=${encodeURIComponent(select)}&order=firstName.asc`;
    const res = await fetch(url, {
        headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) {
        console.warn('fetchOwnerRows failed', res.status);
        return [];
    }
    return (await res.json()) as T[];
}
