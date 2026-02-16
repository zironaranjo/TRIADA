import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { ownersApi } from '@/api/client';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/GlassCard';
import {
    ArrowLeft, Building, DollarSign, TrendingUp,
    Mail, Phone, Home, Edit3, Save, X,
    BarChart3, FileText, CreditCard,
} from 'lucide-react';

interface Owner {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
}

interface Property {
    id: string;
    name: string;
    status: string;
    price_per_night: number;
    address?: string;
    bedrooms?: number;
    bathrooms?: number;
}

interface Booking {
    id: string;
    guest_name: string;
    total_price: number;
    start_date: string;
    end_date: string;
    platform: string;
    status: string;
    property_id: string;
}

type TabId = 'properties' | 'statements' | 'payments';

export default function OwnerProfile() {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [owner, setOwner] = useState<Owner | null>(null);
    const [properties, setProperties] = useState<Property[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabId>('properties');
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: ownerRes } = await ownersApi.getOne(id!);
            setOwner(ownerRes);
            setEditForm({
                firstName: ownerRes.firstName,
                lastName: ownerRes.lastName,
                email: ownerRes.email,
                phone: ownerRes.phone || '',
            });

            const { data: props } = await supabase
                .from('properties')
                .select('id, name, status, price_per_night, address, bedrooms, bathrooms')
                .eq('owner_id', id);
            setProperties(props || []);

            const propertyIds = (props || []).map(p => p.id);
            if (propertyIds.length > 0) {
                const { data: bk } = await supabase
                    .from('bookings')
                    .select('*')
                    .in('property_id', propertyIds)
                    .order('start_date', { ascending: false });
                setBookings(bk || []);
            }
        } catch (error) {
            console.error('Error loading owner:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!owner) return;
        setSaving(true);
        try {
            await ownersApi.update(owner.id, editForm);
            setOwner({ ...owner, ...editForm });
            setEditing(false);
        } catch (error) {
            console.error('Error updating owner:', error);
        } finally {
            setSaving(false);
        }
    };

    const fmt = (v: number) => new Intl.NumberFormat('es-ES', {
        style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
    }).format(v);

    const totalRevenue = bookings.reduce((s, b) => s + Number(b.total_price || 0), 0);
    const activeProperties = properties.filter(p => p.status === 'active').length;
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const monthRevenue = bookings.filter(b => b.start_date >= monthStart).reduce((s, b) => s + Number(b.total_price || 0), 0);
    const occupancyRate = properties.length > 0 ? Math.min(100, Math.round((bookings.length / (properties.length * 12)) * 100)) : 0;

    const TABS: { id: TabId; labelKey: string; icon: React.ElementType }[] = [
        { id: 'properties', labelKey: 'owners.profileTabProperties', icon: Building },
        { id: 'statements', labelKey: 'owners.profileTabStatements', icon: FileText },
        { id: 'payments', labelKey: 'owners.profileTabPayments', icon: CreditCard },
    ];

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                <p className="animate-pulse text-sm text-slate-400">{t('common.loading')}</p>
            </div>
        </div>
    );

    if (!owner) return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <p className="text-lg text-slate-400">{t('owners.notFound')}</p>
                <button onClick={() => navigate('/owners')} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm">
                    {t('owners.backToOwners')}
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Back button */}
                <button onClick={() => navigate('/owners')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    {t('owners.backToOwners')}
                </button>

                {/* Profile Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <GlassCard className="p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                    {owner.firstName[0]}{owner.lastName[0]}
                                </div>
                                <div>
                                    {editing ? (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <input value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white w-32" />
                                                <input value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white w-32" />
                                            </div>
                                            <input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white" />
                                            <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone"
                                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white" />
                                        </div>
                                    ) : (
                                        <>
                                            <h1 className="text-2xl font-bold text-white">{owner.firstName} {owner.lastName}</h1>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                                                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {owner.email}</span>
                                                {owner.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {owner.phone}</span>}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {editing ? (
                                    <>
                                        <button onClick={() => setEditing(false)} className="p-2 text-slate-400 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
                                        <button onClick={handleSave} disabled={saving}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                                            <Save className="h-4 w-4" /> {saving ? t('common.saving') : t('common.save')}
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setEditing(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/10">
                                        <Edit3 className="h-4 w-4" /> {t('owners.editOwner')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* KPIs */}
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                    <KPI icon={<Home className="h-5 w-5" />} color="bg-indigo-500" title={t('owners.detailProperties')} value={`${activeProperties}/${properties.length}`} sub={t('owners.kpiActive')} />
                    <KPI icon={<DollarSign className="h-5 w-5" />} color="bg-emerald-500" title={t('owners.detailRevenue')} value={fmt(totalRevenue)} sub={`${bookings.length} ${t('owners.kpiBookings')}`} />
                    <KPI icon={<TrendingUp className="h-5 w-5" />} color="bg-amber-500" title={t('owners.detailThisMonth')} value={fmt(monthRevenue)} sub={t('owners.kpiCurrent')} />
                    <KPI icon={<BarChart3 className="h-5 w-5" />} color="bg-purple-500" title={t('owners.kpiOccupancy')} value={`${occupancyRate}%`} sub={t('owners.kpiAvgRate')} />
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5 w-fit">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {t(tab.labelKey)}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'properties' && (
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {properties.map(p => {
                            const propBookings = bookings.filter(b => b.property_id === p.id);
                            const propRevenue = propBookings.reduce((s, b) => s + Number(b.total_price || 0), 0);
                            return (
                                <GlassCard key={p.id} className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-white text-sm">{p.name}</h4>
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                            {p.status}
                                        </span>
                                    </div>
                                    {p.address && <p className="text-xs text-slate-500">{p.address}</p>}
                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                        {p.bedrooms && <span>{p.bedrooms} bed</span>}
                                        {p.bathrooms && <span>{p.bathrooms} bath</span>}
                                        <span>€{p.price_per_night}/night</span>
                                    </div>
                                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                                        <span className="text-slate-500">{propBookings.length} {t('owners.kpiBookings')}</span>
                                        <span className="text-emerald-400 font-semibold">{fmt(propRevenue)}</span>
                                    </div>
                                </GlassCard>
                            );
                        })}
                        {properties.length === 0 && (
                            <div className="col-span-full text-center py-12">
                                <Building className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                                <p className="text-sm text-slate-500">{t('owners.noProperties')}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'statements' && (
                    <GlassCard className="p-6">
                        <div className="text-center py-8">
                            <FileText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-white mb-2">{t('owners.statementsTitle')}</h3>
                            <p className="text-sm text-slate-500 mb-4">{t('owners.statementsDesc')}</p>
                            <button onClick={() => navigate('/statements')}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
                                {t('owners.goToStatements')}
                            </button>
                        </div>
                    </GlassCard>
                )}

                {activeTab === 'payments' && (
                    <GlassCard className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-white/5">
                            <h3 className="font-semibold text-white">{t('owners.paymentHistory')}</h3>
                        </div>
                        <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                            {bookings.slice(0, 20).map(b => (
                                <div key={b.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-white">{b.guest_name}</p>
                                        <p className="text-xs text-slate-500">{b.platform || 'DIRECT'} · {new Date(b.start_date).toLocaleDateString()} → {new Date(b.end_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-emerald-400">{fmt(Number(b.total_price))}</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${b.status === 'completed' || b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                            {b.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {bookings.length === 0 && (
                                <div className="p-12 text-center text-slate-500 text-sm">
                                    <CreditCard className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                                    {t('owners.noPayments')}
                                </div>
                            )}
                        </div>
                    </GlassCard>
                )}
            </div>
        </div>
    );
}

function KPI({ icon, color, title, value, sub }: { icon: React.ReactNode; color: string; title: string; value: string; sub: string }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-xl bg-white/5 border border-white/5 p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className={`inline-flex items-center justify-center rounded-lg ${color} p-1.5 sm:p-2 shadow-lg`}>
                    <div className="text-white">{icon}</div>
                </div>
                <p className="text-[10px] sm:text-sm font-medium text-slate-400">{title}</p>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-white">{value}</p>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">{sub}</p>
        </motion.div>
    );
}
