import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    User, Mail, Shield, Bell, Globe,
    Save, Camera, Check, AlertTriangle, Trash2,
    Users, Crown, UserCog, Eye, Send, Plus, X, Clock,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────
interface ProfileForm {
    full_name: string;
    email: string;
    phone: string;
    company: string;
    timezone: string;
    language: string;
    currency: string;
    theme: 'light' | 'dark' | 'system';
    notifications_email: boolean;
    notifications_bookings: boolean;
    notifications_payments: boolean;
    notifications_reminders: boolean;
    reminder_checkin_hours: number;
    reminder_checkout_hours: number;
    reminder_daily_digest: boolean;
}

type TabId = 'profile' | 'preferences' | 'notifications' | 'team' | 'danger';

const TAB_ICONS: Record<TabId, React.ElementType> = { profile: User, preferences: Globe, notifications: Bell, team: Users, danger: AlertTriangle };

const TIMEZONES = [
    'Europe/Madrid', 'Europe/London', 'Europe/Berlin', 'Europe/Paris',
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Mexico_City', 'America/Bogota', 'America/Sao_Paulo',
    'Asia/Dubai', 'Asia/Tokyo', 'Pacific/Auckland',
];

const LANGUAGES = [
    { code: 'en' as const },
    { code: 'de' as const },
    { code: 'es' as const },
    { code: 'fr' as const },
];

const CURRENCIES = [
    { code: 'EUR', symbol: '€', label: 'Euro (€)' },
    { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
    { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
    { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc (CHF)' },
    { code: 'MXN', symbol: '$', label: 'Mexican Peso (MXN)' },
];

// ─── Main Settings Component ─────────────────────────
// ─── Role config ──────────────────────────────────────
const ROLE_CONFIG: Record<UserRole, { icon: React.ElementType; color: string; bg: string }> = {
    admin: { icon: Crown, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    staff: { icon: UserCog, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    owner: { icon: Eye, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
};

interface TeamMember {
    id: string;
    user_id: string;
    email: string;
    full_name: string | null;
    role: UserRole;
    created_at: string;
}

export default function Settings() {
    const { t, i18n } = useTranslation();
    const { user, profile, refreshProfile, signOut, isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState<TabId>('profile');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Team state
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loadingTeam, setLoadingTeam] = useState(false);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<UserRole>('staff');
    const [inviting, setInviting] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState(false);

    // Only show team tab for admins
    const TAB_IDS: TabId[] = isAdmin
        ? ['profile', 'preferences', 'notifications', 'team', 'danger']
        : ['profile', 'preferences', 'notifications', 'danger'];

    const [form, setForm] = useState<ProfileForm>({
        full_name: '',
        email: '',
        phone: '',
        company: '',
        timezone: 'Europe/Madrid',
        language: 'es',
        currency: 'EUR',
        theme: 'dark',
        notifications_email: true,
        notifications_bookings: true,
        notifications_payments: true,
        notifications_reminders: true,
        reminder_checkin_hours: 24,
        reminder_checkout_hours: 12,
        reminder_daily_digest: false,
    });

    // ─── Team Functions ──────────────────────────────────
    const fetchTeam = async () => {
        setLoadingTeam(true);
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, user_id, email, full_name, role, created_at')
                .order('created_at', { ascending: true });
            setTeamMembers((data as TeamMember[]) || []);
        } catch (err) {
            console.error('Error fetching team:', err);
        } finally {
            setLoadingTeam(false);
        }
    };

    const changeRole = async (memberId: string, newRole: UserRole) => {
        try {
            await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', memberId);
            setTeamMembers(prev =>
                prev.map(m => m.id === memberId ? { ...m, role: newRole } : m)
            );
        } catch (err) {
            console.error('Error changing role:', err);
        }
    };

    const removeMember = async (memberId: string, memberUserId: string) => {
        if (memberUserId === user?.id) return; // Can't remove yourself
        if (!confirm(t('settings.team.confirmRemove'))) return;
        try {
            await supabase.from('profiles').delete().eq('id', memberId);
            setTeamMembers(prev => prev.filter(m => m.id !== memberId));
        } catch (err) {
            console.error('Error removing member:', err);
        }
    };

    const inviteMember = async () => {
        if (!inviteEmail.trim()) return;
        setInviting(true);
        setInviteSuccess(false);

        try {
            // Check if user already exists in profiles
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', inviteEmail.trim())
                .maybeSingle();

            if (existing) {
                // User already registered, just update role
                await supabase
                    .from('profiles')
                    .update({ role: inviteRole })
                    .eq('email', inviteEmail.trim());
                await fetchTeam();
            } else {
                // Create a pre-registration entry so when they sign up, the role is ready
                // For now we use Supabase Auth admin invite (sends magic link)
                const { error } = await supabase.auth.signInWithOtp({
                    email: inviteEmail.trim(),
                    options: {
                        shouldCreateUser: true,
                        data: { invited_role: inviteRole },
                    },
                });
                if (error) throw error;
            }

            setInviteSuccess(true);
            setInviteEmail('');
            setTimeout(() => {
                setInviteSuccess(false);
                setShowInviteForm(false);
            }, 3000);
        } catch (err) {
            console.error('Error inviting member:', err);
            alert(t('settings.team.inviteError'));
        } finally {
            setInviting(false);
        }
    };

    // Load team when tab is active
    useEffect(() => {
        if (activeTab === 'team' && isAdmin && teamMembers.length === 0) {
            fetchTeam();
        }
    }, [activeTab]);

    // Load profile data
    useEffect(() => {
        if (profile) {
            setForm(prev => ({
                ...prev,
                full_name: profile.full_name || '',
                email: profile.email || user?.email || '',
            }));
        }

        // Load saved settings from localStorage
        const savedSettings = localStorage.getItem('triadak_settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setForm(prev => ({ ...prev, ...parsed }));
                if (parsed.language) i18n.changeLanguage(parsed.language);
            } catch { /* ignore */ }
        }

        // Load avatar
        if (user) {
            loadAvatar(user.id);
        }
    }, [profile, user]);

    const loadAvatar = async (userId: string) => {
        // First check localStorage for saved avatar path
        const savedPath = localStorage.getItem(`triadak_avatar_${userId}`);
        if (savedPath) {
            const { data } = supabase.storage.from('property-images').getPublicUrl(savedPath);
            try {
                const res = await fetch(data.publicUrl, { method: 'HEAD' });
                if (res.ok) {
                    setAvatarUrl(data.publicUrl + '?t=' + Date.now());
                    return;
                }
            } catch { /* try fallback */ }
        }

        // Fallback: try listing files in the avatar folder
        try {
            const { data: files } = await supabase.storage
                .from('property-images')
                .list(`avatars/${userId}`, { limit: 1 });

            if (files && files.length > 0) {
                const filePath = `avatars/${userId}/${files[0].name}`;
                localStorage.setItem(`triadak_avatar_${userId}`, filePath);
                const { data } = supabase.storage.from('property-images').getPublicUrl(filePath);
                setAvatarUrl(data.publicUrl + '?t=' + Date.now());
            }
        } catch { /* no avatar */ }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.size > 2 * 1024 * 1024) {
            alert(t('settings.alerts.avatarSize'));
            return;
        }
        if (!file.type.startsWith('image/')) {
            alert(t('settings.alerts.avatarInvalid'));
            return;
        }

        setUploadingAvatar(true);
        try {
            const ext = file.name.split('.').pop() || 'png';
            const path = `avatars/${user.id}/avatar.${ext}`;

            const { error } = await supabase.storage
                .from('property-images')
                .upload(path, file, { upsert: true, contentType: file.type });

            if (error) throw error;

            // Save path for future loads
            localStorage.setItem(`triadak_avatar_${user.id}`, path);

            const { data } = supabase.storage.from('property-images').getPublicUrl(path);
            setAvatarUrl(data.publicUrl + '?t=' + Date.now());
        } catch (err: any) {
            console.error('Error uploading avatar:', err);
            alert(t('settings.alerts.avatarError', { message: err.message || 'Unknown error' }));
        } finally {
            setUploadingAvatar(false);
        }
    };

    const updateField = (field: keyof ProfileForm, value: string | boolean) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setSaved(false);
        if (field === 'language') i18n.changeLanguage(value as string);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save profile data to Supabase
            if (user) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        full_name: form.full_name,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', user.id);

                if (error) console.error('Error saving profile:', error);
            }

            // Save settings to localStorage
            const settingsToSave = {
                phone: form.phone,
                company: form.company,
                timezone: form.timezone,
                language: form.language,
                currency: form.currency,
                theme: form.theme,
                notifications_email: form.notifications_email,
                notifications_bookings: form.notifications_bookings,
                notifications_payments: form.notifications_payments,
                notifications_reminders: form.notifications_reminders,
                reminder_checkin_hours: form.reminder_checkin_hours,
                reminder_checkout_hours: form.reminder_checkout_hours,
                reminder_daily_digest: form.reminder_daily_digest,
            };
            localStorage.setItem('triadak_settings', JSON.stringify(settingsToSave));

            await refreshProfile();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            '⚠️ ' + t('settings.alerts.deleteConfirm')
        );
        if (confirmed) {
            const doubleConfirm = window.confirm(
                t('settings.alerts.deleteDoubleConfirm')
            );
            if (doubleConfirm) {
                await signOut();
            }
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <header>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-1"
                    >
                        {t('settings.title')}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 text-sm sm:text-base"
                    >
                        {t('settings.subtitle')}
                    </motion.p>
                </header>

                {/* Tabs */}
                <div className="flex gap-1 bg-white/5 rounded-xl p-1 overflow-x-auto">
                    {TAB_IDS.map(id => {
                        const Icon = TAB_ICONS[id];
                        const labelKey = id === 'danger' ? 'settings.tabs.dangerZone' : `settings.tabs.${id}`;
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                                    activeTab === id
                                        ? 'bg-white/10 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                } ${id === 'danger' ? 'text-red-400' : ''}`}
                            >
                                <Icon className={`h-4 w-4 ${id === 'danger' && activeTab !== id ? 'text-red-400/60' : ''}`} />
                                <span className="hidden sm:inline">{t(labelKey)}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            {/* Avatar Section */}
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Camera className="h-5 w-5 text-indigo-400" />
                                    {t('settings.profile.photoTitle')}
                                </h3>
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-2xl font-bold text-white">
                                                    {form.full_name?.charAt(0)?.toUpperCase() || form.email?.charAt(0)?.toUpperCase() || 'U'}
                                                </span>
                                            )}
                                        </div>
                                        <label className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-500 rounded-lg cursor-pointer hover:bg-indigo-400 transition-colors">
                                            <Camera className="h-3.5 w-3.5 text-white" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleAvatarUpload}
                                                disabled={uploadingAvatar}
                                            />
                                        </label>
                                    </div>
                                    <div>
                                        <p className="text-sm text-white font-medium">{t('settings.profile.uploadPhoto')}</p>
                                        <p className="text-xs text-slate-500 mt-1">{t('settings.profile.uploadHint')}</p>
                                        {uploadingAvatar && <p className="text-xs text-indigo-400 mt-1 animate-pulse">{t('settings.profile.uploading')}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Personal Info */}
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <User className="h-5 w-5 text-indigo-400" />
                                    {t('settings.profile.personalInfo')}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('settings.profile.fullName')}</label>
                                        <input
                                            type="text"
                                            value={form.full_name}
                                            onChange={e => updateField('full_name', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                            placeholder={t('settings.profile.fullNamePlaceholder')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('settings.profile.email')}</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="email"
                                                value={form.email}
                                                disabled
                                                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-500 text-sm cursor-not-allowed"
                                            />
                                            <Mail className="h-4 w-4 text-slate-600 flex-shrink-0" />
                                        </div>
                                        <p className="text-[10px] text-slate-600 mt-1">{t('settings.profile.emailHint')}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('settings.profile.phone')}</label>
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={e => updateField('phone', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                            placeholder={t('settings.profile.phonePlaceholder')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('settings.profile.company')}</label>
                                        <input
                                            type="text"
                                            value={form.company}
                                            onChange={e => updateField('company', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                            placeholder={t('settings.profile.companyPlaceholder')}
                                        />
                                    </div>
                                </div>

                                {/* Role Badge */}
                                <div className="mt-4 flex items-center gap-3">
                                    <Shield className="h-4 w-4 text-slate-500" />
                                    <span className="text-xs text-slate-400">{t('settings.profile.role')}</span>
                                    <span className={`text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                                        profile?.role === 'admin'
                                            ? 'bg-amber-500/20 text-amber-400'
                                            : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                        {profile?.role || 'owner'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="space-y-6">
                            {/* Regional */}
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-indigo-400" />
                                    {t('settings.preferences.regional')}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('settings.preferences.language')}</label>
                                        <select
                                            value={form.language}
                                            onChange={e => updateField('language', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
                                        >
                                            {LANGUAGES.map(l => (
                                                <option key={l.code} value={l.code} className="bg-slate-800">{t(`settings.languages.${l.code}`)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('settings.preferences.currency')}</label>
                                        <select
                                            value={form.currency}
                                            onChange={e => updateField('currency', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
                                        >
                                            {CURRENCIES.map(c => (
                                                <option key={c.code} value={c.code} className="bg-slate-800">{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('settings.preferences.timezone')}</label>
                                        <select
                                            value={form.timezone}
                                            onChange={e => updateField('timezone', e.target.value)}
                                            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
                                        >
                                            {TIMEZONES.map(tz => (
                                                <option key={tz} value={tz} className="bg-slate-800">{tz}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            {/* Notification Toggles */}
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-indigo-400" />
                                    {t('settings.notifications.title')}
                                </h3>
                                <p className="text-xs text-slate-500 mb-6">{t('settings.notifications.subtitle')}</p>

                                <div className="space-y-4">
                                    {[
                                        { key: 'notifications_email' as const, titleKey: 'settings.notifications.email', descKey: 'settings.notifications.emailDesc' },
                                        { key: 'notifications_bookings' as const, titleKey: 'settings.notifications.bookings', descKey: 'settings.notifications.bookingsDesc' },
                                        { key: 'notifications_payments' as const, titleKey: 'settings.notifications.payments', descKey: 'settings.notifications.paymentsDesc' },
                                        { key: 'notifications_reminders' as const, titleKey: 'settings.notifications.reminders', descKey: 'settings.notifications.remindersDesc' },
                                        { key: 'reminder_daily_digest' as const, titleKey: 'settings.notifications.dailyDigest', descKey: 'settings.notifications.dailyDigestDesc' },
                                    ].map(notif => (
                                        <div
                                            key={notif.key}
                                            className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-white">{t(notif.titleKey)}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{t(notif.descKey)}</p>
                                            </div>
                                            <button
                                                onClick={() => updateField(notif.key, !form[notif.key])}
                                                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                                                    form[notif.key] ? 'bg-indigo-500' : 'bg-white/10'
                                                }`}
                                            >
                                                <motion.div
                                                    animate={{ x: form[notif.key] ? 20 : 2 }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reminder Timing Configuration */}
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-amber-400" />
                                    {t('settings.notifications.reminderTiming')}
                                </h3>
                                <p className="text-xs text-slate-500 mb-6">{t('settings.notifications.reminderTimingDesc')}</p>

                                <div className="space-y-4">
                                    {/* Check-in reminder hours */}
                                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="text-sm font-medium text-white">{t('settings.notifications.checkinReminder')}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{t('settings.notifications.checkinReminderDesc')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {[6, 12, 24, 48].map(hours => (
                                                <button
                                                    key={hours}
                                                    onClick={() => updateField('reminder_checkin_hours', hours)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                        form.reminder_checkin_hours === hours
                                                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                                    }`}
                                                >
                                                    {hours}h
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Check-out reminder hours */}
                                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="text-sm font-medium text-white">{t('settings.notifications.checkoutReminder')}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{t('settings.notifications.checkoutReminderDesc')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {[6, 12, 24, 48].map(hours => (
                                                <button
                                                    key={hours}
                                                    onClick={() => updateField('reminder_checkout_hours', hours)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                        form.reminder_checkout_hours === hours
                                                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                                                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                                    }`}
                                                >
                                                    {hours}h
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cron / Edge Function Info */}
                            <div className="bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-500/10 rounded-2xl p-6">
                                <h3 className="text-sm font-semibold text-indigo-400 mb-2">{t('settings.notifications.automationTitle')}</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {t('settings.notifications.automationDesc')}
                                </p>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="bg-white/5 rounded-xl p-3 text-center">
                                        <p className="text-lg font-bold text-indigo-400">24h</p>
                                        <p className="text-[10px] text-slate-500">{t('settings.notifications.beforeCheckin')}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 text-center">
                                        <p className="text-lg font-bold text-purple-400">12h</p>
                                        <p className="text-[10px] text-slate-500">{t('settings.notifications.beforeCheckout')}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 text-center">
                                        <p className="text-lg font-bold text-emerald-400">08:00</p>
                                        <p className="text-[10px] text-slate-500">{t('settings.notifications.dailyDigestTime')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'team' && isAdmin && (
                        <div className="space-y-6">
                            {/* Role Legend */}
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-indigo-400" />
                                    {t('settings.team.rolesTitle')}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {(['admin', 'staff', 'owner'] as UserRole[]).map(role => {
                                        const cfg = ROLE_CONFIG[role];
                                        const RoleIcon = cfg.icon;
                                        return (
                                            <div key={role} className={`flex items-center gap-3 p-3 rounded-xl ${cfg.bg} border border-white/5`}>
                                                <RoleIcon className={`h-5 w-5 ${cfg.color}`} />
                                                <div>
                                                    <p className={`text-sm font-semibold ${cfg.color}`}>{t(`settings.team.role.${role}`)}</p>
                                                    <p className="text-[10px] text-slate-400">{t(`settings.team.roleDesc.${role}`)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Team Members List */}
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <Users className="h-5 w-5 text-indigo-400" />
                                        {t('settings.team.membersTitle')}
                                        <span className="text-sm text-slate-500 font-normal">({teamMembers.length})</span>
                                    </h3>
                                    <button
                                        onClick={() => setShowInviteForm(!showInviteForm)}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-xl text-sm font-medium hover:bg-indigo-500/30 transition-colors"
                                    >
                                        {showInviteForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                        {showInviteForm ? t('common.cancel') : t('settings.team.invite')}
                                    </button>
                                </div>

                                {/* Invite Form */}
                                {showInviteForm && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mb-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20"
                                    >
                                        <p className="text-sm text-white font-medium mb-3 flex items-center gap-2">
                                            <Send className="h-4 w-4 text-indigo-400" />
                                            {t('settings.team.inviteTitle')}
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="flex-1">
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                                    <input
                                                        type="email"
                                                        value={inviteEmail}
                                                        onChange={e => setInviteEmail(e.target.value)}
                                                        placeholder={t('settings.team.emailPlaceholder')}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                    />
                                                </div>
                                            </div>
                                            <select
                                                value={inviteRole}
                                                onChange={e => setInviteRole(e.target.value as UserRole)}
                                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
                                            >
                                                <option value="staff" className="bg-slate-900">Staff</option>
                                                <option value="admin" className="bg-slate-900">Admin</option>
                                                <option value="owner" className="bg-slate-900">Owner</option>
                                            </select>
                                            <button
                                                onClick={inviteMember}
                                                disabled={inviting || !inviteEmail.trim()}
                                                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
                                            >
                                                {inviting ? (
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                ) : (
                                                    <Send className="h-4 w-4" />
                                                )}
                                                {t('settings.team.sendInvite')}
                                            </button>
                                        </div>
                                        {inviteSuccess && (
                                            <p className="mt-3 text-sm text-emerald-400 flex items-center gap-2">
                                                <Check className="h-4 w-4" />
                                                {t('settings.team.inviteSent')}
                                            </p>
                                        )}
                                        <p className="mt-2 text-[10px] text-slate-600">{t('settings.team.inviteHint')}</p>
                                    </motion.div>
                                )}

                                {loadingTeam ? (
                                    <div className="flex justify-center py-8">
                                        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {teamMembers.map(member => {
                                            const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.staff;
                                            const RoleIcon = cfg.icon;
                                            const isMe = member.user_id === user?.id;

                                            return (
                                                <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-10 w-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                                                            <RoleIcon className={`h-5 w-5 ${cfg.color}`} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-white">
                                                                    {member.full_name || member.email.split('@')[0]}
                                                                </p>
                                                                {isMe && (
                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">{t('settings.team.you')}</span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-500">{member.email}</p>
                                                            <p className="text-[10px] text-slate-600">
                                                                {t('settings.team.joined')}: {new Date(member.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {!isMe ? (
                                                            <>
                                                                <select
                                                                    value={member.role}
                                                                    onChange={e => changeRole(member.id, e.target.value as UserRole)}
                                                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
                                                                >
                                                                    <option value="admin" className="bg-slate-900">Admin</option>
                                                                    <option value="staff" className="bg-slate-900">Staff</option>
                                                                    <option value="owner" className="bg-slate-900">Owner</option>
                                                                </select>
                                                                <button
                                                                    onClick={() => removeMember(member.id, member.user_id)}
                                                                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                                                                    title={t('settings.team.remove')}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                                                                {t(`settings.team.role.${member.role}`)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* How it works */}
                            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6">
                                <h3 className="text-sm font-semibold text-indigo-400 mb-3">{t('settings.team.howItWorks')}</h3>
                                <ul className="space-y-2 text-xs text-slate-400">
                                    <li className="flex items-start gap-2">
                                        <Crown className="h-3.5 w-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                                        {t('settings.team.howAdmin')}
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <UserCog className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                                        {t('settings.team.howStaff')}
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Eye className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        {t('settings.team.howOwner')}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'danger' && (
                        <div className="space-y-6">
                            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    {t('settings.danger.title')}
                                </h3>
                                <p className="text-xs text-slate-500 mb-6">
                                    {t('settings.danger.warning')}
                                </p>

                                <div className="space-y-4">
                                    {/* Change Password */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-white/5">
                                        <div>
                                            <p className="text-sm font-medium text-white">{t('settings.danger.changePassword')}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{t('settings.danger.changePasswordDesc')}</p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (user?.email) {
                                                    await supabase.auth.resetPasswordForEmail(user.email);
                                                    alert(t('settings.alerts.passwordResetSent'));
                                                }
                                            }}
                                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
                                        >
                                            {t('settings.danger.sendResetEmail')}
                                        </button>
                                    </div>

                                    {/* Delete Account */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                                        <div>
                                            <p className="text-sm font-medium text-red-400">{t('settings.danger.deleteAccount')}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{t('settings.danger.deleteAccountDesc')}</p>
                                        </div>
                                        <button
                                            onClick={handleDeleteAccount}
                                            className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            {t('settings.danger.deleteAccount')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Save Button - Sticky Bottom */}
                {activeTab !== 'danger' && activeTab !== 'team' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="sticky bottom-4 bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between"
                    >
                        <p className="text-xs text-slate-500">
                            {saved ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                    <Check className="h-3.5 w-3.5" /> {t('settings.save.success')}
                                </span>
                            ) : (
                                t('settings.save.reminder')
                            )}
                        </p>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2"
                        >
                            {saving ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {saving ? t('common.saving') : t('settings.save.button')}
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
