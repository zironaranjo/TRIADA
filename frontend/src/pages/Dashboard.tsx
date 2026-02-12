import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts';
import {
    Calendar, Home, Users, DollarSign,
    TrendingUp, Building2, ArrowRight,
    Zap, BarChart3,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────
interface Booking {
    id: string;
    guest_name: string;
    start_date: string;
    end_date: string;
    status: string;
    total_price: number;
    platform: string;
    property_id: string;
    properties: { name: string } | null;
}

interface Property {
    id: string;
    name: string;
    status: string;
}

interface Contact {
    id: string;
}

// ─── Colors ───────────────────────────────────────────
const CHART_COLORS = ['#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#fb923c'];
const PLATFORM_COLORS: Record<string, string> = {
    DIRECT: '#818cf8',
    AIRBNB: '#f43f5e',
    BOOKING_COM: '#3b82f6',
    VRBO: '#8b5cf6',
    OTHER: '#64748b',
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Custom Tooltip ───────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 shadow-xl text-xs">
            <p className="text-slate-400 mb-1">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} className="font-semibold" style={{ color: p.color }}>
                    {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('revenue') ? `€${p.value.toLocaleString()}` : p.value}
                </p>
            ))}
        </div>
    );
};

// ─── Main Dashboard ───────────────────────────────────
export default function Dashboard() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [bRes, pRes, cRes] = await Promise.allSettled([
                    supabase.from('bookings').select('*, properties (name)').order('start_date', { ascending: true }),
                    supabase.from('properties').select('id, name, status'),
                    supabase.from('contacts').select('id'),
                ]);

                if (bRes.status === 'fulfilled' && bRes.value.data) setBookings(bRes.value.data);
                if (pRes.status === 'fulfilled' && pRes.value.data) setProperties(pRes.value.data);
                if (cRes.status === 'fulfilled' && cRes.value.data) setContacts(cRes.value.data);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // ─── Computed Stats ───────────────────────────────
    const activeBookings = useMemo(() =>
        bookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in'),
        [bookings]
    );

    const totalRevenue = useMemo(() =>
        bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.total_price || 0), 0),
        [bookings]
    );

    // ─── Monthly Revenue (last 12 months) ─────────────
    const monthlyRevenue = useMemo(() => {
        const now = new Date();
        const months: { month: string; revenue: number; bookings: number }[] = [];

        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const y = d.getFullYear();
            const m = d.getMonth();
            const monthStart = `${y}-${String(m + 1).padStart(2, '0')}-01`;
            const monthEnd = `${y}-${String(m + 1).padStart(2, '0')}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, '0')}`;

            const monthBookings = bookings.filter(b =>
                b.status !== 'cancelled' && b.start_date >= monthStart && b.start_date <= monthEnd
            );

            months.push({
                month: MONTH_SHORT[m],
                revenue: monthBookings.reduce((s, b) => s + (b.total_price || 0), 0),
                bookings: monthBookings.length,
            });
        }
        return months;
    }, [bookings]);

    // ─── Revenue by Property ──────────────────────────
    const revenueByProperty = useMemo(() => {
        const map: Record<string, { name: string; revenue: number; bookings: number }> = {};
        bookings.filter(b => b.status !== 'cancelled').forEach(b => {
            const name = b.properties?.name || 'Unknown';
            if (!map[name]) map[name] = { name, revenue: 0, bookings: 0 };
            map[name].revenue += b.total_price || 0;
            map[name].bookings += 1;
        });
        return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
    }, [bookings]);

    // ─── Bookings by Platform ─────────────────────────
    const bookingsByPlatform = useMemo(() => {
        const map: Record<string, number> = {};
        bookings.filter(b => b.status !== 'cancelled').forEach(b => {
            const p = b.platform || 'DIRECT';
            map[p] = (map[p] || 0) + 1;
        });
        return Object.entries(map).map(([name, value]) => ({
            name: name.replace('_', '.'),
            value,
            color: PLATFORM_COLORS[name] || PLATFORM_COLORS.OTHER,
        }));
    }, [bookings]);

    // ─── Occupancy by Property (this month) ───────────
    const occupancyByProperty = useMemo(() => {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth(), daysInMonth);

        return properties.map(prop => {
            const propBookings = bookings.filter(b =>
                b.property_id === prop.id && b.status !== 'cancelled' &&
                new Date(b.start_date) <= monthEnd && new Date(b.end_date) >= monthStart
            );

            let occupiedDays = 0;
            propBookings.forEach(b => {
                const start = new Date(b.start_date) < monthStart ? monthStart : new Date(b.start_date);
                const end = new Date(b.end_date) > monthEnd ? monthEnd : new Date(b.end_date);
                occupiedDays += Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
            });

            return {
                name: prop.name.length > 15 ? prop.name.substring(0, 15) + '...' : prop.name,
                occupancy: Math.min(Math.round((occupiedDays / daysInMonth) * 100), 100),
            };
        }).sort((a, b) => b.occupancy - a.occupancy);
    }, [bookings, properties]);

    // ─── Upcoming bookings ────────────────────────────
    const upcomingBookings = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return bookings
            .filter(b => b.start_date >= today && b.status !== 'cancelled')
            .slice(0, 5);
    }, [bookings]);

    // ─── Container animation ──────────────────────────
    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.08 } },
    };
    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                <p className="animate-pulse text-sm text-slate-400">Loading Dashboard...</p>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

                {/* Header */}
                <header>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-1"
                    >
                        Dashboard
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 text-sm sm:text-base"
                    >
                        Overview of your vacation rental business
                    </motion.p>
                </header>

                {/* Onboarding - show only for new users */}
                {properties.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 rounded-2xl p-6 sm:p-8"
                    >
                        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                            <div className="p-3 sm:p-4 bg-indigo-500/20 rounded-2xl flex-shrink-0">
                                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-400" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome to Triadak!</h2>
                                <p className="text-slate-400 text-sm mb-6">Follow these steps to get started:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                    <Link to="/properties" className="group p-4 bg-white/5 rounded-xl border border-white/10 hover:border-indigo-500/30 hover:bg-white/10 transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Home className="h-4 w-4 text-emerald-400" />
                                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">Step 1</span>
                                        </div>
                                        <h3 className="font-semibold text-white text-sm">Add a Property</h3>
                                    </Link>
                                    <Link to="/bookings" className="group p-4 bg-white/5 rounded-xl border border-white/10 hover:border-indigo-500/30 hover:bg-white/10 transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="h-4 w-4 text-blue-400" />
                                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">Step 2</span>
                                        </div>
                                        <h3 className="font-semibold text-white text-sm">Create a Booking</h3>
                                    </Link>
                                    <Link to="/crm" className="group p-4 bg-white/5 rounded-xl border border-white/10 hover:border-indigo-500/30 hover:bg-white/10 transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="h-4 w-4 text-purple-400" />
                                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-semibold">Step 3</span>
                                        </div>
                                        <h3 className="font-semibold text-white text-sm">Build Your CRM</h3>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* KPI Cards */}
                <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[
                        { title: 'Total Bookings', value: bookings.length, icon: Calendar, color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/20' },
                        { title: 'Active Properties', value: properties.filter(p => p.status === 'active').length, icon: Building2, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-600/5', border: 'border-emerald-500/20' },
                        { title: 'CRM Contacts', value: contacts.length, icon: Users, color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/20' },
                        { title: 'Total Revenue', value: `€${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/20' },
                    ].map((kpi) => (
                        <motion.div
                            key={kpi.title}
                            variants={item}
                            className={`rounded-xl bg-gradient-to-br ${kpi.bg} border ${kpi.border} p-4 sm:p-6`}
                        >
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className={`p-2 sm:p-3 bg-white/10 rounded-lg ${kpi.color}`}>
                                    <kpi.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                            </div>
                            <h3 className="text-xl sm:text-3xl font-bold text-white mb-0.5">{kpi.value}</h3>
                            <p className="text-xs sm:text-sm text-slate-400">{kpi.title}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Charts Row 1: Revenue Trend + Platform Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Monthly Revenue Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 bg-white/5 border border-white/5 rounded-2xl p-4 sm:p-6"
                    >
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-indigo-400" />
                                    Monthly Revenue
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Last 12 months</p>
                            </div>
                        </div>
                        <div className="h-48 sm:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyRevenue}>
                                    <defs>
                                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} width={50} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#818cf8" fill="url(#revenueGrad)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Platform Distribution */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/5 border border-white/5 rounded-2xl p-4 sm:p-6"
                    >
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Bookings by Platform</h3>
                        {bookingsByPlatform.length > 0 ? (
                            <>
                                <div className="h-40 sm:h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={bookingsByPlatform}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={65}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {bookingsByPlatform.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<ChartTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2 mt-2">
                                    {bookingsByPlatform.map((p) => (
                                        <div key={p.name} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                                                <span className="text-slate-400">{p.name}</span>
                                            </div>
                                            <span className="text-white font-medium">{p.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">No data yet</div>
                        )}
                    </motion.div>
                </div>

                {/* Charts Row 2: Revenue by Property + Occupancy */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Revenue by Property */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white/5 border border-white/5 rounded-2xl p-4 sm:p-6"
                    >
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-purple-400" />
                                Revenue by Property
                            </h3>
                        </div>
                        {revenueByProperty.length > 0 ? (
                            <div className="h-48 sm:h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueByProperty} layout="vertical" margin={{ left: 0, right: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
                                        <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]}>
                                            {revenueByProperty.map((_, i) => (
                                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">No data yet</div>
                        )}
                    </motion.div>

                    {/* Occupancy by Property */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/5 border border-white/5 rounded-2xl p-4 sm:p-6"
                    >
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <div>
                                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                                    <Home className="h-5 w-5 text-emerald-400" />
                                    Occupancy This Month
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">{MONTH_SHORT[new Date().getMonth()]} {new Date().getFullYear()}</p>
                            </div>
                        </div>
                        {occupancyByProperty.length > 0 ? (
                            <div className="space-y-3">
                                {occupancyByProperty.map((prop) => (
                                    <div key={prop.name}>
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <span className="text-slate-400">{prop.name}</span>
                                            <span className={`font-semibold ${prop.occupancy >= 70 ? 'text-emerald-400' : prop.occupancy >= 40 ? 'text-amber-400' : 'text-slate-400'}`}>
                                                {prop.occupancy}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${prop.occupancy}%` }}
                                                transition={{ duration: 0.8, delay: 0.2 }}
                                                className={`h-full rounded-full ${prop.occupancy >= 70 ? 'bg-emerald-500' : prop.occupancy >= 40 ? 'bg-amber-500' : 'bg-slate-500'}`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">No properties yet</div>
                        )}
                    </motion.div>
                </div>

                {/* Upcoming Bookings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/5 border border-white/5 rounded-2xl p-4 sm:p-6"
                >
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-400" />
                            Upcoming Bookings
                        </h3>
                        <Link to="/bookings" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                            View all <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>

                    {upcomingBookings.length > 0 ? (
                        <div className="space-y-2 sm:space-y-3">
                            {upcomingBookings.map((b) => {
                                const nights = Math.ceil((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / (1000 * 60 * 60 * 24));
                                return (
                                    <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                                <Calendar className="h-4 w-4 text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{b.guest_name}</p>
                                                <p className="text-xs text-slate-500">{b.properties?.name || 'Unknown'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 sm:gap-6 ml-13 sm:ml-0">
                                            <div className="text-xs text-slate-400">
                                                {b.start_date} → {b.end_date}
                                                <span className="text-slate-600 ml-1">({nights}n)</span>
                                            </div>
                                            <span className="text-sm font-semibold text-emerald-400">€{b.total_price?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500 text-sm">No upcoming bookings</div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
