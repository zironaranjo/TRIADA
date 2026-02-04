import { useEffect, useState } from 'react';
import { bookingsApi, propertiesApi, ownersApi } from '../api/client';
import { GlassCard } from "@/components/GlassCard";
import { motion } from "framer-motion";
import {
    Calendar, Home, Users, DollarSign,
    CheckCircle, Globe, Smartphone, CreditCard,
    Activity, ArrowUpRight, Zap, Settings
} from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Stats {
    totalBookings: number;
    totalProperties: number;
    totalOwners: number;
    revenue: number;
}

// Mock data for mini charts
const sparklineData = [
    { value: 10 }, { value: 15 }, { value: 12 }, { value: 20 }, { value: 18 }, { value: 25 }, { value: 22 }
];

export default function Dashboard() {
    const [stats, setStats] = useState<Stats>({
        totalBookings: 0,
        totalProperties: 0,
        totalOwners: 0,
        revenue: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [bookings, properties, owners] = await Promise.all([
                    bookingsApi.getAll(),
                    propertiesApi.getAll(),
                    ownersApi.getAll(),
                ]);

                const totalRevenue = bookings.data.reduce(
                    (sum: number, booking: any) => sum + Number(booking.totalPrice || 0),
                    0
                );

                setStats({
                    totalBookings: bookings.data.length,
                    totalProperties: properties.data.length,
                    totalOwners: owners.data.length,
                    revenue: totalRevenue,
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
                <p className="animate-pulse font-mono text-sm text-slate-400">Loading Command Center...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 p-6">
            <div className="mx-auto max-w-7xl space-y-8">

                {/* Header */}
                <header>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold tracking-tight text-white mb-2"
                    >
                        Dashboard
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400"
                    >
                        General overview of your vacation rental business
                    </motion.p>
                </header>

                {/* KPI Grid */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    <KpiCard
                        title="Total Bookings"
                        value={stats.totalBookings}
                        icon={<Calendar className="h-6 w-6 text-blue-400" />}
                        trend="+12%"
                        color="from-blue-500/20 to-blue-600/5"
                        borderColor="border-blue-500/20"
                    />
                    <KpiCard
                        title="Active Properties"
                        value={stats.totalProperties}
                        icon={<Home className="h-6 w-6 text-emerald-400" />}
                        trend="+2 New"
                        color="from-emerald-500/20 to-emerald-600/5"
                        borderColor="border-emerald-500/20"
                    />
                    <KpiCard
                        title="Owners"
                        value={stats.totalOwners}
                        icon={<Users className="h-6 w-6 text-amber-400" />}
                        trend="Stable"
                        color="from-amber-500/20 to-amber-600/5"
                        borderColor="border-amber-500/20"
                    />
                    <KpiCard
                        title="Total Revenue"
                        value={`€${stats.revenue.toLocaleString()}`}
                        icon={<DollarSign className="h-6 w-6 text-purple-400" />}
                        trend="+18%"
                        color="from-purple-500/20 to-purple-600/5"
                        borderColor="border-purple-500/20"
                    />
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Integrations & Actions */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Integrations Status */}
                        <GlassCard className="p-0 overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-yellow-400" />
                                    System Status
                                </h3>
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/20">All Systems Operational</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                                <IntegrationItem
                                    name="Airbnb"
                                    status="Sync Active"
                                    icon={<Home className="h-5 w-5 text-[#FF5A5F]" />}
                                />
                                <IntegrationItem
                                    name="Booking.com"
                                    status="Connected"
                                    icon={<Globe className="h-5 w-5 text-[#003580]" />}
                                />
                                <IntegrationItem
                                    name="Lodgify"
                                    status="Direct Booking"
                                    icon={<Smartphone className="h-5 w-5 text-gray-400" />}
                                />
                                <IntegrationItem
                                    name="Stripe"
                                    status="Processing"
                                    icon={<CreditCard className="h-5 w-5 text-[#635BFF]" />}
                                />
                            </div>
                        </GlassCard>

                        {/* Recent Activity Feed */}
                        <GlassCard>
                            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" />
                                Recent Activity
                            </h3>
                            <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
                                <ActivityItem
                                    title="New Booking Received"
                                    desc="Villa Paraíso - 4 nights"
                                    time="2 hours ago"
                                    icon={<Calendar className="h-4 w-4 text-blue-400" />}
                                />
                                <ActivityItem
                                    title="Payment Processed"
                                    desc="€1,250 via Stripe"
                                    time="5 hours ago"
                                    icon={<DollarSign className="h-4 w-4 text-green-400" />}
                                />
                                <ActivityItem
                                    title="New Property Added"
                                    desc="Urban Loft Madrid Central"
                                    time="Yesterday"
                                    icon={<Home className="h-4 w-4 text-purple-400" />}
                                />
                            </div>
                        </GlassCard>
                    </div>

                    {/* Right Column: Recommendations */}
                    <div className="space-y-6">
                        <GlassCard className="bg-gradient-to-b from-primary/10 to-transparent border-primary/20">
                            <h3 className="font-semibold text-lg mb-4 text-white">Recommended Actions</h3>
                            <div className="space-y-4">
                                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                                            <CheckCircle className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white group-hover:text-primary transition-colors">Connect First Property</h4>
                                            <p className="text-sm text-slate-400 mt-1">Start managing by adding your listings.</p>
                                        </div>
                                    </div>
                                    <button className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-medium transition-colors">
                                        Add Property
                                    </button>
                                </div>

                                <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                                            <Settings className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white group-hover:text-primary transition-colors">Automate Reports</h4>
                                            <p className="text-sm text-slate-400 mt-1">Set up monthly financial emails.</p>
                                        </div>
                                    </div>
                                    <button className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-md text-sm font-medium transition-colors">
                                        Configure
                                    </button>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, icon, trend, color, borderColor }: any) {
    return (
        <motion.div
            variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${color} border ${borderColor} p-6 backdrop-blur-sm`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/10 rounded-lg backdrop-blur-md">
                    {icon}
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend.includes('+') ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-slate-400'}`}>
                    {trend}
                </span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
            <p className="text-sm text-slate-400 font-medium">{title}</p>

            {/* Mini Chart Background Effect */}
            <div className="absolute -bottom-4 -right-4 w-24 h-16 opacity-30">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparklineData}>
                        <Area type="monotone" dataKey="value" stroke="#fff" fill="#fff" fillOpacity={0.2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    )
}

function IntegrationItem({ name, status, icon }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 transition-all">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-md">
                    {icon}
                </div>
                <div>
                    <h4 className="font-medium text-sm text-white">{name}</h4>
                    <p className="text-xs text-slate-500">{status}</p>
                </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
        </div>
    )
}

function ActivityItem({ title, desc, time, icon }: any) {
    return (
        <div className="relative pl-8">
            <div className="absolute left-0 top-0 p-1.5 bg-[#0f172a] border border-white/20 rounded-full z-10">
                {icon}
            </div>
            <div>
                <h4 className="text-sm font-medium text-white">{title}</h4>
                <p className="text-xs text-slate-400 mt-1">{desc}</p>
                <p className="text-[10px] text-slate-600 mt-2 uppercase tracking-wide">{time}</p>
            </div>
        </div>
    )
}
