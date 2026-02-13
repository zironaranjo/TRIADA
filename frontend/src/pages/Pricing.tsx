import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Zap, Building, Crown, ArrowRight, Star, Gift, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ─── Plan Definitions ─────────────────────────────────
export const PLANS = {
    starter: {
        id: 'starter',
        name: 'Starter',
        price: 0,
        yearlyPrice: 0,
        icon: Gift,
        color: 'from-slate-400 to-slate-500',
        borderColor: 'border-slate-500/30',
        bgColor: 'bg-slate-500',
        description: 'Try Triadak for free, forever',
        isFree: true,
        limits: {
            properties: 1,
            bookingsPerMonth: 10,
            contacts: 20,
            users: 1,
        },
        features: [
            { name: '1 property', included: true },
            { name: '10 bookings/month', included: true },
            { name: 'Basic CRM (20 contacts)', included: true },
            { name: 'Calendar view', included: true },
            { name: 'Basic dashboard', included: true },
            { name: 'Email notifications', included: false },
            { name: 'Financial reports', included: false },
            { name: 'Payment links', included: false },
            { name: 'Owner portal', included: false },
            { name: 'API access', included: false },
        ],
    },
    basic: {
        id: 'basic',
        name: 'Basic',
        price: 29,
        yearlyPrice: 290,
        icon: Building,
        color: 'from-blue-500 to-cyan-500',
        borderColor: 'border-blue-500/30',
        bgColor: 'bg-blue-500',
        description: 'Perfect for small property managers',
        isFree: false,
        limits: {
            properties: 5,
            bookingsPerMonth: 50,
            contacts: 100,
            users: 1,
        },
        features: [
            { name: 'Up to 5 properties', included: true },
            { name: '50 bookings/month', included: true },
            { name: 'Full CRM (100 contacts)', included: true },
            { name: 'Calendar sync (iCal)', included: true },
            { name: 'Financial dashboard', included: true },
            { name: 'Email notifications', included: true },
            { name: 'Expense tracking', included: true },
            { name: 'Payment links', included: false },
            { name: 'Owner portal', included: false },
            { name: 'Priority support', included: false },
        ],
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        price: 79,
        yearlyPrice: 790,
        icon: Zap,
        color: 'from-indigo-500 to-purple-500',
        borderColor: 'border-indigo-500/30',
        bgColor: 'bg-indigo-500',
        description: 'For growing rental businesses',
        isFree: false,
        limits: {
            properties: 20,
            bookingsPerMonth: -1,
            contacts: 1000,
            users: 5,
        },
        features: [
            { name: 'Up to 20 properties', included: true },
            { name: 'Unlimited bookings', included: true },
            { name: 'Advanced CRM (1,000 contacts)', included: true },
            { name: 'Calendar sync (iCal)', included: true },
            { name: 'Advanced financial reports', included: true },
            { name: 'Email notifications', included: true },
            { name: 'Payment links (Stripe)', included: true },
            { name: 'Owner portal', included: true },
            { name: 'API access', included: false },
            { name: 'Priority support', included: true },
        ],
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 149,
        yearlyPrice: 1490,
        icon: Crown,
        color: 'from-amber-500 to-orange-500',
        borderColor: 'border-amber-500/30',
        bgColor: 'bg-amber-500',
        description: 'For large-scale operations',
        isFree: false,
        limits: {
            properties: -1,
            bookingsPerMonth: -1,
            contacts: -1,
            users: -1,
        },
        features: [
            { name: 'Unlimited properties', included: true },
            { name: 'Unlimited bookings', included: true },
            { name: 'Unlimited CRM contacts', included: true },
            { name: 'Calendar sync (iCal)', included: true },
            { name: 'Advanced financial reports', included: true },
            { name: 'Email notifications', included: true },
            { name: 'Payment links (Stripe)', included: true },
            { name: 'Owner portal', included: true },
            { name: 'Full API access', included: true },
            { name: 'Dedicated support + onboarding', included: true },
        ],
    },
};

export type PlanId = keyof typeof PLANS;

// ─── Main Pricing Page ────────────────────────────────
export default function Pricing() {
    const { user, refreshSubscription } = useAuth();
    const navigate = useNavigate();
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
    const [loading, setLoading] = useState('');
    const [success, setSuccess] = useState<{ plan: string; message: string } | null>(null);

    const handleSelectPlan = async (planId: PlanId) => {
        if (!user) {
            alert('Please log in first');
            return;
        }
        setLoading(planId);
        try {
            const selectedPlan = PLANS[planId];

            // Starter plan (free): activate directly without Stripe
            if (selectedPlan.isFree) {
                const { error } = await supabase.from('subscriptions').upsert({
                    user_id: user.id,
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
                    plan_id: planId,
                    status: 'active',
                    interval: 'monthly',
                    current_period_start: new Date().toISOString(),
                    current_period_end: null, // no expiration
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

                if (error) throw error;
                await refreshSubscription();
                setSuccess({ plan: 'Starter', message: 'Your free plan is now active! Redirecting to dashboard...' });
                setTimeout(() => navigate('/dashboard'), 1500);
                return;
            }

            // Paid plans: try Stripe Checkout
            const API_URL = import.meta.env.VITE_API_URL || 'https://api.triadak.io';
            const res = await fetch(`${API_URL}/subscriptions/create-checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    email: user.email,
                    planId,
                    interval: billing,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.url) {
                    window.location.href = data.url;
                    return;
                }
            }

            // Fallback: save directly to Supabase (test mode)
            const { error } = await supabase.from('subscriptions').upsert({
                user_id: user.id,
                email: user.email || '',
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
                plan_id: planId,
                status: 'trialing',
                interval: billing,
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14-day trial
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

            if (error) throw error;
            await refreshSubscription();
            setSuccess({ plan: selectedPlan.name, message: '14-day free trial activated! Redirecting to dashboard...' });
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (err: any) {
            console.error('Error selecting plan:', err);
            alert(`Error: ${err?.message || 'Could not activate plan'}`);
        } finally {
            setLoading('');
        }
    };

    return (
        <div className="text-slate-100 p-4 sm:p-6 lg:p-8">
            {/* ─── Success Toast ───────────────────── */}
            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center gap-3 min-w-[320px]"
                    >
                        <CheckCircle className="h-6 w-6 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">{success.plan} Plan Activated!</p>
                            <p className="text-sm text-emerald-100">{success.message} Redirecting...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mx-auto max-w-6xl space-y-10">

                {/* ─── Header ───────────────────────── */}
                <div className="text-center space-y-4 pt-8">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white"
                    >
                        Choose Your Plan
                    </motion.h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Scale your vacation rental business with the right tools. All plans include a 14-day free trial.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-3 mt-6">
                        <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
                        <button
                            onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
                            className={`relative w-14 h-7 rounded-full transition-colors ${billing === 'yearly' ? 'bg-indigo-600' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${billing === 'yearly' ? 'translate-x-7' : 'translate-x-0.5'}`} />
                        </button>
                        <span className={`text-sm font-medium ${billing === 'yearly' ? 'text-white' : 'text-slate-500'}`}>
                            Yearly
                            <span className="ml-1.5 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                Save 17%
                            </span>
                        </span>
                    </div>
                </div>

                {/* ─── Plan Cards ────────────────────── */}
                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
                    {Object.values(PLANS).map((plan, i) => {
                        const isPopular = plan.id === 'pro';
                        const isFree = plan.isFree;
                        const price = isFree ? 0 : (billing === 'monthly' ? plan.price : Math.round(plan.yearlyPrice / 12));

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`relative rounded-2xl border ${
                                    isPopular 
                                        ? 'border-indigo-500/50 shadow-xl shadow-indigo-500/10' 
                                        : isFree 
                                            ? 'border-emerald-500/30' 
                                            : 'border-white/10'
                                } bg-[#1e293b] overflow-hidden flex flex-col`}
                            >
                                {/* Popular Badge */}
                                {isPopular && (
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl flex items-center gap-1">
                                            <Star className="h-3 w-3" /> MOST POPULAR
                                        </div>
                                    </div>
                                )}

                                {/* Free Badge */}
                                {isFree && (
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl flex items-center gap-1">
                                            <Gift className="h-3 w-3" /> FREE
                                        </div>
                                    </div>
                                )}

                                <div className="p-6 flex-1">
                                    {/* Plan Header */}
                                    <div className={`inline-flex items-center justify-center p-3 rounded-xl bg-gradient-to-br ${plan.color} shadow-lg mb-4`}>
                                        <plan.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                                    <p className="text-sm text-slate-400 mt-1">{plan.description}</p>

                                    {/* Price */}
                                    <div className="mt-6 mb-8">
                                        {isFree ? (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-bold text-emerald-400">Free</span>
                                                <span className="text-slate-400">forever</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-bold text-white">€{price}</span>
                                                    <span className="text-slate-400">/mo</span>
                                                </div>
                                                {billing === 'yearly' && (
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        €{plan.yearlyPrice}/year (billed annually)
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-3">
                                        {plan.features.map((feature) => (
                                            <li key={feature.name} className="flex items-center gap-3">
                                                {feature.included ? (
                                                    <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                                                ) : (
                                                    <X className="h-4 w-4 text-slate-600 flex-shrink-0" />
                                                )}
                                                <span className={`text-sm ${feature.included ? 'text-slate-300' : 'text-slate-600'}`}>
                                                    {feature.name}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* CTA Button */}
                                <div className="p-6 pt-0">
                                    <button
                                        onClick={() => handleSelectPlan(plan.id as PlanId)}
                                        disabled={!!loading}
                                        className={`w-full py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                                            isFree
                                                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40'
                                                : isPopular
                                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40'
                                                    : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                                        } disabled:opacity-50`}
                                    >
                                        {loading === plan.id ? (
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                {isFree ? 'Start Free' : 'Get Started'} <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* ─── FAQ / Trust ───────────────────── */}
                <div className="text-center py-8 space-y-3">
                    <p className="text-slate-400 text-sm">
                        Start free with the <span className="text-emerald-400 font-medium">Starter</span> plan. 
                        Paid plans include a <span className="text-white font-medium">14-day free trial</span>. No credit card required.
                    </p>
                    <p className="text-slate-500 text-xs">
                        Cancel anytime. Prices in EUR. VAT may apply.
                    </p>
                </div>
            </div>
        </div>
    );
}
