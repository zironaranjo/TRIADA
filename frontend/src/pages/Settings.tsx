import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    User, Mail, Shield, Bell, Globe,
    Save, Camera, Check, AlertTriangle, Trash2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
}

type TabId = 'profile' | 'preferences' | 'notifications' | 'danger';

const TAB_IDS: TabId[] = ['profile', 'preferences', 'notifications', 'danger'];
const TAB_ICONS: Record<TabId, React.ElementType> = { profile: User, preferences: Globe, notifications: Bell, danger: AlertTriangle };

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
export default function Settings() {
    const { t, i18n } = useTranslation();
    const { user, profile, refreshProfile, signOut } = useAuth();
    const [activeTab, setActiveTab] = useState<TabId>('profile');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
    });

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
                {activeTab !== 'danger' && (
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
