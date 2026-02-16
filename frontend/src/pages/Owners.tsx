import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ownersApi } from "@/api/client";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import {
    Plus, Search, Mail, Phone, Building,
    User, Wallet, X, Eye, DollarSign, Home,
    CalendarDays, TrendingUp, ExternalLink, Camera,
} from "lucide-react";

interface Owner {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    properties?: any[];
    avatar_url?: string | null;
}

interface OwnerDetailData {
    properties: { id: string; name: string; status: string; price_per_night: number }[];
    totalRevenue: number;
    monthRevenue: number;
    bookingsCount: number;
    pendingPayouts: number;
}

export default function Owners() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [owners, setOwners] = useState<Owner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
    const [detailData, setDetailData] = useState<OwnerDetailData | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadOwners();
    }, []);

    const loadOwners = async () => {
        try {
            const { data } = await ownersApi.getAll();
            const ownersData: Owner[] = data || [];
            // Load avatar URLs from Supabase owner table
            const ownerIds = ownersData.map((o: Owner) => o.id);
            if (ownerIds.length > 0) {
                const { data: avatars } = await supabase
                    .from('owner')
                    .select('id, avatar_url')
                    .in('id', ownerIds);
                if (avatars) {
                    const avatarMap = new Map(avatars.map(a => [a.id, a.avatar_url]));
                    ownersData.forEach(o => { o.avatar_url = avatarMap.get(o.id) || null; });
                }
            }
            setOwners(ownersData);
        } catch (error) {
            console.error("Failed to load owners", error);
        } finally {
            setLoading(false);
        }
    };

    const openOwnerDetail = async (owner: Owner) => {
        setSelectedOwner(owner);
        setDetailLoading(true);
        setDetailData(null);
        try {
            const { data: props } = await supabase
                .from('properties')
                .select('id, name, status, price_per_night')
                .eq('owner_id', owner.id);

            const propertyIds = (props || []).map(p => p.id);
            let totalRevenue = 0;
            let monthRevenue = 0;
            let bookingsCount = 0;

            if (propertyIds.length > 0) {
                const now = new Date();
                const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

                const { data: bookings } = await supabase
                    .from('bookings')
                    .select('total_price, start_date')
                    .in('property_id', propertyIds)
                    .in('status', ['confirmed', 'completed', 'checked_in']);

                (bookings || []).forEach(b => {
                    const price = Number(b.total_price || 0);
                    totalRevenue += price;
                    bookingsCount++;
                    if (b.start_date >= monthStart) monthRevenue += price;
                });
            }

            setDetailData({
                properties: props || [],
                totalRevenue,
                monthRevenue,
                bookingsCount,
                pendingPayouts: totalRevenue * 0.77,
            });
        } catch (error) {
            console.error('Error loading owner detail:', error);
        } finally {
            setDetailLoading(false);
        }
    };

    const filteredOwners = owners.filter(o => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return `${o.firstName} ${o.lastName}`.toLowerCase().includes(q) || o.email.toLowerCase().includes(q);
    });

    const totalProperties = owners.reduce((sum, o) => sum + (o.properties?.length || 0), 0);

    return (
        <div className="text-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1"
                        >
                            {t('owners.title')}
                        </motion.h1>
                        <p className="text-slate-400">{t('owners.subtitle')}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('owners.searchPlaceholder')}
                                className="bg-slate-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary w-64 text-white placeholder:text-slate-600"
                            />
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            <Plus className="h-5 w-5" />
                            {t('owners.addOwner')}
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatsCard title={t('owners.statTotalOwners')} value={owners.length.toString()} icon={<User className="h-5 w-5" />} trend={t('owners.trendThisMonth')} />
                    <StatsCard title={t('owners.statPendingPayouts')} value="€12,450" icon={<Wallet className="h-5 w-5 text-amber-400" />} trend={t('owners.trendDueIn')} />
                    <StatsCard title={t('owners.statPropertiesManaged')} value={String(totalProperties)} icon={<Building className="h-5 w-5 text-emerald-400" />} trend={t('owners.trendNew')} />
                </div>

                {/* Owners List */}
                <GlassCard className="p-0 overflow-hidden min-h-[400px]">
                    <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-white">{t('owners.allOwners')}</h3>
                        <span className="text-sm text-slate-500">{filteredOwners.length} {t('owners.properties').toLowerCase()}</span>
                    </div>

                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                        </div>
                    ) : filteredOwners.length > 0 ? (
                        <div className="divide-y divide-white/5">
                            {filteredOwners.map((owner) => (
                                <motion.div
                                    key={owner.id}
                                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
                                    onClick={() => openOwnerDetail(owner)}
                                    className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg overflow-hidden">
                                            {owner.avatar_url ? (
                                                <img src={owner.avatar_url} alt={owner.firstName} className="h-full w-full object-cover" />
                                            ) : (
                                                <>{owner.firstName[0]}{owner.lastName[0]}</>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white group-hover:text-indigo-400 transition-colors">
                                                {owner.firstName} {owner.lastName}
                                            </h4>
                                            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {owner.email}
                                                </span>
                                                {owner.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" /> {owner.phone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-xs text-slate-500 uppercase font-medium">{t('owners.properties')}</p>
                                            <p className="text-sm font-bold text-white">{owner.properties?.length || 0}</p>
                                        </div>
                                        <Eye className="h-4 w-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center flex flex-col items-center">
                            <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <User className="h-8 w-8 text-slate-500" />
                            </div>
                            <h3 className="text-lg font-medium text-white">{t('owners.emptyTitle')}</h3>
                            <p className="text-slate-400 mt-2 mb-6 max-w-sm">
                                {t('owners.emptyDescription')}
                            </p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold"
                            >
                                {t('owners.createOwner')}
                            </button>
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* Owner Detail Modal */}
            <AnimatePresence>
                {selectedOwner && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedOwner(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg bg-[#1e293b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg overflow-hidden ring-2 ring-white/10">
                                            {selectedOwner.avatar_url
                                                ? <img src={selectedOwner.avatar_url} alt={selectedOwner.firstName} className="h-full w-full object-cover" />
                                                : <>{selectedOwner.firstName[0]}{selectedOwner.lastName[0]}</>}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">{selectedOwner.firstName} {selectedOwner.lastName}</h2>
                                            <p className="text-sm text-slate-400">{selectedOwner.email}</p>
                                            {selectedOwner.phone && <p className="text-xs text-slate-500">{selectedOwner.phone}</p>}
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedOwner(null)} className="text-slate-400 hover:text-white transition-colors">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {detailLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                                    </div>
                                ) : detailData ? (
                                    <>
                                        {/* KPIs */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Home className="h-4 w-4 text-indigo-400" />
                                                    <span className="text-[10px] text-slate-500 uppercase">{t('owners.detailProperties')}</span>
                                                </div>
                                                <p className="text-lg font-bold text-white">{detailData.properties.length}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <DollarSign className="h-4 w-4 text-emerald-400" />
                                                    <span className="text-[10px] text-slate-500 uppercase">{t('owners.detailRevenue')}</span>
                                                </div>
                                                <p className="text-lg font-bold text-emerald-400">€{detailData.totalRevenue.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CalendarDays className="h-4 w-4 text-blue-400" />
                                                    <span className="text-[10px] text-slate-500 uppercase">{t('owners.detailBookings')}</span>
                                                </div>
                                                <p className="text-lg font-bold text-white">{detailData.bookingsCount}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <TrendingUp className="h-4 w-4 text-amber-400" />
                                                    <span className="text-[10px] text-slate-500 uppercase">{t('owners.detailThisMonth')}</span>
                                                </div>
                                                <p className="text-lg font-bold text-amber-400">€{detailData.monthRevenue.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {/* Properties List */}
                                        {detailData.properties.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('owners.detailPropertyList')}</h4>
                                                <div className="space-y-2">
                                                    {detailData.properties.map(p => (
                                                        <div key={p.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
                                                            <div className="flex items-center gap-3">
                                                                <Building className="h-4 w-4 text-slate-500" />
                                                                <div>
                                                                    <p className="text-sm font-medium text-white">{p.name}</p>
                                                                    <p className="text-[10px] text-slate-500">€{p.price_per_night}/night</p>
                                                                </div>
                                                            </div>
                                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                                                {p.status}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : null}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-white/10 flex items-center justify-between">
                                <button onClick={() => setSelectedOwner(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                                    {t('common.close')}
                                </button>
                                <button
                                    onClick={() => { setSelectedOwner(null); navigate(`/owners/${selectedOwner.id}`); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    {t('owners.viewFullProfile')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <CreateOwnerModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={loadOwners}
            />
        </div>
    );
}

function StatsCard({ title, value, icon, trend }: any) {
    return (
        <div className="p-6 rounded-xl bg-[#1e293b] border border-white/5 shadow-lg relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/5 rounded-lg text-white">
                    {icon}
                </div>
                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                    {trend}
                </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
            <p className="text-sm text-slate-400 font-medium">{title}</p>
        </div>
    )
}

function CreateOwnerModal({ isOpen, onClose, onSuccess }: any) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert(t('settings.alerts.avatarSize')); return; }
        if (!file.type.startsWith('image/')) { alert(t('settings.alerts.avatarInvalid')); return; }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data: created } = await ownersApi.create(formData);
            const ownerId = created?.id;

            // Upload avatar if selected
            if (avatarFile && ownerId) {
                const ext = avatarFile.name.split('.').pop() || 'jpg';
                const path = `owner-avatars/${ownerId}/avatar.${ext}`;
                const { error: upErr } = await supabase.storage.from('property-images').upload(path, avatarFile, { upsert: true });
                if (!upErr) {
                    const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(path);
                    await supabase.from('owner').update({ avatar_url: urlData.publicUrl }).eq('id', ownerId);
                }
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error("Failed to create owner", err);
        } finally {
            setLoading(false);
            setFormData({ firstName: '', lastName: '', email: '', phone: '' });
            setAvatarFile(null);
            setAvatarPreview(null);
        }
    };

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const initials = formData.firstName && formData.lastName
        ? `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase()
        : '?';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-md bg-[#1e293b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0f172a]/50">
                        <h2 className="text-xl font-bold text-white">{t('owners.modalTitle')}</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* Avatar Upload */}
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold overflow-hidden ring-2 ring-white/10">
                                    {avatarPreview
                                        ? <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                                        : initials}
                                </div>
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <Camera className="h-5 w-5 text-white" />
                                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                                </label>
                            </div>
                            <div className="text-xs text-slate-500">
                                <p className="font-medium text-slate-300">{t('staffOps.avatarUpload')}</p>
                                <p>{t('staffOps.avatarHint')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">{t('owners.labelFirstName')}</label>
                                <input
                                    name="firstName" required
                                    value={formData.firstName} onChange={handleChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-primary focus:outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">{t('owners.labelLastName')}</label>
                                <input
                                    name="lastName" required
                                    value={formData.lastName} onChange={handleChange}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">{t('owners.labelEmail')}</label>
                            <input
                                name="email" type="email" required
                                value={formData.email} onChange={handleChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-primary focus:outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">{t('owners.labelPhone')}</label>
                            <input
                                name="phone" type="tel"
                                value={formData.phone} onChange={handleChange}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-primary focus:outline-none"
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {loading ? t('common.creating') : t('owners.createOwner')}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
