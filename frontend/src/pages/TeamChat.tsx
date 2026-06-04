import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface TeamMessage {
    id: string;
    sender_user_id: string;
    body: string;
    message_type: 'chat' | 'system';
    created_at: string;
}

interface ProfileLite {
    user_id: string;
    full_name: string | null;
    email: string;
    role: string;
}

export default function TeamChat() {
    const { t } = useTranslation();
    const { user, accountId, profile } = useAuth();
    const [messages, setMessages] = useState<TeamMessage[]>([]);
    const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [sendError, setSendError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const loadProfiles = useCallback(async () => {
        if (!accountId) return;
        const { data: members } = await supabase
            .from('account_members')
            .select('user_id, role')
            .eq('account_id', accountId);
        const ids = (members || []).map(m => m.user_id);
        if (!ids.length) return;
        const { data: profs } = await supabase
            .from('profiles')
            .select('user_id, full_name, email, role')
            .in('user_id', ids);
        const map: Record<string, ProfileLite> = {};
        (profs || []).forEach(p => {
            map[p.user_id] = p as ProfileLite;
        });
        setProfiles(map);
    }, [accountId]);

    const loadMessages = useCallback(async () => {
        if (!accountId) return;
        const { data, error } = await supabase
            .from('team_messages')
            .select('id, sender_user_id, body, message_type, created_at')
            .eq('account_id', accountId)
            .order('created_at', { ascending: true })
            .limit(200);
        if (error) {
            console.error('team_messages load:', error);
            setLoadError(error.message);
            setMessages([]);
            return;
        }
        setLoadError(null);
        setMessages((data as TeamMessage[]) || []);
    }, [accountId]);

    useEffect(() => {
        if (!accountId) {
            setLoading(false);
            return;
        }
        void (async () => {
            setLoading(true);
            await Promise.all([loadProfiles(), loadMessages()]);
            setLoading(false);
        })();
    }, [accountId, loadProfiles, loadMessages]);

    useEffect(() => {
        if (!accountId) return;
        const channel = supabase
            .channel(`team-chat-${accountId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'team_messages',
                    filter: `account_id=eq.${accountId}`,
                },
                (payload) => {
                    const row = payload.new as TeamMessage;
                    setMessages(prev => {
                        if (prev.some(m => m.id === row.id)) return prev;
                        return [...prev, row];
                    });
                },
            )
            .subscribe();
        return () => {
            void supabase.removeChannel(channel);
        };
    }, [accountId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const senderLabel = (uid: string) => {
        const p = profiles[uid];
        if (!p) return t('teamChat.unknownUser');
        return p.full_name || p.email.split('@')[0];
    };

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || !user?.id || !accountId || sending) return;
        setSending(true);
        setSendError(null);
        setInput('');
        try {
            const { data, error } = await supabase
                .from('team_messages')
                .insert({
                    account_id: accountId,
                    sender_user_id: user.id,
                    body: text,
                    message_type: 'chat',
                })
                .select('id, sender_user_id, body, message_type, created_at')
                .single();

            if (error) {
                console.error('team_messages insert:', error);
                setSendError(error.message);
                setInput(text);
                return;
            }

            if (data) {
                const row = data as TeamMessage;
                setMessages(prev => (prev.some(m => m.id === row.id) ? prev : [...prev, row]));
            } else {
                await loadMessages();
            }
        } finally {
            setSending(false);
        }
    };

    if (!accountId) {
        return (
            <div className="p-8 text-slate-400">
                {t('teamChat.noAccount')}
            </div>
        );
    }

    return (
        <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
            <div className="mb-4">
                <h1 className="text-display flex items-center gap-2">
                    <MessageSquare className="h-7 w-7 text-primary" />
                    {t('teamChat.title')}
                </h1>
                <p className="text-subtitle mt-1">{t('teamChat.subtitle')}</p>
            </div>

            <div className="surface-card flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {Object.keys(profiles).length} {t('teamChat.membersOnline')}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                    {loadError ? (
                        <div className="text-center py-6 px-4">
                            <p className="text-red-400 text-sm">{t('teamChat.loadError')}</p>
                            <p className="text-slate-500 text-xs mt-2 font-mono break-all">{loadError}</p>
                            <p className="text-slate-500 text-xs mt-2">{t('teamChat.migrationHint')}</p>
                        </div>
                    ) : loading ? (
                        <p className="text-slate-500 text-sm text-center py-8">{t('common.loading')}</p>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-8 px-4">
                            <p className="text-slate-400 text-sm">{t('teamChat.empty')}</p>
                            <p className="text-slate-600 text-xs mt-2">{t('teamChat.emptyHint')}</p>
                        </div>
                    ) : (
                        messages.map(msg => {
                            const mine = msg.sender_user_id === user?.id;
                            const system = msg.message_type === 'system';
                            if (system) {
                                return (
                                    <p key={msg.id} className="text-center text-xs text-slate-500 px-4 py-1">
                                        {msg.body}
                                    </p>
                                );
                            }
                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                                        {!mine && (
                                            <span className="text-[10px] text-slate-500 mb-1 px-1">
                                                {senderLabel(msg.sender_user_id)}
                                            </span>
                                        )}
                                        <div
                                            className={`px-3.5 py-2.5 rounded-2xl text-sm ${
                                                mine
                                                    ? 'bg-primary text-primary-foreground rounded-br-md'
                                                    : 'rounded-bl-md border border-border bg-muted text-foreground'
                                            }`}
                                        >
                                            {msg.body}
                                        </div>
                                        <span className="text-[10px] text-slate-600 mt-0.5 px-1">
                                            {new Date(msg.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                {sendError ? (
                    <p className="px-4 py-2 text-xs text-red-400 border-t border-white/10">{sendError}</p>
                ) : null}
                <div className="p-3 border-t border-white/10 flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder={t('teamChat.placeholder')}
                        className="input-field flex-1"
                    />
                    <button
                        type="button"
                        onClick={sendMessage}
                        disabled={sending || !input.trim()}
                        className="btn-primary h-10 w-10 shrink-0 p-0"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </div>
            </div>
            {profile?.role === 'admin' || profile?.role === 'staff' ? (
                <p className="text-[10px] text-slate-600 mt-2">{t('teamChat.hintAssign')}</p>
            ) : null}
        </div>
    );
}
