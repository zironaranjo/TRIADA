import { supabase } from './supabase';

export type AuditAction = 'created' | 'updated' | 'deleted' | 'login' | 'settings_changed' | 'role_changed' | 'exported';
export type AuditEntityType =
  | 'bookings' | 'properties' | 'contacts' | 'expenses'
  | 'owner' | 'staff_members' | 'contracts' | 'settings' | 'session';

export async function logAudit(
  action: AuditAction,
  entityType: AuditEntityType,
  entityId: string | null,
  entityName: string,
  changes?: { old?: Record<string, unknown>; new?: Record<string, unknown> },
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_logs').insert({
      user_id: user?.id ?? null,
      user_email: user?.email ?? 'unknown',
      action,
      entity_type: entityType,
      entity_id: entityId ?? undefined,
      entity_name: entityName,
      old_data: changes?.old ?? null,
      new_data: changes?.new ?? null,
    });
  } catch {
    // Audit failures are silent — never block the main action
  }
}
