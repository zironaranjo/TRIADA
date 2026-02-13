import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    FileText, DollarSign, TrendingDown,
    ChevronDown, ChevronUp, Building2, Calendar,
    Download,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { exportToPDF, exportToCSV } from '../../lib/exportUtils';

// ─── Types ────────────────────────────────────────────
interface Property {
    id: string;
    name: string;
    owner_id: string;
}

interface Booking {
    id: string;
    guest_name: string;
    total_price: number;
    platform: string;
    status: string;
    start_date: string;
    end_date: string;
    property_id: string;
}

interface Expense {
    id: string;
    amount: number;
    category: string;
    description: string;
    property_id: string | null;
    date: string;
}

interface Owner {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

// ─── Constants ────────────────────────────────────────
const AGENCY_RATE = 0.20;
const PLATFORM_RATES: Record<string, number> = {
    AIRBNB: 0.03,
    BOOKING_COM: 0.15,
    'BOOKING.COM': 0.15,
    DIRECT: 0.03,
    VRBO: 0.05,
};

const MONTH_KEYS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'] as const;

const fmt = (v: number) => new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 2
}).format(v);

// ─── Main Component ──────────────────────────────────
export default function OwnerMyStatements() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [owner, setOwner] = useState<Owner | null>(null);
    const [properties, setProperties] = useState<Property[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    const months = useMemo(() => MONTH_KEYS.map(k => t(`common.months.${k}`)), [t]);
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear, user]);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // Find owner record by email
            const { data: profile } = await supabase.from('profiles').select('email').eq('user_id', user.id).single();
            if (!profile) { setLoading(false); return; }

            const { data: ownerData } = await supabase.from('owner').select('*').eq('email', profile.email).single();
            if (!ownerData) { setLoading(false); return; }
            setOwner(ownerData);

            // Get properties
            const { data: props } = await supabase.from('properties').select('id, name, owner_id').eq('owner_id', ownerData.id);
            const ownerProps = props || [];
            setProperties(ownerProps);

            if (ownerProps.length > 0) {
                const propIds = ownerProps.map(p => p.id);
                const monthStr = String(selectedMonth + 1).padStart(2, '0');
                const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                const startDate = `${selectedYear}-${monthStr}-01`;
                const endDate = `${selectedYear}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

                const [bkRes, expRes] = await Promise.allSettled([
                    supabase.from('bookings').select('*').in('property_id', propIds).gte('start_date', startDate).lte('start_date', endDate).neq('status', 'cancelled'),
                    supabase.from('expenses').select('*').in('property_id', propIds).gte('date', startDate).lte('date', endDate),
                ]);

                if (bkRes.status === 'fulfilled') setBookings(bkRes.value.data || []);
                if (expRes.status === 'fulfilled') setExpenses(expRes.value.data || []);
            } else {
                setBookings([]);
                setExpenses([]);
            }
        } catch (err) {
            console.error('Error fetching statement data:', err);
        } finally {
            setLoading(false);
        }
    };

    // ─── Calculations ─────────────────────────────────
    const grossRevenue = useMemo(() =>
        bookings.reduce((s, b) => s + Number(b.total_price || 0), 0),
        [bookings]
    );

    const platformFees = useMemo(() =>
        bookings.reduce((s, b) => {
            const rate = PLATFORM_RATES[b.platform?.toUpperCase()] || 0.03;
            return s + (Number(b.total_price || 0) * rate);
        }, 0),
        [bookings]
    );

    const agencyCommission = grossRevenue * AGENCY_RATE;

    const propertyExpenses = useMemo(() =>
        expenses.reduce((s, e) => s + Number(e.amount || 0), 0),
        [expenses]
    );

    const netPayout = grossRevenue - platformFees - agencyCommission - propertyExpenses;

    // ─── Export ────────────────────────────────────────
    const handleExportPDF = () => {
        if (!owner) return;
        const period = `${months[selectedMonth]} ${selectedYear}`;
        exportToPDF({
            title: `${t('ownerPortal.statements.title')} - ${owner.firstName} ${owner.lastName}`,
            subtitle: period,
            headers: [t('ownerStatements.property'), t('ownerStatements.guest'), t('ownerStatements.platform'), t('ownerStatements.dates'), t('ownerStatements.amount')],
            rows: bookings.map(b => {
                const prop = properties.find(p => p.id === b.property_id);
                return [
                    prop?.name || '-',
                    b.guest_name,
                    b.platform,
                    `${b.start_date} → ${b.end_date}`,
                    fmt(b.total_price),
                ];
            }),
            summaryRows: [
                { label: t('ownerStatements.period'), value: period },
                { label: t('ownerStatements.grossRevenue'), value: fmt(grossRevenue) },
                { label: t('ownerStatements.platformFees'), value: fmt(platformFees) },
                { label: t('ownerStatements.agencyCommission'), value: fmt(agencyCommission) },
                { label: t('ownerStatements.propertyExpenses'), value: fmt(propertyExpenses) },
                { label: t('ownerStatements.netPayout'), value: fmt(netPayout), bold: true },
            ],
        });
    };

    const handleExportCSV = () => {
        if (!owner) return;
        exportToCSV({
            headers: ['Property', 'Guest', 'Platform', 'Start', 'End', 'Amount'],
            rows: bookings.map(b => {
                const prop = properties.find(p => p.id === b.property_id);
                return [prop?.name || '-', b.guest_name, b.platform, b.start_date, b.end_date, b.total_price];
            }),
            filename: `statement_${owner.firstName}_${months[selectedMonth]}_${selectedYear}`,
        });
    };

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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                            <FileText className="h-7 w-7 text-emerald-400" />
                            {t('ownerPortal.statements.title')}
                        </h1>
                        <p className="text-slate-400 mt-1">{t('ownerPortal.statements.subtitle')}</p>
                    </div>

                    {/* Export Buttons */}
                    <div className="flex items-center gap-2">
                        <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-colors">
                            <Download className="h-4 w-4" />
                            PDF
                        </button>
                        <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 text-teal-400 rounded-xl text-sm font-medium hover:bg-teal-500/30 transition-colors">
                            <Download className="h-4 w-4" />
                            CSV
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Month/Year Selector */}
            <div className="flex flex-wrap items-center gap-3">
                <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                    {months.map((m, i) => (
                        <option key={i} value={i} className="bg-slate-900">{m}</option>
                    ))}
                </select>
                <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                    {[2024, 2025, 2026].map(y => (
                        <option key={y} value={y} className="bg-slate-900">{y}</option>
                    ))}
                </select>
            </div>

            {/* Summary Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/5 rounded-2xl p-6"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-emerald-400" />
                        {months[selectedMonth]} {selectedYear}
                    </h3>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-500 mb-1">{t('ownerStatements.grossRevenue')}</p>
                        <p className="text-lg font-bold text-white">{fmt(grossRevenue)}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-500 mb-1">{t('ownerStatements.platformFees')}</p>
                        <p className="text-lg font-bold text-red-400">{fmt(platformFees)}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-500 mb-1">{t('ownerStatements.agencyCommission')}</p>
                        <p className="text-lg font-bold text-amber-400">{fmt(agencyCommission)}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-500 mb-1">{t('ownerStatements.propertyExpenses')}</p>
                        <p className="text-lg font-bold text-orange-400">{fmt(propertyExpenses)}</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                        <p className="text-xs text-emerald-400/70 mb-1">{t('ownerStatements.netPayout')}</p>
                        <p className="text-lg font-bold text-emerald-400">{fmt(netPayout)}</p>
                    </div>
                </div>

                <p className="text-sm text-slate-400">
                    {properties.length} {t('ownerPortal.statements.propertiesCount')} · {bookings.length} {t('ownerPortal.statements.bookingsCount')} · {expenses.length} {t('ownerPortal.statements.expensesCount')}
                </p>

                {/* Expanded Detail */}
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 space-y-4 border-t border-white/5 pt-4"
                    >
                        {/* Bookings Detail */}
                        <div>
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-emerald-400" />
                                {t('ownerStatements.bookings')} ({bookings.length})
                            </h4>
                            {bookings.length > 0 ? (
                                <div className="space-y-2">
                                    {bookings.map(b => {
                                        const prop = properties.find(p => p.id === b.property_id);
                                        return (
                                            <div key={b.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl text-sm">
                                                <div>
                                                    <p className="text-white font-medium">{b.guest_name}</p>
                                                    <p className="text-xs text-slate-500">{prop?.name} · {b.platform} · {b.start_date} → {b.end_date}</p>
                                                </div>
                                                <span className="text-emerald-400 font-semibold">{fmt(b.total_price)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">{t('ownerPortal.statements.noBookings')}</p>
                            )}
                        </div>

                        {/* Expenses Detail */}
                        <div>
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-red-400" />
                                {t('ownerStatements.propertyExpenses')} ({expenses.length})
                            </h4>
                            {expenses.length > 0 ? (
                                <div className="space-y-2">
                                    {expenses.map(e => {
                                        const prop = properties.find(p => p.id === e.property_id);
                                        return (
                                            <div key={e.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl text-sm">
                                                <div>
                                                    <p className="text-white font-medium">{e.description || e.category}</p>
                                                    <p className="text-xs text-slate-500">{prop?.name} · {e.date}</p>
                                                </div>
                                                <span className="text-red-400 font-semibold">-{fmt(e.amount)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">{t('ownerPortal.statements.noExpenses')}</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
