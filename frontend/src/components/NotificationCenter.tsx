import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, X, CheckCheck, Trash2,
    Calendar, DollarSign, Info,
    LogIn, LogOut as LogOutIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    metadata: Record<string, any>;
    created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    booking_new: { icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    booking_updated: { icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    booking_cancelled: { icon: Calendar, color: 'text-red-400', bg: 'bg-red-500/10' },
    payment: { icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    checkin_reminder: { icon: LogIn, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    checkout_reminder: { icon: LogOutIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    system: { icon: Info, color: 'text-slate-400', bg: 'bg-slate-500/10' },
};

function timeAgo(date: string): string {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString();
}

export default function NotificationCenter() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Fetch notifications
    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error fetching notifications:', error);
                return;
            }
            setNotifications(data || []);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch + subscribe to realtime
    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        // Subscribe to new notifications in realtime
        const channel = supabase
            .channel('notifications-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    setNotifications(prev => [payload.new as Notification, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    // Mark single as read
    const markAsRead = async (id: string) => {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    // Mark all as read
    const markAllAsRead = async () => {
        if (!user) return;
        await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    // Delete single
    const deleteNotification = async (id: string) => {
        await supabase.from('notifications').delete().eq('id', id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Clear all
    const clearAll = async () => {
        if (!user) return;
        await supabase.from('notifications').delete().eq('user_id', user.id);
        setNotifications([]);
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
                className="relative p-2 text-slate-400 hover:text-white transition-colors"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 min-w-[18px] flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 bottom-full mb-2 w-[340px] sm:w-[380px] max-h-[70vh] bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-[100] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full font-medium">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="p-1.5 text-slate-500 hover:text-indigo-400 transition-colors rounded-lg hover:bg-white/5"
                                        title="Mark all as read"
                                    >
                                        <CheckCheck className="h-4 w-4" />
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                                        title="Clear all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-1.5 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto">
                            {loading && notifications.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    <div className="p-3 bg-white/5 rounded-2xl mb-3">
                                        <Bell className="h-6 w-6 text-slate-600" />
                                    </div>
                                    <p className="text-sm text-slate-500">No notifications yet</p>
                                    <p className="text-xs text-slate-600 mt-1">
                                        You'll see booking alerts, reminders, and updates here
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {notifications.map((notif) => {
                                        const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
                                        const Icon = config.icon;

                                        return (
                                            <motion.div
                                                key={notif.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`group flex gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer ${
                                                    !notif.read ? 'bg-indigo-500/[0.03]' : ''
                                                }`}
                                                onClick={() => !notif.read && markAsRead(notif.id)}
                                            >
                                                <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0 h-fit mt-0.5`}>
                                                    <Icon className={`h-4 w-4 ${config.color}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={`text-sm font-medium truncate ${!notif.read ? 'text-white' : 'text-slate-300'}`}>
                                                            {notif.title}
                                                        </p>
                                                        {!notif.read && (
                                                            <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                                    <p className="text-[10px] text-slate-600 mt-1">{timeAgo(notif.created_at)}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                                    className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="border-t border-white/5 px-4 py-2.5">
                                <p className="text-[10px] text-slate-600 text-center">
                                    Showing last {notifications.length} notifications
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
