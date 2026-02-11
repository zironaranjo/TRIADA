import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/GlassCard';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PLANS } from './Pricing';
import type { PlanId } from './Pricing';
import {
    CreditCard, Calendar, ArrowUpRight, Shield,
    CheckCircle, AlertCircle, Zap, Building
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Subscription {
    id: string;
    user_id: string;
    plan_id: PlanId;
    status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired';
    interval: 'monthly' | 'yearly';
    stripe_subscription_id: string | null;
    stripe_customer_id: string | null;
    current_period_start: string;
    current_period_end: string;
    created_at: string;
}

interface UsageStats {
    properties: number;
    bookings: number;
    contacts: number;
}

export default function Billing() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [usage, setUsage] = useState<UsageStats>({ properties: 0, bookings: 0, contacts: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch subscription
            const { data: subData } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user!.id)
                .single();

            if (subData) setSubscription(subData as Subscription);

            // Fetch usage counts
            const [propsRes, bookingsRes, contactsRes] = await Promise.allSettled([
                supabase.from('properties').select('id', { count: 'exact', head: true }),
                supabase.from('bookings').select('id', { count: 'exact', head: true }),
                supabase.from('contacts').select('id', { count: 'exact', head: true }),
            ]);

            setUsage({
                properties: propsRes.status === 'fulfilled' ? (propsRes.value.count || 0) : 0,
                bookings: bookingsRes.status === 'fulfilled' ? (bookingsRes.value.count || 0) : 0,
                contacts: contactsRes.status === 'fulfilled' ? (contactsRes.value.count || 0) : 0,
            });
        } catch (err) {
            console.error('Error fetching billing data:', err);
        } finally {
            setLoading(false);
        }
    };

    const currentPlan = subscription ? PLANS[subscription.plan_id] : null;
    const planLimits = currentPlan?.limits || PLANS.basic.limits;

    const getUsagePercent = (current: number, limit: number) => {
        if (limit === -1) return 0; // unlimited
        return Math.min((current / limit) * 100, 100);
    };

    const getUsageColor = (pct: number) => {
        if (pct >= 90) return 'bg-rose-500';
        if (pct >= 70) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
        active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Active' },
        trialing: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Trial' },
        past_due: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Past Due' },
        cancelled: { bg: 'bg-rose-500/10', text: 'text-rose-400', label: 'Cancelled' },
        expired: { bg: 'bg-slate-500/10', text: 'text-slate-400', label: 'Expired' },
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#0f172a]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 p-8">
            <div className="mx-auto max-w-4xl space-y-8">

                {/* ─── Header ───────────────────────── */}
                <div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-3xl font-bold text-white mb-2"
                    >
                        Billing & Subscription
                    </motion.h1>
                    <p className="text-slate-400">Manage your plan and billing information.</p>
                </div>

                {/* ─── Current Plan ──────────────────── */}
                <GlassCard className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                            <Shield className="h-5 w-5 text-indigo-400" />
                            Current Plan
                        </h3>
                        {subscription && (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[subscription.status]?.bg} ${statusStyles[subscription.status]?.text}`}>
                                {statusStyles[subscription.status]?.label || subscription.status}
                            </span>
                        )}
                    </div>

                    {subscription && currentPlan ? (
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${currentPlan.color} shadow-lg`}>
                                        <currentPlan.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white">{currentPlan.name}</h4>
                                        <p className="text-sm text-slate-400">{currentPlan.description}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-white">
                                        €{subscription.interval === 'monthly' ? currentPlan.price : Math.round(currentPlan.yearlyPrice / 12)}
                                        <span className="text-sm text-slate-400 font-normal">/mo</span>
                                    </p>
                                    <p className="text-xs text-slate-500">{subscription.interval}</p>
                                </div>
                            </div>

                            {/* Billing Period */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-xl p-4">
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Current Period</p>
                                    <p className="text-sm text-white mt-1">
                                        {new Date(subscription.current_period_start).toLocaleDateString()} — {new Date(subscription.current_period_end).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4">
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Next Billing</p>
                                    <p className="text-sm text-white mt-1">
                                        {new Date(subscription.current_period_end).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Link to="/pricing"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all">
                                    <ArrowUpRight className="h-4 w-4" /> Upgrade Plan
                                </Link>
                                <button className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-medium border border-white/10 transition-all">
                                    Manage Payment Method
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center space-y-4">
                            <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                                <CreditCard className="h-8 w-8 text-slate-500" />
                            </div>
                            <h3 className="text-lg font-medium text-white">No Active Subscription</h3>
                            <p className="text-slate-400 text-sm max-w-sm mx-auto">
                                Choose a plan to unlock all features and grow your business.
                            </p>
                            <Link to="/pricing"
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all">
                                <Zap className="h-4 w-4" /> View Plans
                            </Link>
                        </div>
                    )}
                </GlassCard>

                {/* ─── Usage ─────────────────────────── */}
                <GlassCard>
                    <h3 className="font-semibold text-white text-lg mb-6 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-indigo-400" />
                        Usage
                    </h3>
                    <div className="space-y-5">
                        {[
                            { label: 'Properties', current: usage.properties, limit: planLimits.properties, icon: Building },
                            { label: 'Bookings', current: usage.bookings, limit: planLimits.bookingsPerMonth, icon: Calendar },
                            { label: 'CRM Contacts', current: usage.contacts, limit: planLimits.contacts, icon: CheckCircle },
                        ].map((item) => {
                            const pct = getUsagePercent(item.current, item.limit);
                            const isUnlimited = item.limit === -1;
                            return (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <item.icon className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm font-medium text-white">{item.label}</span>
                                        </div>
                                        <span className="text-sm text-slate-400">
                                            {item.current} / {isUnlimited ? '∞' : item.limit}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: isUnlimited ? '5%' : `${pct}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                            className={`h-full rounded-full ${isUnlimited ? 'bg-emerald-500' : getUsageColor(pct)}`}
                                        />
                                    </div>
                                    {pct >= 90 && !isUnlimited && (
                                        <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" /> Approaching limit. Consider upgrading.
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>

                {/* ─── Billing History ───────────────── */}
                <GlassCard className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-white/5">
                        <h3 className="font-semibold text-white text-lg">Billing History</h3>
                    </div>
                    <div className="p-8 text-center text-slate-500 text-sm">
                        <Calendar className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                        No invoices yet. They will appear here after your first payment.
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
