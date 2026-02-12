import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    CalendarDays,
    Users,
    PiggyBank,
    BarChart3,
    Shield,
    Zap,
    ArrowRight,
    Check,
    ChevronDown,
    Menu,
    X,
    Star,
    Globe,
    Clock,
    Smartphone,
} from 'lucide-react';

// ─── Animation Variants ───────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.45 },
    }),
};

const stagger = {
    visible: { transition: { staggerChildren: 0.08 } },
};

// ─── Navbar ───────────────────────────────────────────
function Navbar() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close mobile menu on resize to desktop
    useEffect(() => {
        const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const links = [
        { label: 'Features', href: '#features' },
        { label: 'How it works', href: '#how-it-works' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'FAQ', href: '#faq' },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0f172a]/95 backdrop-blur-xl shadow-lg shadow-black/10' : 'bg-[#0f172a]/70 backdrop-blur-md'} border-b border-white/5`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Mobile navbar — compact */}
                <div className="flex md:hidden items-center justify-between py-2">
                    <Link to="/" className="flex items-center flex-shrink-0">
                        <img src="/logotriadak.png" alt="Triadak" className="h-12 w-auto object-contain" />
                    </Link>
                    <button
                        onClick={() => setOpen(!open)}
                        className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors"
                        aria-label="Toggle menu"
                    >
                        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {/* Desktop navbar — full size logo */}
                <div className="hidden md:flex items-center justify-between h-36">
                    <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                        <img src="/logotriadak.png" alt="Triadak" className="h-48 w-auto object-contain" />
                    </Link>

                    <div className="flex items-center gap-8">
                        {links.map((l) => (
                            <a
                                key={l.href}
                                href={l.href}
                                className="text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                {l.label}
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/login"
                            className="text-sm text-slate-300 hover:text-white transition-colors px-4 py-2"
                        >
                            Sign in
                        </Link>
                        <Link
                            to="/login"
                            className="text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                        >
                            Start Free
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden bg-[#0f172a]/98 backdrop-blur-xl border-t border-white/5 overflow-hidden"
                    >
                        <div className="px-4 py-3 space-y-1">
                            {links.map((l) => (
                                <a
                                    key={l.href}
                                    href={l.href}
                                    onClick={() => setOpen(false)}
                                    className="block text-base text-slate-300 hover:text-white transition-colors py-3 px-2 rounded-lg hover:bg-white/5"
                                >
                                    {l.label}
                                </a>
                            ))}
                            <div className="pt-3 mt-2 border-t border-white/5 space-y-2">
                                <Link
                                    to="/login"
                                    onClick={() => setOpen(false)}
                                    className="block text-base text-slate-300 hover:text-white transition-colors py-3 px-2 text-center rounded-lg hover:bg-white/5"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to="/login"
                                    onClick={() => setOpen(false)}
                                    className="block text-base font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 py-3 rounded-xl text-center"
                                >
                                    Start Free
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

// ─── Hero Section ─────────────────────────────────────
function Hero() {
    return (
        <section className="relative pt-24 pb-12 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
            {/* Background effects — smaller on mobile for perf */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-1/4 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-indigo-500/15 rounded-full blur-[100px] sm:blur-[150px]" />
                <div className="absolute bottom-0 right-1/4 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-purple-500/10 rounded-full blur-[80px] sm:blur-[120px]" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-4xl mx-auto">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-1.5 sm:gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 rounded-full mb-6 sm:mb-8"
                    >
                        <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span>The modern way to manage vacation rentals</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-[1.15] tracking-tight"
                    >
                        Manage your rentals{' '}
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            at lightspeed
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed px-2"
                    >
                        Properties, bookings, guests, and finances — all in one powerful platform.
                        Automate your vacation rental business and focus on what matters.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-2"
                    >
                        <Link
                            to="/login"
                            className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base hover:shadow-xl hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group"
                        >
                            Start Free — No Credit Card
                            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a
                            href="#features"
                            className="w-full sm:w-auto text-slate-300 hover:text-white font-medium px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl border border-white/10 hover:border-white/20 transition-all text-sm sm:text-base text-center"
                        >
                            See Features
                        </a>
                    </motion.div>

                    {/* Social Proof */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-slate-500"
                    >
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-400 text-amber-400" />
                            ))}
                            <span className="ml-1.5 sm:ml-2 text-slate-400">5.0 from early users</span>
                        </div>
                        <span className="hidden sm:block text-slate-700">|</span>
                        <span className="text-slate-400">Free plan available forever</span>
                    </motion.div>
                </div>

                {/* Hero Screenshot / Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.7 }}
                    className="mt-10 sm:mt-16 lg:mt-20 relative px-1"
                >
                    <div className="relative rounded-xl sm:rounded-2xl border border-white/10 bg-[#1e293b]/80 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 overflow-hidden mx-auto max-w-5xl">
                        {/* Browser chrome */}
                        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-[#0f172a] border-b border-white/5">
                            <div className="flex gap-1 sm:gap-1.5">
                                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500/60" />
                                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-amber-500/60" />
                                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500/60" />
                            </div>
                            <div className="flex-1 mx-2 sm:mx-4">
                                <div className="bg-white/5 rounded-md sm:rounded-lg px-2 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs text-slate-500 max-w-md mx-auto text-center truncate">
                                    app.triadak.io/dashboard
                                </div>
                            </div>
                        </div>
                        {/* Dashboard preview content */}
                        <div className="p-3 sm:p-6 lg:p-8 space-y-3 sm:space-y-4">
                            {/* Stats row */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                                {[
                                    { label: 'Properties', value: '12', color: 'from-blue-500 to-cyan-500' },
                                    { label: 'Bookings', value: '84', color: 'from-indigo-500 to-purple-500' },
                                    { label: 'Revenue', value: '€24,560', color: 'from-emerald-500 to-green-500' },
                                    { label: 'Occupancy', value: '87%', color: 'from-amber-500 to-orange-500' },
                                ].map((stat) => (
                                    <div key={stat.label} className="bg-white/5 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-white/5">
                                        <p className="text-[10px] sm:text-xs text-slate-500">{stat.label}</p>
                                        <p className={`text-lg sm:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                                            {stat.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {/* Placeholder bars */}
                            <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/5 h-24 sm:h-40 flex items-end gap-1 sm:gap-2 px-3 sm:px-6">
                                {[65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95, 70].map((h, i) => (
                                    <div
                                        key={i}
                                        className={`flex-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-sm sm:rounded-t-md opacity-60 ${i >= 8 ? 'hidden sm:block' : ''}`}
                                        style={{ height: `${h}%` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Glow under mockup */}
                    <div className="absolute -bottom-8 sm:-bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-16 sm:h-20 bg-indigo-500/20 blur-3xl rounded-full" />
                </motion.div>
            </div>
        </section>
    );
}

// ─── Features Section ─────────────────────────────────
const features = [
    {
        icon: Building2,
        title: 'Property Management',
        description: 'Add unlimited properties with details, photos, pricing, and availability. Track everything in one place.',
        color: 'from-blue-500 to-cyan-500',
    },
    {
        icon: CalendarDays,
        title: 'Smart Bookings',
        description: 'Manage reservations, check-ins, check-outs, and calendar availability. Never double-book again.',
        color: 'from-indigo-500 to-purple-500',
    },
    {
        icon: Users,
        title: 'Guest CRM',
        description: 'Build guest profiles automatically. Track preferences, history, and communication in one view.',
        color: 'from-violet-500 to-fuchsia-500',
    },
    {
        icon: PiggyBank,
        title: 'Finance Engine',
        description: 'Track income, expenses, and profitability per property. Real-time financial overview.',
        color: 'from-emerald-500 to-green-500',
    },
    {
        icon: BarChart3,
        title: 'Analytics Dashboard',
        description: 'Occupancy rates, revenue trends, and performance metrics at a glance. Data-driven decisions.',
        color: 'from-amber-500 to-orange-500',
    },
    {
        icon: Shield,
        title: 'Secure & Private',
        description: 'Enterprise-grade security with row-level isolation. Your data is yours — always encrypted, always safe.',
        color: 'from-red-500 to-rose-500',
    },
];

function Features() {
    return (
        <section id="features" className="py-14 sm:py-20 lg:py-32 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={fadeUp}
                    custom={0}
                    className="text-center max-w-2xl mx-auto mb-10 sm:mb-16"
                >
                    <p className="text-xs sm:text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-2 sm:mb-3">Features</p>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 px-2">
                        Everything you need to run your rental business
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-lg px-2">
                        From properties to payments, Triadak covers the entire vacation rental workflow.
                    </p>
                </motion.div>

                {/* Feature Cards */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={stagger}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
                >
                    {features.map((f, i) => (
                        <motion.div
                            key={f.title}
                            variants={fadeUp}
                            custom={i}
                            className="group p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border border-white/5 bg-[#1e293b]/50 hover:bg-[#1e293b] hover:border-white/10 transition-all duration-300"
                        >
                            <div className={`inline-flex items-center justify-center p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${f.color} shadow-lg mb-4 sm:mb-5`}>
                                <f.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 sm:mb-2">{f.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

// ─── How It Works ─────────────────────────────────────
const steps = [
    {
        num: '01',
        title: 'Create your account',
        description: 'Sign up in seconds with email or Google. Choose the Starter plan — it\'s free forever.',
        icon: Globe,
    },
    {
        num: '02',
        title: 'Add your properties',
        description: 'Enter property details, set pricing, and define availability. It takes less than 2 minutes per property.',
        icon: Building2,
    },
    {
        num: '03',
        title: 'Start managing',
        description: 'Receive bookings, manage guests, track finances, and grow your business — all from one dashboard.',
        icon: BarChart3,
    },
];

function HowItWorks() {
    return (
        <section id="how-it-works" className="py-14 sm:py-20 lg:py-32 relative">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-purple-500/8 rounded-full blur-[80px] sm:blur-[120px]" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={fadeUp}
                    custom={0}
                    className="text-center max-w-2xl mx-auto mb-10 sm:mb-16"
                >
                    <p className="text-xs sm:text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-2 sm:mb-3">How it works</p>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                        Up and running in minutes
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-lg px-2">
                        No complex setup. No training required. Just sign up and start managing.
                    </p>
                </motion.div>

                {/* Steps */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={stagger}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
                >
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.num}
                            variants={fadeUp}
                            custom={i}
                            className="text-center flex flex-col items-center"
                        >
                            <div className="relative inline-flex items-center justify-center mb-4 sm:mb-6">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
                                    <step.icon className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-400" />
                                </div>
                                <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 text-[10px] sm:text-xs font-bold bg-indigo-500 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center">
                                    {step.num}
                                </span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-white mb-1.5 sm:mb-2">{step.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{step.description}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

// ─── Pricing Section ──────────────────────────────────
const plans = [
    {
        name: 'Starter',
        price: 'Free',
        period: 'forever',
        description: 'Perfect to get started',
        features: ['1 property', '10 bookings/month', 'Basic CRM (20 contacts)', 'Calendar view', 'Basic dashboard'],
        cta: 'Start Free',
        popular: false,
        gradient: 'from-emerald-500 to-green-500',
    },
    {
        name: 'Basic',
        price: '€29',
        period: '/mo',
        description: 'For small property managers',
        features: ['Up to 5 properties', '50 bookings/month', 'Full CRM (100 contacts)', 'Financial dashboard', 'Email notifications'],
        cta: 'Start 14-Day Trial',
        popular: false,
        gradient: 'from-blue-500 to-cyan-500',
    },
    {
        name: 'Pro',
        price: '€79',
        period: '/mo',
        description: 'For growing businesses',
        features: ['Up to 20 properties', 'Unlimited bookings', 'Advanced CRM', 'Payment links (Stripe)', 'Owner portal'],
        cta: 'Start 14-Day Trial',
        popular: true,
        gradient: 'from-indigo-500 to-purple-500',
    },
    {
        name: 'Enterprise',
        price: '€149',
        period: '/mo',
        description: 'For large-scale operations',
        features: ['Unlimited everything', 'Full API access', 'Dedicated support', 'Custom onboarding', 'Priority features'],
        cta: 'Contact Sales',
        popular: false,
        gradient: 'from-amber-500 to-orange-500',
    },
];

function Pricing() {
    return (
        <section id="pricing" className="py-14 sm:py-20 lg:py-32 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={fadeUp}
                    custom={0}
                    className="text-center max-w-2xl mx-auto mb-10 sm:mb-16"
                >
                    <p className="text-xs sm:text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-2 sm:mb-3">Pricing</p>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                        Simple, transparent pricing
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-lg px-2">
                        Start free. Upgrade when you need more. No hidden fees.
                    </p>
                </motion.div>

                {/* Plans — horizontal scroll on mobile for better UX */}
                <div className="sm:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide pb-4">
                    <div className="flex gap-4 w-max">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative rounded-xl border ${plan.popular ? 'border-indigo-500/50 shadow-xl shadow-indigo-500/10' : 'border-white/10'} bg-[#1e293b] overflow-hidden flex flex-col w-[280px] flex-shrink-0`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                                            <Star className="h-2.5 w-2.5" /> MOST POPULAR
                                        </div>
                                    </div>
                                )}
                                <div className="p-5 flex-1">
                                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                                    <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
                                    <div className="mt-3 mb-5 flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-white">{plan.price}</span>
                                        <span className="text-slate-400 text-sm">{plan.period}</span>
                                    </div>
                                    <ul className="space-y-2">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                                                <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="p-5 pt-0">
                                    <Link
                                        to="/login"
                                        className={`block w-full py-2.5 rounded-xl font-semibold text-sm text-center transition-all ${plan.popular
                                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20'
                                                : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        {plan.cta}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Scroll hint */}
                    <p className="text-center text-slate-600 text-xs mt-3">Swipe to see all plans →</p>
                </div>

                {/* Plans — grid on tablet+ */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={stagger}
                    className="hidden sm:grid sm:grid-cols-2 xl:grid-cols-4 gap-6"
                >
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            variants={fadeUp}
                            custom={i}
                            className={`relative rounded-2xl border ${plan.popular ? 'border-indigo-500/50 shadow-xl shadow-indigo-500/10' : 'border-white/10'} bg-[#1e293b] overflow-hidden flex flex-col`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0">
                                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl flex items-center gap-1">
                                        <Star className="h-3 w-3" /> MOST POPULAR
                                    </div>
                                </div>
                            )}

                            <div className="p-6 flex-1">
                                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                <p className="text-sm text-slate-400 mt-1">{plan.description}</p>
                                <div className="mt-4 mb-6 flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                                    <span className="text-slate-400 text-sm">{plan.period}</span>
                                </div>
                                <ul className="space-y-2.5">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                                            <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-6 pt-0">
                                <Link
                                    to="/login"
                                    className={`block w-full py-3 rounded-xl font-semibold text-sm text-center transition-all ${plan.popular
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40'
                                            : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                <p className="text-center text-slate-500 text-xs sm:text-sm mt-6 sm:mt-8 px-2">
                    All paid plans include a 14-day free trial. No credit card required.
                </p>
            </div>
        </section>
    );
}

// ─── Testimonials ─────────────────────────────────────
const testimonials = [
    {
        quote: 'Triadak completely transformed how we manage our 8 properties. The automation saves us hours every week.',
        name: 'Maria Rodriguez',
        role: 'Property Manager, Malaga',
        avatar: 'MR',
    },
    {
        quote: "The financial tracking alone is worth it. I finally have a clear picture of profitability per property.",
        name: 'James Mitchell',
        role: 'Rental Owner, Barcelona',
        avatar: 'JM',
    },
    {
        quote: 'We switched from spreadsheets to Triadak and never looked back. The CRM is incredibly useful.',
        name: 'Sofia Andersson',
        role: 'Co-host, Lisbon',
        avatar: 'SA',
    },
];

function Testimonials() {
    return (
        <section className="py-14 sm:py-20 lg:py-32 relative">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-indigo-500/8 rounded-full blur-[100px] sm:blur-[150px]" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={fadeUp}
                    custom={0}
                    className="text-center max-w-2xl mx-auto mb-10 sm:mb-16"
                >
                    <p className="text-xs sm:text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-2 sm:mb-3">Testimonials</p>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                        Trusted by property managers
                    </h2>
                </motion.div>

                {/* Mobile: vertical stack | Desktop: 3-col grid */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={stagger}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
                >
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={t.name}
                            variants={fadeUp}
                            custom={i}
                            className="p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border border-white/5 bg-[#1e293b]/50"
                        >
                            {/* Stars */}
                            <div className="flex gap-1 mb-3 sm:mb-4">
                                {[...Array(5)].map((_, j) => (
                                    <Star key={j} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-400 text-amber-400" />
                                ))}
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed mb-4 sm:mb-6">"{t.quote}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[10px] sm:text-xs font-bold text-white">{t.avatar}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{t.name}</p>
                                    <p className="text-xs text-slate-500">{t.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

// ─── FAQ ──────────────────────────────────────────────
const faqs = [
    {
        q: 'Is Triadak really free to start?',
        a: 'Yes! The Starter plan is completely free — forever. It includes 1 property, 10 bookings per month, and basic CRM. No credit card required.',
    },
    {
        q: 'Can I upgrade or downgrade at any time?',
        a: 'Absolutely. You can change your plan anytime from the Billing page. Upgrades are instant, and downgrades take effect at the end of your billing cycle.',
    },
    {
        q: 'Is my data secure?',
        a: 'Yes. We use Supabase with row-level security, meaning each user\'s data is completely isolated. All connections are encrypted with TLS.',
    },
    {
        q: 'Do I need to install anything?',
        a: 'No. Triadak is a web application that works on any browser — desktop, tablet, or mobile. There\'s nothing to install.',
    },
    {
        q: 'Can I import data from spreadsheets?',
        a: 'We\'re working on CSV import functionality. For now, you can quickly add properties and bookings through our intuitive interface.',
    },
    {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit and debit cards through Stripe. Enterprise plans can also pay via bank transfer.',
    },
];

function FAQ() {
    const [openIdx, setOpenIdx] = useState<number | null>(null);

    return (
        <section id="faq" className="py-14 sm:py-20 lg:py-32 relative">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={fadeUp}
                    custom={0}
                    className="text-center mb-10 sm:mb-16"
                >
                    <p className="text-xs sm:text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-2 sm:mb-3">FAQ</p>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                        Frequently asked questions
                    </h2>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={stagger}
                    className="space-y-2 sm:space-y-3"
                >
                    {faqs.map((faq, i) => (
                        <motion.div
                            key={i}
                            variants={fadeUp}
                            custom={i}
                            className="border border-white/5 rounded-lg sm:rounded-xl overflow-hidden bg-[#1e293b]/50"
                        >
                            <button
                                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                                className="flex items-center justify-between w-full px-4 sm:px-6 py-3.5 sm:py-4 text-left gap-3"
                            >
                                <span className="text-sm font-medium text-white">{faq.q}</span>
                                <ChevronDown
                                    className={`h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${openIdx === i ? 'rotate-180' : ''}`}
                                />
                            </button>
                            <AnimatePresence>
                                {openIdx === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 sm:px-6 pb-3.5 sm:pb-4">
                                            <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

// ─── CTA Section ──────────────────────────────────────
function CTASection() {
    return (
        <section className="py-14 sm:py-20 lg:py-32 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={fadeUp}
                    custom={0}
                    className="relative rounded-2xl sm:rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 sm:p-10 lg:p-16 text-center overflow-hidden"
                >
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0 left-1/3 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] bg-indigo-500/15 rounded-full blur-[80px] sm:blur-[100px]" />
                        <div className="absolute bottom-0 right-1/3 w-[200px] sm:w-[300px] h-[200px] sm:h-[300px] bg-purple-500/15 rounded-full blur-[80px] sm:blur-[100px]" />
                    </div>

                    <div className="relative z-10">
                        <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                            Ready to simplify your rental business?
                        </h2>
                        <p className="text-slate-400 text-sm sm:text-lg max-w-xl mx-auto mb-6 sm:mb-8 px-2">
                            Join property managers who are saving hours every week with Triadak.
                            Start free — upgrade when you're ready.
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base hover:shadow-xl hover:shadow-indigo-500/25 transition-all group w-full sm:w-auto"
                        >
                            Get Started for Free
                            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ─── Footer ───────────────────────────────────────────
function Footer() {
    return (
        <footer className="border-t border-white/5 bg-[#0b1120]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 lg:col-span-1">
                        <img src="/logotriadak.png" alt="Triadak" className="h-12 sm:h-14 w-auto object-contain mb-3 sm:mb-4" />
                        <p className="text-sm text-slate-500 max-w-xs">
                            The modern platform for vacation rental management. Built for property managers who demand efficiency.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3 sm:mb-4">Product</h4>
                        <ul className="space-y-2 sm:space-y-2.5">
                            <li><a href="#features" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Features</a></li>
                            <li><a href="#pricing" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Pricing</a></li>
                            <li><a href="#faq" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">FAQ</a></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3 sm:mb-4">Company</h4>
                        <ul className="space-y-2 sm:space-y-2.5">
                            <li><span className="text-sm text-slate-500">About</span></li>
                            <li><span className="text-sm text-slate-500">Blog</span></li>
                            <li><span className="text-sm text-slate-500">Careers</span></li>
                        </ul>
                    </div>

                    {/* Highlights */}
                    <div className="col-span-2 sm:col-span-1">
                        <h4 className="text-sm font-semibold text-white mb-3 sm:mb-4">Why Triadak</h4>
                        <ul className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:space-y-2.5 sm:gap-0">
                            <li className="flex items-center gap-2 text-sm text-slate-500">
                                <Clock className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Setup in 2 minutes
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-500">
                                <Shield className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Enterprise security
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-500">
                                <Smartphone className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Mobile friendly
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-500">
                                <Globe className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Available worldwide
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} Triadak. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <span className="text-xs text-slate-600 hover:text-slate-400 cursor-pointer transition-colors">Privacy Policy</span>
                        <span className="text-xs text-slate-600 hover:text-slate-400 cursor-pointer transition-colors">Terms of Service</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

// ─── Main Landing Page ────────────────────────────────
export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 overflow-x-hidden scroll-smooth">
            <Navbar />
            <Hero />
            <Features />
            <HowItWorks />
            <Pricing />
            <Testimonials />
            <FAQ />
            <CTASection />
            <Footer />
        </div>
    );
}
