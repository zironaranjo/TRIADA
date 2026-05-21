import { supabase } from './supabase';
import { acceptPendingInvite } from './invites';

export interface AccountMembership {
    account_id: string;
    role: string;
    account_name?: string | null;
}

export function parseMembership(row: {
    account_id: string;
    role: string;
    accounts?: { id: string; name: string } | { id: string; name: string }[] | null;
}): AccountMembership {
    const acc = row.accounts;
    const one = Array.isArray(acc) ? acc[0] : acc;
    return {
        account_id: row.account_id,
        role: row.role,
        account_name: one?.name ?? null,
    };
}

/**
 * Garantiza que el usuario tenga una fila en account_members.
 * - Propietario/trabajador: se une a la cuenta de la agencia (owner/staff por email).
 * - Usuario nuevo: crea cuenta nueva (tenant vacío) y es admin de esa cuenta.
 */
export async function ensureAccountMembership(
    userId: string,
    email: string,
): Promise<AccountMembership | null> {
    const { data: existing } = await supabase
        .from('account_members')
        .select('account_id, role, accounts(id, name)')
        .eq('user_id', userId)
        .maybeSingle();

    if (existing?.account_id) {
        return parseMembership(existing);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const fromInvite = await acceptPendingInvite(userId, email);
    if (fromInvite?.account_id) {
        return fromInvite;
    }

    const { data: ownerRow } = await supabase
        .from('owner')
        .select('id, account_id')
        .ilike('email', normalizedEmail)
        .maybeSingle();

    if (ownerRow?.account_id) {
        const { data: joined, error } = await supabase
            .from('account_members')
            .insert({
                account_id: ownerRow.account_id,
                user_id: userId,
                role: 'owner',
            })
            .select('account_id, role, accounts(id, name)')
            .single();
        if (!error && joined) {
            await supabase.from('profiles').update({ role: 'owner' }).eq('user_id', userId);
            return parseMembership(joined);
        }
    }

    const { data: staffRow } = await supabase
        .from('staff_members')
        .select('account_id')
        .ilike('email', normalizedEmail)
        .maybeSingle();

    if (staffRow?.account_id) {
        const { data: joined, error } = await supabase
            .from('account_members')
            .insert({
                account_id: staffRow.account_id,
                user_id: userId,
                role: 'worker',
            })
            .select('account_id, role, accounts(id, name)')
            .single();
        if (!error && joined) {
            await supabase.from('profiles').update({ role: 'worker' }).eq('user_id', userId);
            return parseMembership(joined);
        }
    }

    const agencyName = `Agencia ${email.split('@')[0] || 'nueva'}`;
    const { data: newAccount, error: accErr } = await supabase
        .from('accounts')
        .insert({ name: agencyName })
        .select('id, name')
        .single();

    if (accErr || !newAccount) {
        console.error('ensureAccountMembership: could not create account', accErr);
        return null;
    }

    const { data: member, error: memErr } = await supabase
        .from('account_members')
        .insert({
            account_id: newAccount.id,
            user_id: userId,
            role: 'admin',
        })
        .select('account_id, role, accounts(id, name)')
        .single();

    if (memErr || !member) {
        console.error('ensureAccountMembership: could not create membership', memErr);
        return null;
    }

    await supabase.from('profiles').update({ role: 'admin' }).eq('user_id', userId);

    return {
        account_id: member.account_id,
        role: member.role,
        account_name: newAccount.name,
    };
}
