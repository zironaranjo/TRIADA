import { supabase } from './supabase';
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
