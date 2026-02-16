import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/GlassCard';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionsApi, connectApi } from '../api/client';
import { PLANS } from './Pricing';
import type { PlanId } from './Pricing';
import {
    CreditCard, Calendar, ArrowUpRight, Shield,
    CheckCircle, AlertCircle, Zap, Building,
    ExternalLink, Loader2, Banknote, Percent, Link2
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

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
    const { t } = useTranslation();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [usage, setUsage] = useState<UsageStats>({ properties: 0, bookings: 0, contacts: 0 });
    const [loading, setLoading] = useState(true);
    const [portalLoading, setPortalLoading] = useState(false);
    const [connectStatus, setConnectStatus] = useState<{
        status: string;
        chargesEnabled: boolean;
        payoutsEnabled: boolean;
    } | null>(null);
    const [connectLoading, setConnectLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
            fetchConnectStatus();
            // Verify Stripe session after redirect
            const sessionId = searchParams.get('session_id');
            if (sessionId) {
                verifyStripeSession(sessionId);
            }
        }
    }, [user]);

    const verifyStripeSession = async (sessionId: string) => {
        try {
            const { data } = await subscriptionsApi.verifySession(sessionId);
            if (data?.customer) {
                // Update subscription with Stripe data
                await supabase.from('subscriptions').upsert({
                    user_id: user!.id,
                    email: user!.email || '',
                    full_name: user!.user_metadata?.full_name || '',
                    plan_id: data.metadata?.planId || 'basic',
                    status: 'active',
                    interval: data.metadata?.interval || 'monthly',
                    stripe_subscription_id: typeof data.subscription === 'string' ? data.subscription : data.subscription?.id,
                    stripe_customer_id: typeof data.customer === 'string' ? data.customer : data.customer?.id,
                    current_period_start: new Date().toISOString(),
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });
                fetchData();
            }
        } catch (err) {
            console.warn('Could not verify Stripe session:', err);
        }
    };

    const handleOpenPortal = async () => {
        if (!subscription?.stripe_customer_id) return;
        setPortalLoading(true);
        try {
            const { data } = await subscriptionsApi.createPortal(subscription.stripe_customer_id);
            if (data.url) window.location.href = data.url;
        } catch (err) {
            console.error('Failed to open portal:', err);
        } finally {
            setPortalLoading(false);
        }
    };

    const handleConnectOnboard = async () => {
        if (!user) return;
        setConnectLoading(true);
        try {
            const { data } = await connectApi.onboard(user.id);
            if (data.url) window.location.href = data.url;
        } catch (err) {
            console.error('Failed to start Connect onboarding:', err);
        } finally {
            setConnectLoading(false);
        }
    };

    const handleOpenConnectDashboard = async () => {
        if (!user) return;
        try {
            const { data } = await connectApi.getDashboardLink(user.id);
            if (data.url) window.open(data.url, '_blank');
        } catch (err) {
            console.error('Failed to open Connect dashboard:', err);
        }
    };

    const fetchConnectStatus = async () => {
        if (!user) return;
        try {
            const { data } = await connectApi.getStatus(user.id);
            setConnectStatus(data);
        } catch {
            // Connect not set up yet
        }
    };

    const fetchData = async () => {
        setLoading(true);
        const timeout = setTimeout(() => setLoading(false), 5000);
        try {
            try {
                const { data: subData } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', user!.id)
                    .maybeSingle();

                if (subData) setSubscription(subData as Subscription);
            } catch (subErr) {
                console.warn('Subscriptions table may not exist yet:', subErr);
            }

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
            clearTimeout(timeout);
            setLoading(false);
        }
    };

    const currentPlan = subscription ? PLANS[subscription.plan_id] : null;
    const planLimits = currentPlan?.limits || PLANS.starter.limits;
    const isFreePlan = currentPlan?.isFree ?? false;

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
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                <p className="animate-pulse text-sm text-slate-400">Loading Billing...</p>
            </div>
        </div>
    );

    return (
        <div className="text-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-4xl space-y-8">

                {/* ─── Header ───────────────────────── */}
                <div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1"
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
                                    {isFreePlan ? (
                                        <>
                                            <p className="text-2xl font-bold text-emerald-400">Free</p>
                                            <p className="text-xs text-slate-500">forever</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-2xl font-bold text-white">
                                                €{subscription.interval === 'monthly' ? currentPlan.price : Math.round(currentPlan.yearlyPrice / 12)}
                                                <span className="text-sm text-slate-400 font-normal">/mo</span>
                                            </p>
                                            <p className="text-xs text-slate-500">{subscription.interval === 'monthly' ? 'Monthly' : 'Yearly'}</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Free plan upgrade banner */}
                            {isFreePlan && (
                                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center gap-4">
                                    <Zap className="h-8 w-8 text-indigo-400 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white">Need more capacity?</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Upgrade to a paid plan to unlock more properties, unlimited bookings, and advanced features.
                                        </p>
                                    </div>
                                    <Link to="/pricing"
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all flex-shrink-0">
                                        View Plans
                                    </Link>
                                </div>
                            )}

                            {/* Billing Period - only for paid plans */}
                            {!isFreePlan && subscription.current_period_end && (
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
                            )}

                            {/* Commission Rate */}
                            {currentPlan && (
                                <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3">
                                    <Percent className="h-5 w-5 text-indigo-400" />
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-semibold">{t('billing.commissionRate')}</p>
                                        <p className="text-sm text-white mt-0.5">
                                            {currentPlan.commissionRate}% {t('billing.perBookingTransaction')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Link to="/pricing"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all">
                                    <ArrowUpRight className="h-4 w-4" /> {isFreePlan ? t('billing.upgradePlan') : t('billing.changePlan')}
                                </Link>
                                {!isFreePlan && subscription?.stripe_customer_id && (
                                    <button
                                        onClick={handleOpenPortal}
                                        disabled={portalLoading}
                                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-medium border border-white/10 transition-all flex items-center gap-2"
                                    >
                                        {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                                        {t('billing.managePayment')}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center space-y-4">
                            <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                                <CreditCard className="h-8 w-8 text-slate-500" />
                            </div>
                            <h3 className="text-lg font-medium text-white">No Active Subscription</h3>
                            <p className="text-slate-400 text-sm max-w-sm mx-auto">
                                Choose a plan to unlock all features. The Starter plan is free!
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

                {/* ─── Receive Payments (Stripe Connect) ── */}
                <GlassCard className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                            <Banknote className="h-5 w-5 text-emerald-400" />
                            {t('billing.receivePayments')}
                        </h3>
                        {connectStatus?.chargesEnabled && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400">
                                {t('billing.connected')}
                            </span>
                        )}
                    </div>
                    <div className="p-6">
                        {connectStatus?.chargesEnabled ? (
                            <div className="space-y-4">
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-white">{t('billing.stripeConnected')}</p>
                                        <p className="text-xs text-slate-400 mt-1">{t('billing.stripeConnectedDesc')}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 rounded-xl p-3 text-center">
                                        <p className="text-xs text-slate-500">{t('billing.charges')}</p>
                                        <p className="text-sm text-white mt-1 flex items-center justify-center gap-1">
                                            <CheckCircle className="h-3 w-3 text-emerald-400" /> {t('billing.enabled')}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-3 text-center">
                                        <p className="text-xs text-slate-500">{t('billing.payouts')}</p>
                                        <p className="text-sm text-white mt-1 flex items-center justify-center gap-1">
                                            {connectStatus.payoutsEnabled
                                                ? <><CheckCircle className="h-3 w-3 text-emerald-400" /> {t('billing.enabled')}</>
                                                : <><AlertCircle className="h-3 w-3 text-amber-400" /> {t('billing.pending')}</>}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleOpenConnectDashboard}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-medium border border-white/10 transition-all"
                                >
                                    <ExternalLink className="h-4 w-4" /> {t('billing.openStripeDashboard')}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 flex items-start gap-3">
                                    <Link2 className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-white">{t('billing.connectStripe')}</p>
                                        <p className="text-xs text-slate-400 mt-1">{t('billing.connectStripeDesc')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleConnectOnboard}
                                    disabled={connectLoading}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    {connectLoading
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : <><Banknote className="h-4 w-4" /> {t('billing.connectWithStripe')}</>}
                                </button>
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* ─── Billing History ───────────────── */}
                <GlassCard className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-white/5">
                        <h3 className="font-semibold text-white text-lg">{t('billing.history')}</h3>
                    </div>
                    <div className="p-8 text-center text-slate-500 text-sm">
                        <Calendar className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                        {t('billing.noInvoices')}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
