import { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "../lib/supabase";
import {
    DollarSign, TrendingUp, TrendingDown, Users, CreditCard,
    Plus, X, Receipt, ArrowUpRight, ArrowDownRight, Trash2, Filter, Download
} from "lucide-react";
import { exportToPDF, exportToCSV } from '../lib/exportUtils';
import { motion, AnimatePresence } from "framer-motion";
import {
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar
} from 'recharts';

// ─── Types ────────────────────────────────────────────
interface Booking {
    id: string;
    guest_name: string;
    total_price: number;
    platform: string;
    status: string;
    start_date: string;
    end_date: string;
    property_id: string;
    created_at: string;
    properties?: { name: string } | null;
}

interface Expense {
    id: string;
    category: string;
    amount: number;
    description: string;
    property_id: string | null;
    date: string;
    created_at: string;
    properties?: { name: string } | null;
}

interface Property {
    id: string;
    name: string;
}

// ─── Constants ────────────────────────────────────────
const EXPENSE_CATEGORIES = [
    { value: 'CLEANING', label: 'Cleaning', icon: '🧹', color: '#3b82f6' },
    { value: 'LAUNDRY', label: 'Laundry', icon: '👕', color: '#8b5cf6' },
    { value: 'SUPPLIES', label: 'Supplies', icon: '📦', color: '#f59e0b' },
    { value: 'MATERIALS', label: 'Materials', icon: '🧱', color: '#ef4444' },
    { value: 'FUEL', label: 'Fuel & Transport', icon: '⛽', color: '#f97316' },
    { value: 'MAINTENANCE', label: 'Maintenance', icon: '🔧', color: '#10b981' },
    { value: 'UTILITIES', label: 'Utilities', icon: '💡', color: '#06b6d4' },
    { value: 'INSURANCE', label: 'Insurance', icon: '🛡️', color: '#6366f1' },
    { value: 'TAXES', label: 'Taxes', icon: '📋', color: '#ec4899' },
    { value: 'MARKETING', label: 'Marketing', icon: '📣', color: '#14b8a6' },
    { value: 'COMMISSION', label: 'Commission', icon: '💼', color: '#a855f7' },
    { value: 'AMENITIES', label: 'Amenities', icon: '🎁', color: '#22d3ee' },
    { value: 'DECORATION', label: 'Decoration', icon: '🛋️', color: '#d946ef' },
    { value: 'OTHER', label: 'Other', icon: '📝', color: '#94a3b8' },
];

const PLATFORM_COLORS: Record<string, string> = {
    AIRBNB: '#FF5A5F',
    'BOOKING.COM': '#003580',
    BOOKING_COM: '#003580',
    DIRECT: '#10b981',
    VRBO: '#6366f1',
    OTHER: '#94a3b8',
};

const AGENCY_RATE = 0.20;
const PLATFORM_RATES: Record<string, number> = {
    AIRBNB: 0.03,
    'BOOKING.COM': 0.15,
    BOOKING_COM: 0.15,
    DIRECT: 0.03,
    VRBO: 0.05,
};

// ─── Main Component ──────────────────────────────────
export default function FinanceDashboard() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [propertyFilter, setPropertyFilter] = useState<string>('ALL');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchData();
    }, [selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        const timeout = setTimeout(() => setLoading(false), 8000);
        try {
            const startDate = `${selectedYear}-01-01`;
            const endDate = `${selectedYear}-12-31`;

            const [bookingsRes, expensesRes, propertiesRes] = await Promise.allSettled([
                supabase
                    .from('bookings')
                    .select('*, properties(name)')
                    .gte('start_date', startDate)
                    .lte('start_date', endDate)
                    .order('start_date', { ascending: false }),
                supabase
                    .from('expenses')
                    .select('*, properties(name)')
                    .gte('date', startDate)
                    .lte('date', endDate)
                    .order('date', { ascending: false }),
                supabase
                    .from('properties')
                    .select('id, name')
                    .eq('status', 'active'),
            ]);

            if (bookingsRes.status === 'fulfilled' && !bookingsRes.value.error) {
                setBookings((bookingsRes.value.data || []) as Booking[]);
            }
            if (expensesRes.status === 'fulfilled' && !expensesRes.value.error) {
                setExpenses((expensesRes.value.data || []) as Expense[]);
            }
            if (propertiesRes.status === 'fulfilled' && !propertiesRes.value.error) {
                setProperties((propertiesRes.value.data || []) as Property[]);
            }
        } catch (error) {
            console.error('Error fetching financial data:', error);
        } finally {
            clearTimeout(timeout);
            setLoading(false);
        }
    };

    // ─── Filter by property ───────────────────────────
    const filteredBookings = propertyFilter === 'ALL'
        ? bookings
        : bookings.filter(b => b.property_id === propertyFilter);

    const filteredExpenses = propertyFilter === 'ALL'
        ? expenses
        : expenses.filter(e => e.property_id === propertyFilter);

    // ─── Calculate Stats ──────────────────────────────
    const totalRevenue = filteredBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const platformFees = filteredBookings.reduce((sum, b) => {
        const rate = PLATFORM_RATES[b.platform?.toUpperCase()] || 0.03;
        return sum + (Number(b.total_price || 0) * rate);
    }, 0);

    const agencyCommission = totalRevenue * AGENCY_RATE;
    const ownerPayouts = totalRevenue - platformFees - agencyCommission - totalExpenses;
    const netProfit = agencyCommission - totalExpenses;

    // ─── Monthly Chart Data ───────────────────────────
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const monthStr = String(month).padStart(2, '0');
        const monthBookings = filteredBookings.filter(b =>
            b.start_date?.startsWith(`${selectedYear}-${monthStr}`)
        );
        const monthExpenses = filteredExpenses.filter(e =>
            e.date?.startsWith(`${selectedYear}-${monthStr}`)
        );
        const revenue = monthBookings.reduce((s, b) => s + Number(b.total_price || 0), 0);
        const expense = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

        return {
            name: new Date(selectedYear, i).toLocaleString('en', { month: 'short' }),
            revenue,
            expenses: expense,
            profit: revenue * AGENCY_RATE - expense,
        };
    });

    // ─── Platform Chart Data ──────────────────────────
    const platformMap = new Map<string, number>();
    filteredBookings.forEach(b => {
        const platform = b.platform?.toUpperCase() || 'DIRECT';
        platformMap.set(platform, (platformMap.get(platform) || 0) + Number(b.total_price || 0));
    });
    const platformData = Array.from(platformMap.entries()).map(([name, value]) => ({
        name: name.replace('_', '.'),
        value: Math.round(value),
        color: PLATFORM_COLORS[name] || PLATFORM_COLORS.OTHER,
    }));

    // ─── Expenses by Category ─────────────────────────
    const categoryMap = new Map<string, number>();
    filteredExpenses.forEach(e => {
        const cat = e.category || 'OTHER';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(e.amount || 0));
    });
    const expenseByCategoryData = Array.from(categoryMap.entries())
        .map(([key, value]) => {
            const catDef = EXPENSE_CATEGORIES.find(c => c.value === key);
            return {
                name: catDef?.label || key,
                value: Math.round(value * 100) / 100,
                color: catDef?.color || '#94a3b8',
                icon: catDef?.icon || '📝',
            };
        })
        .sort((a, b) => b.value - a.value);

    // ─── Delete Expense ───────────────────────────────
    const deleteExpense = async (id: string) => {
        if (!confirm('Delete this expense?')) return;
        try {
            await supabase.from('expenses').delete().eq('id', id);
            setExpenses(expenses.filter(e => e.id !== id));
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    // ─── Format Currency ──────────────────────────────
    const fmt = (v: number) => new Intl.NumberFormat('es-ES', {
        style: 'currency', currency: 'EUR', maximumFractionDigits: 0
    }).format(v);

    // ─── Export Functions ──────────────────────────────
    const exportFinancePDF = () => {
        exportToPDF({
            title: 'Financial Report',
            subtitle: `Year ${selectedYear}${propertyFilter !== 'ALL' ? ` — ${properties.find(p => p.id === propertyFilter)?.name}` : ''}`,
            headers: ['Month', 'Revenue', 'Expenses', 'Agency Profit'],
            rows: monthlyData.map(m => [m.name, `€${m.revenue.toLocaleString()}`, `€${m.expenses.toLocaleString()}`, `€${m.profit.toFixed(0)}`]),
            summaryRows: [
                { label: 'Total Revenue', value: fmt(totalRevenue) },
                { label: 'Total Expenses', value: fmt(totalExpenses) },
                { label: 'Platform Fees', value: fmt(platformFees) },
                { label: 'Agency Commission (20%)', value: fmt(agencyCommission) },
                { label: 'Owner Payouts', value: fmt(ownerPayouts) },
                { label: 'Net Profit', value: fmt(netProfit), bold: true },
            ],
            filename: `financial-report-${selectedYear}`,
        });
    };

    const exportFinanceCSV = () => {
        exportToCSV(
            `financial-report-${selectedYear}`,
            ['Month', 'Revenue', 'Expenses', 'Agency Profit'],
            monthlyData.map(m => [m.name, m.revenue.toFixed(2), m.expenses.toFixed(2), m.profit.toFixed(2)])
        );
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                <p className="animate-pulse text-sm text-slate-400">Loading Financial Engine...</p>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">

                {/* ─── Header ───────────────────────── */}
                <header>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white"
                            >
                                Finance Engine
                            </motion.h1>
                            <p className="text-slate-400 text-sm sm:text-base">Financial analytics from your bookings & expenses</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="sm:hidden p-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                                <Filter className="h-4 w-4" />
                            </button>
                            <div className={`${showFilters ? 'flex' : 'hidden'} sm:flex items-center gap-2 sm:gap-3`}>
                                <select
                                    value={propertyFilter}
                                    onChange={(e) => setPropertyFilter(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="ALL" className="bg-slate-800">All Properties</option>
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id} className="bg-slate-800">{p.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                >
                                    {[2024, 2025, 2026, 2027].map(y => (
                                        <option key={y} value={y} className="bg-slate-800">{y}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={() => setIsExpenseModalOpen(true)}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 text-sm"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Add Expense</span>
                            </button>
                            <button
                                onClick={exportFinancePDF}
                                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
                                title="Export PDF"
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">PDF</span>
                            </button>
                            <button
                                onClick={exportFinanceCSV}
                                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
                                title="Export CSV"
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">CSV</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* ─── KPI Cards ────────────────────── */}
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
                    <KPICard title="Revenue" value={fmt(totalRevenue)} icon={<DollarSign className="h-5 w-5" />}
                        color="bg-indigo-500" subtitle={`${filteredBookings.length} bookings`} />
                    <KPICard title="Expenses" value={fmt(totalExpenses)} icon={<TrendingDown className="h-5 w-5" />}
                        color="bg-rose-500" subtitle={`${filteredExpenses.length} entries`} />
                    <KPICard title="Agency Fee" value={fmt(agencyCommission)} icon={<TrendingUp className="h-5 w-5" />}
                        color="bg-amber-500" subtitle="20% of revenue" />
                    <KPICard title="Owner Payout" value={fmt(ownerPayouts)} icon={<Users className="h-5 w-5" />}
                        color="bg-emerald-500" subtitle="Net to owners" />
                    <KPICard title="Net Profit" value={fmt(netProfit)} icon={<CreditCard className="h-5 w-5" />}
                        color={netProfit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}
                        subtitle={netProfit >= 0 ? 'Agency profit' : 'Agency loss'} className="col-span-2 lg:col-span-1" />
                </div>

                {/* ─── Charts Row ───────────────────── */}
                <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                    {/* Revenue vs Expenses Chart */}
                    <GlassCard className="min-h-[280px] sm:min-h-[320px] flex flex-col">
                        <h3 className="mb-3 sm:mb-4 font-semibold text-base sm:text-lg text-white">Revenue vs Expenses</h3>
                        <div className="flex-1 w-full min-h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={45}
                                        tickFormatter={(v) => v >= 1000 ? `€${v / 1000}k` : `€${v}`} />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                        formatter={(value: any) => `€${Number(value).toLocaleString()}`}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                                    <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" name="Expenses" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>

                    {/* Platform Breakdown */}
                    <GlassCard className="min-h-[280px] sm:min-h-[320px] flex flex-col">
                        <h3 className="mb-3 sm:mb-4 font-semibold text-base sm:text-lg text-white">Revenue by Platform</h3>
                        {platformData.length > 0 ? (
                            <>
                                <div className="flex-1 w-full flex items-center justify-center min-h-[180px]">
                                    <ResponsiveContainer width="100%" height={180}>
                                        <PieChart>
                                            <Pie data={platformData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="value">
                                                {platformData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                                                formatter={(value: any) => `€${Number(value).toLocaleString()}`}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-2">
                                    {platformData.map((d) => (
                                        <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                                            {d.name} ({fmt(d.value)})
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                                No booking data for this period
                            </div>
                        )}
                    </GlassCard>
                </div>

                {/* ─── Monthly Profit Bar Chart ──────── */}
                <GlassCard className="min-h-[260px] sm:min-h-[280px] flex flex-col">
                    <h3 className="mb-3 sm:mb-4 font-semibold text-base sm:text-lg text-white">Monthly Profit (Agency)</h3>
                    <div className="flex-1 w-full min-h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={45}
                                    tickFormatter={(v) => v >= 1000 ? `€${v / 1000}k` : `€${v}`} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                                    formatter={(value: any) => `€${Number(value).toLocaleString()}`}
                                />
                                <Bar dataKey="profit" name="Profit" radius={[4, 4, 0, 0]}>
                                    {monthlyData.map((entry, index) => (
                                        <Cell key={`bar-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* ─── Expenses by Category ──────── */}
                {expenseByCategoryData.length > 0 && (
                    <GlassCard className="p-0 overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <h3 className="font-semibold text-white text-base sm:text-lg">Expenses by Category</h3>
                            <span className="text-xs text-slate-500">{fmt(totalExpenses)} total</span>
                        </div>
                        <div className="p-4 sm:p-6">
                            <div className="space-y-3">
                                {expenseByCategoryData.map((cat) => {
                                    const pct = totalExpenses > 0 ? (cat.value / totalExpenses) * 100 : 0;
                                    return (
                                        <div key={cat.name}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm sm:text-base">{cat.icon}</span>
                                                    <span className="text-xs sm:text-sm font-medium text-white">{cat.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <span className="text-xs sm:text-sm font-bold text-white">{fmt(cat.value)}</span>
                                                    <span className="text-[10px] sm:text-xs text-slate-500 w-10 sm:w-12 text-right">{pct.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                            <div className="h-2 sm:h-2.5 bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: cat.color }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </GlassCard>
                )}

                {/* ─── Two Column: Recent Bookings + Expenses ─── */}
                <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                    {/* Recent Revenue */}
                    <GlassCard className="p-0 overflow-hidden">
                        <div className="p-3 sm:p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <h3 className="font-semibold text-white text-sm sm:text-base flex items-center gap-2">
                                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                                Recent Revenue
                            </h3>
                            <span className="text-[10px] sm:text-xs text-slate-500">{filteredBookings.length} bookings</span>
                        </div>
                        <div className="divide-y divide-white/5 max-h-[350px] sm:max-h-[400px] overflow-y-auto">
                            {filteredBookings.slice(0, 15).map((b) => (
                                <div key={b.id} className="p-3 sm:p-4 hover:bg-white/5 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                        <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10 flex-shrink-0">
                                            <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-medium text-white truncate">{b.guest_name || 'Guest'}</p>
                                            <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                                                {b.properties?.name} · {b.platform || 'DIRECT'} · {new Date(b.start_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold text-emerald-400 whitespace-nowrap ml-2">+{fmt(Number(b.total_price))}</span>
                                </div>
                            ))}
                            {filteredBookings.length === 0 && (
                                <div className="p-8 text-center text-slate-500 text-sm">No bookings this period</div>
                            )}
                        </div>
                    </GlassCard>

                    {/* Expenses */}
                    <GlassCard className="p-0 overflow-hidden">
                        <div className="p-3 sm:p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <h3 className="font-semibold text-white text-sm sm:text-base flex items-center gap-2">
                                <ArrowDownRight className="h-4 w-4 text-rose-400" />
                                Expenses
                            </h3>
                            <button
                                onClick={() => setIsExpenseModalOpen(true)}
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                            >
                                <Plus className="h-3 w-3" /> Add
                            </button>
                        </div>
                        <div className="divide-y divide-white/5 max-h-[350px] sm:max-h-[400px] overflow-y-auto">
                            {filteredExpenses.slice(0, 15).map((e) => {
                                const cat = EXPENSE_CATEGORIES.find(c => c.value === e.category);
                                return (
                                    <div key={e.id} className="p-3 sm:p-4 hover:bg-white/5 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                            <div className="p-1.5 sm:p-2 rounded-lg bg-rose-500/10 text-sm flex-shrink-0">
                                                {cat?.icon || '📝'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs sm:text-sm font-medium text-white truncate">{e.description || cat?.label || e.category}</p>
                                                <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                                                    {e.properties?.name || 'General'} · {new Date(e.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 sm:gap-2">
                                            <span className="text-xs sm:text-sm font-bold text-rose-400 whitespace-nowrap">-{fmt(Number(e.amount))}</span>
                                            <button onClick={() => deleteExpense(e.id)}
                                                className="p-1 rounded hover:bg-white/10 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredExpenses.length === 0 && (
                                <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                                    <Receipt className="h-6 w-6 text-slate-600" />
                                    No expenses recorded
                                    <button
                                        onClick={() => setIsExpenseModalOpen(true)}
                                        className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline"
                                    >
                                        Add your first expense
                                    </button>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>

                {/* ─── Settlement Summary ───────────── */}
                <GlassCard className="p-0 overflow-hidden">
                    <div className="p-3 sm:p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <h3 className="font-semibold text-white text-base sm:text-lg">Settlement Breakdown</h3>
                        <span className="text-[10px] sm:text-xs text-slate-500">{filteredBookings.length} bookings</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                            <thead className="bg-[#1e293b]/50 text-slate-400 uppercase text-[10px] sm:text-xs tracking-wider font-semibold">
                                <tr>
                                    <th className="p-3 sm:p-4 pl-4 sm:pl-6">Concept</th>
                                    <th className="p-3 sm:p-4 text-right">Amount</th>
                                    <th className="p-3 sm:p-4 text-right hidden sm:table-cell">% of Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <tr className="hover:bg-white/5">
                                    <td className="p-3 sm:p-4 pl-4 sm:pl-6 text-white font-medium">Total Revenue (Gross)</td>
                                    <td className="p-3 sm:p-4 text-right text-white font-bold">{fmt(totalRevenue)}</td>
                                    <td className="p-3 sm:p-4 text-right text-slate-400 hidden sm:table-cell">100%</td>
                                </tr>
                                <tr className="hover:bg-white/5">
                                    <td className="p-3 sm:p-4 pl-4 sm:pl-6 text-slate-300">− Platform Fees</td>
                                    <td className="p-3 sm:p-4 text-right text-rose-400">-{fmt(platformFees)}</td>
                                    <td className="p-3 sm:p-4 text-right text-slate-500 hidden sm:table-cell">{totalRevenue ? ((platformFees / totalRevenue) * 100).toFixed(1) : 0}%</td>
                                </tr>
                                <tr className="hover:bg-white/5">
                                    <td className="p-3 sm:p-4 pl-4 sm:pl-6 text-slate-300">− Agency Commission (20%)</td>
                                    <td className="p-3 sm:p-4 text-right text-amber-400">-{fmt(agencyCommission)}</td>
                                    <td className="p-3 sm:p-4 text-right text-slate-500 hidden sm:table-cell">20.0%</td>
                                </tr>
                                <tr className="hover:bg-white/5">
                                    <td className="p-3 sm:p-4 pl-4 sm:pl-6 text-slate-300">− Expenses</td>
                                    <td className="p-3 sm:p-4 text-right text-rose-400">-{fmt(totalExpenses)}</td>
                                    <td className="p-3 sm:p-4 text-right text-slate-500 hidden sm:table-cell">{totalRevenue ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : 0}%</td>
                                </tr>
                                <tr className="bg-emerald-500/5 border-t-2 border-emerald-500/20">
                                    <td className="p-3 sm:p-4 pl-4 sm:pl-6 text-emerald-400 font-bold text-sm sm:text-base">= Owner Payout</td>
                                    <td className="p-3 sm:p-4 text-right text-emerald-400 font-bold text-base sm:text-lg">{fmt(ownerPayouts)}</td>
                                    <td className="p-3 sm:p-4 text-right text-emerald-400 font-medium hidden sm:table-cell">{totalRevenue ? ((ownerPayouts / totalRevenue) * 100).toFixed(1) : 0}%</td>
                                </tr>
                                <tr className="bg-indigo-500/5">
                                    <td className="p-3 sm:p-4 pl-4 sm:pl-6 text-indigo-400 font-bold">= Agency Net Profit</td>
                                    <td className="p-3 sm:p-4 text-right text-indigo-400 font-bold">{fmt(netProfit)}</td>
                                    <td className="p-3 sm:p-4 text-right text-indigo-400 hidden sm:table-cell">{totalRevenue ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>

            {/* ─── Add Expense Modal ────────────────── */}
            <AddExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSuccess={() => { fetchData(); setIsExpenseModalOpen(false); }}
                properties={properties}
            />
        </div>
    );
}

// ─── KPI Card ─────────────────────────────────────────
function KPICard({ title, value, icon, color, subtitle, className = '' }: {
    title: string; value: string; icon: React.ReactNode; color: string; subtitle: string; className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-xl bg-white/5 border border-white/5 p-3 sm:p-5 ${className}`}
        >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className={`inline-flex items-center justify-center rounded-lg ${color} p-1.5 sm:p-2 shadow-lg`}>
                    <div className="text-white">{icon}</div>
                </div>
                <p className="text-[10px] sm:text-sm font-medium text-slate-400">{title}</p>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-white">{value}</p>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">{subtitle}</p>
        </motion.div>
    );
}

// ─── Add Expense Modal ────────────────────────────────
function AddExpenseModal({ isOpen, onClose, onSuccess, properties }:
    { isOpen: boolean; onClose: () => void; onSuccess: () => void; properties: Property[] }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        category: 'CLEANING',
        amount: '',
        description: '',
        property_id: '',
        date: new Date().toISOString().split('T')[0],
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.amount || Number(form.amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.from('expenses').insert([{
                category: form.category,
                amount: parseFloat(form.amount),
                description: form.description || null,
                property_id: form.property_id || null,
                date: form.date,
            }]);
            if (error) throw error;
            setForm({ category: 'CLEANING', amount: '', description: '', property_id: '', date: new Date().toISOString().split('T')[0] });
            onSuccess();
        } catch (error: any) {
            console.error('Error creating expense:', error);
            alert(`Error: ${error?.message || 'Could not create expense'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-md bg-[#1e293b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                >
                    <div className="p-4 sm:p-6 border-b border-white/10 flex justify-between items-center bg-[#0f172a]/50">
                        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-rose-400" />
                            New Expense
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs sm:text-sm font-medium text-slate-300">Category</label>
                            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none">
                                {EXPENSE_CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs sm:text-sm font-medium text-slate-300">Amount (€)</label>
                                <input type="number" step="0.01" min="0" value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    required placeholder="0.00"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs sm:text-sm font-medium text-slate-300">Date</label>
                                <input type="date" value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs sm:text-sm font-medium text-slate-300">Property (optional)</label>
                            <select value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none">
                                <option value="">General (no property)</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs sm:text-sm font-medium text-slate-300">Description</label>
                            <input type="text" value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Optional description..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                        </div>

                        <div className="pt-3 sm:pt-4 flex justify-end gap-3 border-t border-white/5">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-300 hover:text-white">Cancel</button>
                            <button type="submit" disabled={loading}
                                className="px-5 sm:px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 text-sm">
                                {loading ? 'Saving...' : 'Add Expense'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
