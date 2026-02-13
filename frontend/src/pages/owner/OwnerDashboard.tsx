import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from 'recharts';
import {
    Building2, DollarSign, TrendingUp, Calendar,
    Users, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────
interface Property {
    id: string;
    name: string;
    status: string;
    price_per_night: number;
}

interface Booking {
    id: string;
    guest_name: string;
    start_date: string;
    end_date: string;
    status: string;
    total_price: number;
    platform: string;
    property_id: string;
}

interface Expense {
    id: string;
    amount: number;
    category: string;
    date: string;
    property_id: string | null;
}

// ─── Constants ────────────────────────────────────────
const CHART_COLORS = ['#34d399', '#2dd4bf', '#818cf8', '#f472b6', '#fb923c', '#a78bfa'];
const PLATFORM_COLORS: Record<string, string> = {
    DIRECT: '#34d399',
    AIRBNB: '#f43f5e',
    BOOKING_COM: '#3b82f6',
    VRBO: '#8b5cf6',
    OTHER: '#64748b',
};

const fmt = (v: number) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0
}).format(v);

// ─── Custom Tooltip ───────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 shadow-xl text-xs">
            <p className="text-slate-400 mb-1">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} className="font-semibold" style={{ color: p.color }}>
                    {fmt(p.value)}
                </p>
            ))}
        </div>
    );
};

// ─── Stat Card ────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, delay }: {
    icon: any; label: string; value: string; sub?: string; color: string; delay: number;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors"
    >
        <div className="flex items-start justify-between mb-3">
            <div className={`p-2.5 rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
        </div>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </motion.div>
);

// ─── Main Component ──────────────────────────────────
export default function OwnerDashboard() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [ownerRecord, setOwnerRecord] = useState<{ id: string; firstName: string; lastName: string } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            // First find the owner record linked to this user's email
            const { data: profile } = await supabase.from('profiles').select('email').eq('user_id', user.id).single();
            if (!profile) { setLoading(false); return; }

            const { data: owner } = await supabase.from('owner').select('*').eq('email', profile.email).single();
            if (!owner) { setLoading(false); return; }
            setOwnerRecord(owner);

            // Now get properties for this owner
            const { data: props } = await supabase.from('properties').select('*').eq('owner_id', owner.id);
            const ownerProperties = props || [];
            setProperties(ownerProperties);

            if (ownerProperties.length > 0) {
                const propIds = ownerProperties.map(p => p.id);

                // Get bookings for these properties
                const { data: bks } = await supabase
                    .from('bookings')
                    .select('*')
                    .in('property_id', propIds);
                setBookings(bks || []);

                // Get expenses for these properties
                const { data: exps } = await supabase
                    .from('expenses')
                    .select('*')
                    .in('property_id', propIds);
                setExpenses(exps || []);
            }

            setLoading(false);
        };
        fetchData();
    }, [user]);

    // ─── Calculations ─────────────────────────────────
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const confirmedBookings = useMemo(() =>
        bookings.filter(b => b.status?.toLowerCase() !== 'cancelled'),
        [bookings]
    );

    const totalRevenue = useMemo(() =>
        confirmedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
        [confirmedBookings]
    );

    const monthlyRevenue = useMemo(() =>
        confirmedBookings
            .filter(b => {
                const d = new Date(b.start_date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            })
            .reduce((sum, b) => sum + (b.total_price || 0), 0),
        [confirmedBookings, currentMonth, currentYear]
    );

    const totalExpenses = useMemo(() =>
        expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
        [expenses]
    );

    const netIncome = totalRevenue - totalExpenses;

    const upcomingBookings = useMemo(() =>
        confirmedBookings
            .filter(b => new Date(b.start_date) >= now)
            .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
            .slice(0, 5),
        [confirmedBookings]
    );

    // Monthly revenue chart (last 6 months)
    const monthlyChart = useMemo(() => {
        const months: { name: string; revenue: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(currentYear, currentMonth - i, 1);
            const mName = d.toLocaleString('default', { month: 'short' });
            const rev = confirmedBookings
                .filter(b => {
                    const bd = new Date(b.start_date);
                    return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
                })
                .reduce((s, b) => s + (b.total_price || 0), 0);
            months.push({ name: mName, revenue: rev });
        }
        return months;
    }, [confirmedBookings, currentMonth, currentYear]);

    // Platform distribution
    const platformData = useMemo(() => {
        const map: Record<string, number> = {};
        confirmedBookings.forEach(b => {
            const p = b.platform || 'OTHER';
            map[p] = (map[p] || 0) + (b.total_price || 0);
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [confirmedBookings]);

    // Occupancy rate (approximate)
    const occupancyRate = useMemo(() => {
        if (properties.length === 0) return 0;
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const totalAvailableDays = properties.length * daysInMonth;
        const bookedDays = confirmedBookings
            .filter(b => {
                const start = new Date(b.start_date);
                const end = new Date(b.end_date);
                return start.getMonth() === currentMonth || end.getMonth() === currentMonth;
            })
            .reduce((sum, b) => {
                const start = new Date(b.start_date);
                const end = new Date(b.end_date);
                const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                return sum + Math.min(diff, daysInMonth);
            }, 0);
        return Math.min(Math.round((bookedDays / totalAvailableDays) * 100), 100);
    }, [properties, confirmedBookings, currentMonth, currentYear]);

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
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    {t('ownerPortal.dashboard.welcome')}{ownerRecord ? `, ${ownerRecord.firstName}` : ''}
                </h1>
                <p className="text-slate-400 mt-1">{t('ownerPortal.dashboard.subtitle')}</p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Building2}
                    label={t('ownerPortal.dashboard.properties')}
                    value={String(properties.length)}
                    sub={`${properties.filter(p => p.status === 'active').length} ${t('ownerPortal.dashboard.active')}`}
                    color="bg-emerald-500/20 text-emerald-400"
                    delay={0}
                />
                <StatCard
                    icon={DollarSign}
                    label={t('ownerPortal.dashboard.totalRevenue')}
                    value={fmt(totalRevenue)}
                    sub={`${fmt(monthlyRevenue)} ${t('ownerPortal.dashboard.thisMonth')}`}
                    color="bg-teal-500/20 text-teal-400"
                    delay={0.05}
                />
                <StatCard
                    icon={TrendingUp}
                    label={t('ownerPortal.dashboard.netIncome')}
                    value={fmt(netIncome)}
                    sub={`${fmt(totalExpenses)} ${t('ownerPortal.dashboard.expenses')}`}
                    color="bg-indigo-500/20 text-indigo-400"
                    delay={0.1}
                />
                <StatCard
                    icon={Calendar}
                    label={t('ownerPortal.dashboard.bookings')}
                    value={String(confirmedBookings.length)}
                    sub={`${upcomingBookings.length} ${t('ownerPortal.dashboard.upcoming')}`}
                    color="bg-purple-500/20 text-purple-400"
                    delay={0.15}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Revenue Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-white/5 border border-white/5 rounded-2xl p-5"
                >
                    <h3 className="text-lg font-semibold text-white mb-4">{t('ownerPortal.dashboard.revenueOverview')}</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={monthlyChart}>
                            <defs>
                                <linearGradient id="ownerRevGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={v => `€${v}`} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={2} fill="url(#ownerRevGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Platform Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white/5 border border-white/5 rounded-2xl p-5"
                >
                    <h3 className="text-lg font-semibold text-white mb-4">{t('ownerPortal.dashboard.platforms')}</h3>
                    {platformData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie
                                        data={platformData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        dataKey="value"
                                        paddingAngle={3}
                                    >
                                        {platformData.map((entry, i) => (
                                            <Cell key={i} fill={PLATFORM_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-2">
                                {platformData.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p.name] || CHART_COLORS[i % CHART_COLORS.length] }} />
                                            <span className="text-slate-400">{p.name}</span>
                                        </div>
                                        <span className="text-white font-medium">{fmt(p.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-[200px] text-slate-500 text-sm">
                            {t('ownerPortal.dashboard.noData')}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Occupancy + Upcoming Bookings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Occupancy */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 border border-white/5 rounded-2xl p-5"
                >
                    <h3 className="text-lg font-semibold text-white mb-4">{t('ownerPortal.dashboard.occupancy')}</h3>
                    <div className="flex items-center gap-6">
                        <div className="relative w-28 h-28">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                                <circle
                                    cx="60" cy="60" r="52"
                                    fill="none"
                                    stroke="#34d399"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={`${occupancyRate * 3.27} ${327 - occupancyRate * 3.27}`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">{occupancyRate}%</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-slate-400">{t('ownerPortal.dashboard.occupancyDesc')}</p>
                            <div className="flex items-center gap-1 text-sm">
                                {occupancyRate >= 50 ? (
                                    <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                                ) : (
                                    <ArrowDownRight className="h-4 w-4 text-red-400" />
                                )}
                                <span className={occupancyRate >= 50 ? 'text-emerald-400' : 'text-red-400'}>
                                    {occupancyRate >= 50 ? t('ownerPortal.dashboard.good') : t('ownerPortal.dashboard.low')}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Upcoming Bookings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-white/5 border border-white/5 rounded-2xl p-5"
                >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-emerald-400" />
                        {t('ownerPortal.dashboard.upcomingBookings')}
                    </h3>
                    {upcomingBookings.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingBookings.map(b => {
                                const prop = properties.find(p => p.id === b.property_id);
                                return (
                                    <div key={b.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                        <div>
                                            <p className="text-sm font-medium text-white">{b.guest_name}</p>
                                            <p className="text-xs text-slate-500">
                                                {prop?.name} · {new Date(b.start_date).toLocaleDateString()} → {new Date(b.end_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className="text-sm font-semibold text-emerald-400">{fmt(b.total_price)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-[140px] text-slate-500 text-sm">
                            {t('ownerPortal.dashboard.noUpcoming')}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
