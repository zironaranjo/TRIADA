import { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { api } from "@/api/client";
import { DollarSign, TrendingUp, Users, CreditCard, Calendar, Filter, Download } from "lucide-react";
import { motion } from "framer-motion";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface DashboardStats {
    totalRevenue: number;
    platformFees: number;
    agencyRevenue: number;
    ownerPayouts: number;
    recentSettlements: any[];
}

// Mock data for charts (until backend provides time-series)
const monthlyData = [
    { name: 'Jan', revenue: 4000, payout: 2400 },
    { name: 'Feb', revenue: 3000, payout: 1398 },
    { name: 'Mar', revenue: 9800, payout: 6800 },
    { name: 'Apr', revenue: 3908, payout: 2780 },
    { name: 'May', revenue: 4800, payout: 2890 },
    { name: 'Jun', revenue: 3800, payout: 2390 },
];

const platformData = [
    { name: 'Airbnb', value: 400, color: '#FF5A5F' },
    { name: 'Booking.com', value: 300, color: '#003580' },
    { name: 'Direct', value: 300, color: '#10b981' },
];

export default function FinanceDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get("/accounting/dashboard");
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0
        }).format(value);
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="animate-pulse font-mono text-sm text-slate-400">Loading Financial Engine...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 p-6 overflow-hidden">
            <div className="mx-auto max-w-7xl space-y-8">

                {/* Header Section */}
                <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-3xl font-bold tracking-tight text-white"
                        >
                            Financial Overview
                        </motion.h1>
                        <p className="text-slate-400">Welcome back, analyze your property performance.</p>
                    </div>

                    <div className="flex gap-3">
                        <GlassCard className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 cursor-pointer">
                            <Calendar className="h-4 w-4 text-slate-300" />
                            <span className="text-sm">This Year</span>
                        </GlassCard>
                        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-105 active:scale-95">
                            <Download className="h-4 w-4" />
                            Export Report
                        </button>
                    </div>
                </header>

                {/* Sidebar + Main Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">

                    {/* Filters / Left Stats Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6 lg:col-span-1"
                    >
                        <GlassCard className="space-y-6">
                            <div className="flex items-center gap-2 text-primary-light mb-4">
                                <Filter className="h-5 w-5" />
                                <h3 className="font-semibold">Quick Filters</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 uppercase">Property Group</label>
                                    <select className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 text-sm focus:border-primary outline-none">
                                        <option>All Properties</option>
                                        <option>Luxury Villas</option>
                                        <option>Urban Apts</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-400 uppercase">Region</label>
                                    <select className="w-full bg-slate-900/50 border border-slate-700 rounded-md p-2 text-sm focus:border-primary outline-none">
                                        <option>All Regions</option>
                                        <option>Bali</option>
                                        <option>Madrid</option>
                                    </select>
                                </div>
                            </div>
                        </GlassCard>

                        <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white shadow-xl">
                            <h3 className="text-sm font-medium opacity-80">Net Profit (YTD)</h3>
                            <div className="mt-2 text-3xl font-bold">€124k</div>
                            <div className="mt-4 flex items-center gap-2 text-xs">
                                <span className="rounded-full bg-white/20 px-2 py-1">+12%</span>
                                <span className="opacity-70">vs last year</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">

                        {/* Top KPI Cards */}
                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                        >
                            <Card
                                title="Total Revenue"
                                value={stats?.totalRevenue || 0}
                                icon={<DollarSign className="h-6 w-6" />}
                                color="bg-primary"
                                subtext="+24% this month"
                            />
                            <Card
                                title="Owner Payouts"
                                value={stats?.ownerPayouts || 0}
                                icon={<Users className="h-6 w-6" />}
                                color="bg-emerald-500"
                                subtext="Processed"
                            />
                            <Card
                                title="Agency Fees"
                                value={stats?.agencyRevenue || 0}
                                icon={<TrendingUp className="h-6 w-6" />}
                                color="bg-amber-500"
                                subtext="Commission"
                            />
                            <Card
                                title="Platform Fees"
                                value={stats?.platformFees || 0}
                                icon={<CreditCard className="h-6 w-6" />}
                                color="bg-rose-500"
                                subtext="Stripe / OTA"
                            />
                        </motion.div>

                        {/* Charts Row */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <GlassCard className="min-h-[300px] flex flex-col">
                                <h3 className="mb-6 font-semibold md:text-lg">Revenue vs Payouts</h3>
                                <div className="flex-1 w-full min-h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={monthlyData}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value / 1000}k`} />
                                            <RechartsTooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                                itemStyle={{ color: '#e2e8f0' }}
                                            />
                                            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                            <Area type="monotone" dataKey="payout" stroke="#10b981" strokeWidth={3} fillOpacity={0} fill="url(#colorPayout)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </GlassCard>

                            <GlassCard className="min-h-[300px] flex flex-col">
                                <h3 className="mb-6 font-semibold md:text-lg">Revenue by Platform</h3>
                                <div className="flex-1 w-full flex items-center justify-center min-h-[200px]">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={platformData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {platformData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-4 mt-4">
                                    {platformData.map((d) => (
                                        <div key={d.name} className="flex items-center gap-2 text-xs text-slate-400">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                                            {d.name}
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>
                        </div>

                        {/* Recent Transactions Styled Table */}
                        <GlassCard className="overflow-hidden p-0">
                            <div className="p-6 border-b border-white/5 bg-white/5">
                                <h3 className="font-semibold text-lg">Recent Settlements</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="bg-[#1e293b]/50 text-slate-200 uppercase text-xs tracking-wider font-semibold">
                                        <tr>
                                            <th className="p-4 pl-6">Booking ID</th>
                                            <th className="p-4">Platform</th>
                                            <th className="p-4 text-right">Revenue</th>
                                            <th className="p-4 text-right">Payout</th>
                                            <th className="p-4 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {stats?.recentSettlements?.map((s) => (
                                            <tr key={s.id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 pl-6 font-mono text-xs text-primary-light">#{s.id.slice(0, 6)}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${s.booking?.platform === 'AIRBNB' ? 'bg-[#FF5A5F]' : 'bg-emerald-500'}`}></div>
                                                        {s.booking?.platform || 'Direct'}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-white font-medium text-right">{formatCurrency(s.totalRevenue)}</td>
                                                <td className="p-4 text-emerald-400 font-bold text-right">{formatCurrency(s.ownerPayout)}</td>
                                                <td className="p-4 text-center">
                                                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                                                        Paid
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {(!stats?.recentSettlements || stats.recentSettlements.length === 0) && (
                                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                                        <div className="p-4 bg-slate-900 rounded-full mb-3">
                                            <Calendar className="h-6 w-6 text-slate-600" />
                                        </div>
                                        No recent activity
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Card({ title, value, icon, color, subtext }: { title: string, value: number, icon: any, color: string, subtext: string }) {
    return (
        <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            className="relative overflow-hidden rounded-xl bg-[#1e293b] p-6 shadow-lg border border-slate-800 transition-all hover:border-slate-700 hover:translate-y-[-2px]"
        >
            <div className={`absolute top-0 right-0 p-3 opacity-10 ${color.replace('bg-', 'text-')}`}>
                <div className="scale-150 transform">{icon}</div>
            </div>

            <dt>
                <div className={`inline-flex items-center justify-center rounded-md ${color} p-2 shadow-lg mb-4`}>
                    <div className="text-white">{icon}</div>
                </div>
                <p className="truncate text-sm font-medium text-slate-400">{title}</p>
            </dt>
            <dd className="flex items-baseline pb-1 sm:pb-2">
                <p className="text-2xl font-bold text-white">
                    {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value)}
                </p>
            </dd>
            <div className="text-xs text-slate-500">
                {subtext}
            </div>
        </motion.div>
    )
}
