import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Building2, MapPin, BedDouble, Bath,
    DollarSign, CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────
interface Property {
    id: string;
    name: string;
    address: string;
    status: string;
    price_per_night: number;
    bedrooms: number;
    bathrooms: number;
    images: string | null;
    currency: string;
}

interface BookingSummary {
    property_id: string;
    total_bookings: number;
    total_revenue: number;
}

const fmt = (v: number, curr = 'EUR') => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: curr, maximumFractionDigits: 0
}).format(v);

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
    active: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    maintenance: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
    inactive: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
};

export default function OwnerProperties() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [bookingSummaries, setBookingSummaries] = useState<BookingSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            const { data: profile } = await supabase.from('profiles').select('email').eq('user_id', user.id).single();
            if (!profile) { setLoading(false); return; }

            const { data: owner } = await supabase.from('owner').select('id').eq('email', profile.email).single();
            if (!owner) { setLoading(false); return; }

            const { data: props } = await supabase.from('properties').select('*').eq('owner_id', owner.id);
            const ownerProps = props || [];
            setProperties(ownerProps);

            if (ownerProps.length > 0) {
                const propIds = ownerProps.map(p => p.id);
                const { data: bks } = await supabase
                    .from('bookings')
                    .select('property_id, total_price, status')
                    .in('property_id', propIds);

                const summaries: Record<string, BookingSummary> = {};
                (bks || []).forEach(b => {
                    if (b.status?.toLowerCase() === 'cancelled') return;
                    if (!summaries[b.property_id]) {
                        summaries[b.property_id] = { property_id: b.property_id, total_bookings: 0, total_revenue: 0 };
                    }
                    summaries[b.property_id].total_bookings++;
                    summaries[b.property_id].total_revenue += b.total_price || 0;
                });
                setBookingSummaries(Object.values(summaries));
            }

            setLoading(false);
        };
        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400">{t('ownerPortal.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                    <Building2 className="h-7 w-7 text-emerald-400" />
                    {t('ownerPortal.properties.title')}
                </h1>
                <p className="text-slate-400 mt-1">{t('ownerPortal.properties.subtitle')}</p>
            </motion.div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{properties.length}</p>
                    <p className="text-xs text-slate-400">{t('ownerPortal.properties.total')}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{properties.filter(p => p.status === 'active').length}</p>
                    <p className="text-xs text-slate-400">{t('ownerPortal.properties.activeCount')}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{bookingSummaries.reduce((s, b) => s + b.total_bookings, 0)}</p>
                    <p className="text-xs text-slate-400">{t('ownerPortal.properties.totalBookings')}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-teal-400">{fmt(bookingSummaries.reduce((s, b) => s + b.total_revenue, 0))}</p>
                    <p className="text-xs text-slate-400">{t('ownerPortal.properties.totalRevenue')}</p>
                </div>
            </div>

            {/* Properties Grid */}
            {properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {properties.map((prop, i) => {
                        const summary = bookingSummaries.find(b => b.property_id === prop.id);
                        const status = statusConfig[prop.status] || statusConfig.inactive;
                        const StatusIcon = status.icon;
                        const imageUrl = prop.images || null;

                        return (
                            <motion.div
                                key={prop.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden hover:bg-white/[0.07] transition-colors"
                            >
                                {/* Image */}
                                <div className="relative h-44 bg-gradient-to-br from-slate-800 to-slate-900">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt={prop.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Building2 className="h-12 w-12 text-slate-600" />
                                        </div>
                                    )}
                                    <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                        <StatusIcon className="h-3.5 w-3.5" />
                                        {prop.status}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4 space-y-3">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{prop.name}</h3>
                                        {prop.address && (
                                            <p className="text-sm text-slate-400 flex items-center gap-1 mt-0.5">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {prop.address}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-slate-400">
                                        {prop.bedrooms > 0 && (
                                            <span className="flex items-center gap-1">
                                                <BedDouble className="h-4 w-4" /> {prop.bedrooms}
                                            </span>
                                        )}
                                        {prop.bathrooms > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Bath className="h-4 w-4" /> {prop.bathrooms}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <DollarSign className="h-4 w-4" />
                                            {fmt(prop.price_per_night, prop.currency || 'EUR')}/{t('ownerPortal.properties.night')}
                                        </span>
                                    </div>

                                    <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-500">{t('ownerPortal.properties.bookings')}</p>
                                            <p className="text-sm font-semibold text-white">{summary?.total_bookings || 0}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">{t('ownerPortal.properties.revenue')}</p>
                                            <p className="text-sm font-semibold text-emerald-400">{fmt(summary?.total_revenue || 0)}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white/5 border border-white/5 rounded-2xl p-12 text-center">
                    <Building2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">{t('ownerPortal.properties.empty')}</h3>
                    <p className="text-slate-400 text-sm">{t('ownerPortal.properties.emptyDesc')}</p>
                </div>
            )}
        </div>
    );
}
