import { supabase } from './supabase';
import { api, messagingApi } from '../api/client';

const TASK_TYPE_LABELS: Record<string, string> = {
    cleaning: 'Limpieza',
    maintenance: 'Mantenimiento',
    inspection: 'Inspección',
    laundry: 'Lavandería',
    other: 'Otra',
};

export interface TaskNotifyPayload {
    staffMember: {
        id: string;
        full_name: string;
        email: string | null;
        phone: string | null;
    };
    taskType: string;
    scheduledDate: string;
    propertyName: string;
    notes?: string | null;
    assignedByUserId?: string;
    assignedByName?: string;
    accountId?: string | null;
}

function taskTypeLabel(type: string): string {
    return TASK_TYPE_LABELS[type] || type;
}

function buildWhatsAppMessage(p: TaskNotifyPayload): string {
    const label = taskTypeLabel(p.taskType);
    const lines = [
        `*Triadak — Nueva tarea*`,
        `Hola ${p.staffMember.full_name},`,
        ``,
        `📋 ${label}`,
        `🏠 ${p.propertyName}`,
        `📅 ${p.scheduledDate}`,
    ];
    if (p.notes?.trim()) lines.push(`📝 ${p.notes.trim()}`);
    lines.push(``, `Entra en triadak.io → Portal trabajador → Mis tareas`);
    return lines.join('\n');
}

/** Email + WhatsApp + notificación in-app + mensaje de sistema en el chat del equipo. */
export async function notifyTaskAssigned(payload: TaskNotifyPayload): Promise<{
    email: boolean;
    whatsapp: boolean;
    notification: boolean;
    chat: boolean;
}> {
    const result = { email: false, whatsapp: false, notification: false, chat: false };
    const portalUrl = `${window.location.origin}/worker/tasks`;
    const typeLabel = taskTypeLabel(payload.taskType);

    if (payload.staffMember.email) {
        try {
            const res = await api.post('/emails/task-assigned', {
                to: payload.staffMember.email,
                staffName: payload.staffMember.full_name,
                taskType: typeLabel,
                propertyName: payload.propertyName,
                scheduledDate: payload.scheduledDate,
                notes: payload.notes,
                portalUrl,
            });
            result.email = !!res.data?.success;
        } catch (e) {
            console.warn('Task email failed', e);
        }
    }

    const phone = payload.staffMember.phone?.replace(/\s/g, '');
    if (phone && phone.length >= 8) {
        try {
            const wa = await messagingApi.sendDirect({
                phone,
                message: buildWhatsAppMessage(payload),
                channel: 'whatsapp',
                sentBy: payload.assignedByUserId,
            });
            const st = wa.data?.status;
            result.whatsapp = st === 'sent' || st === 'delivered' || st === 'queued';
        } catch (e) {
            console.warn('Task WhatsApp failed', e);
        }
    }

    if (payload.staffMember.email) {
        const { data: prof } = await supabase
            .from('profiles')
            .select('user_id')
            .ilike('email', payload.staffMember.email.trim())
            .maybeSingle();

        if (prof?.user_id) {
            const { error } = await supabase.from('notifications').insert({
                user_id: prof.user_id,
                type: 'task_assigned',
                title: `Nueva tarea: ${typeLabel}`,
                message: `${payload.propertyName} · ${payload.scheduledDate}`,
                read: false,
                metadata: {
                    staff_member_id: payload.staffMember.id,
                    task_type: payload.taskType,
                    property_name: payload.propertyName,
                },
            });
            result.notification = !error;
        }
    }

    if (payload.accountId && payload.assignedByUserId) {
        const who = payload.assignedByName || 'Admin';
        const { error } = await supabase.from('team_messages').insert({
            account_id: payload.accountId,
            sender_user_id: payload.assignedByUserId,
            body: `📋 ${who} asignó a ${payload.staffMember.full_name}: ${typeLabel} en ${payload.propertyName} (${payload.scheduledDate})`,
            message_type: 'system',
        });
        result.chat = !error;
    }

    return result;
}
