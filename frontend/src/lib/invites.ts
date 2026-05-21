import { supabase } from './supabase';
import { api } from '../api/client';
import type { UserRole } from '../contexts/AuthContext';
import type { AccountMembership } from './tenant';

function toMembership(row: {
    account_id: string;
    role: string;
    accounts?: { id: string; name: string } | { id: string; name: string }[] | null;
}): AccountMembership {
    const acc = row.accounts;
    const one = Array.isArray(acc) ? acc[0] : acc;
    return { account_id: row.account_id, role: row.role, account_name: one?.name ?? null };
}

export interface PendingInvite {
    id: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    expires_at: string;
}

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

/** Invitación pendiente válida para el email del usuario que inicia sesión. */
export async function acceptPendingInvite(
    userId: string,
    email: string,
): Promise<AccountMembership | null> {
    const normalized = normalizeEmail(email);
    const now = new Date().toISOString();

    const { data: invite, error: invErr } = await supabase
        .from('account_invites')
        .select('id, account_id, role, accounts(id, name)')
        .eq('status', 'pending')
        .ilike('email', normalized)
        .gt('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (invErr || !invite?.account_id) {
        return null;
    }

    const { data: existing } = await supabase
        .from('account_members')
        .select('account_id')
        .eq('user_id', userId)
        .maybeSingle();

    if (existing?.account_id && existing.account_id !== invite.account_id) {
        console.warn('Usuario ya pertenece a otra agencia; invitación no aplicada.');
        return null;
    }

    if (!existing?.account_id) {
        const { data: joined, error: joinErr } = await supabase
            .from('account_members')
            .insert({
                account_id: invite.account_id,
                user_id: userId,
                role: invite.role,
            })
            .select('account_id, role, accounts(id, name)')
            .single();

        if (joinErr || !joined) {
            console.error('acceptPendingInvite: join failed', joinErr);
            return null;
        }

        await supabase
            .from('profiles')
            .update({ role: invite.role as UserRole })
            .eq('user_id', userId);

        await supabase
            .from('account_invites')
            .update({ status: 'accepted' })
            .eq('id', invite.id);

        return toMembership(joined);
    }

    await supabase
        .from('account_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

    const { data: member } = await supabase
        .from('account_members')
        .select('account_id, role, accounts(id, name)')
        .eq('user_id', userId)
        .single();

    return member ? toMembership(member) : null;
}

export async function createTeamInvite(
    accountId: string,
    email: string,
    role: UserRole,
    invitedByUserId: string,
): Promise<{ ok: boolean; error?: string }> {
    const normalized = normalizeEmail(email);

    await supabase
        .from('account_invites')
        .update({ status: 'revoked' })
        .eq('account_id', accountId)
        .ilike('email', normalized)
        .eq('status', 'pending');

    const { error } = await supabase.from('account_invites').insert({
        account_id: accountId,
        email: normalized,
        role,
        invited_by: invitedByUserId,
        status: 'pending',
    });

    if (error) {
        return { ok: false, error: error.message };
    }
    return { ok: true };
}

export async function fetchPendingInvites(accountId: string): Promise<PendingInvite[]> {
    const { data } = await supabase
        .from('account_invites')
        .select('id, email, role, status, created_at, expires_at')
        .eq('account_id', accountId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    return (data as PendingInvite[]) || [];
}

export async function revokeInvite(inviteId: string): Promise<void> {
    await supabase.from('account_invites').update({ status: 'revoked' }).eq('id', inviteId);
}

/** Revoca todas las invitaciones pendientes de un email en la agencia. */
export async function revokePendingInvitesByEmail(
    accountId: string,
    email: string,
): Promise<void> {
    await supabase
        .from('account_invites')
        .update({ status: 'revoked' })
        .eq('account_id', accountId)
        .ilike('email', normalizeEmail(email))
        .eq('status', 'pending');
}

const OTP_TIMEOUT_MS = 18_000;

/** Email de invitación vía Resend (api.triadak.io), más fiable que solo Supabase Auth. */
export async function sendTeamInviteEmail(params: {
    to: string;
    role: UserRole;
    accountName?: string | null;
    inviterName?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
    try {
        const res = await api.post('/emails/team-invite', {
            to: params.to.trim().toLowerCase(),
            role: params.role,
            accountName: params.accountName || 'Triadak',
            inviterName: params.inviterName || 'Tu equipo',
            loginUrl: `${window.location.origin}/login`,
        });
        if (res.data?.success) return { ok: true };
        return { ok: false, error: res.data?.message || res.data?.error || 'resend_failed' };
    } catch (e: unknown) {
        const ax = e as { response?: { status?: number; data?: { message?: string } }; message?: string };
        if (ax.response?.status === 404) {
            return { ok: false, error: 'api_not_deployed' };
        }
        const msg =
            ax.response?.data?.message ||
            ax.message ||
            (e instanceof Error ? e.message : String(e));
        return { ok: false, error: msg };
    }
}

/**
 * Magic link de acceso; con timeout para no dejar el botón en "enviando" indefinidamente.
 */
export async function sendTeamInviteOtp(
    email: string,
    inviteRole: UserRole,
    accountId: string,
): Promise<{ ok: boolean; error?: string; timedOut?: boolean }> {
    const normalized = normalizeEmail(email);
    const redirectTo = `${window.location.origin}/login`;

    const otpPromise = supabase.auth.signInWithOtp({
        email: normalized,
        options: {
            shouldCreateUser: true,
            emailRedirectTo: redirectTo,
            data: { invited_role: inviteRole, invited_account_id: accountId },
        },
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('otp_timeout')), OTP_TIMEOUT_MS);
    });

    try {
        const { error } = await Promise.race([otpPromise, timeoutPromise]);
        if (error) return { ok: false, error: error.message };
        return { ok: true };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg === 'otp_timeout') {
            return { ok: false, error: msg, timedOut: true };
        }
        return { ok: false, error: msg };
    }
}
