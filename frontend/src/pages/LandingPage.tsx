import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    CreditCard,
    MessageCircle,
    FileSignature,
    TrendingUp,
    Trophy,
    UserCog,
    RefreshCw,
    Home,
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
    const { t, i18n } = useTranslation();
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
        { label: t('landing.nav.features'), href: '#features' },
        { label: t('landing.nav.howItWorks'), href: '#how-it-works' },
        { label: t('landing.nav.pricing'), href: '#pricing' },
        { label: t('landing.nav.faq'), href: '#faq' },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0f172a]/95 backdrop-blur-xl shadow-lg shadow-black/10' : 'bg-[#0f172a]/70 backdrop-blur-md'} border-b border-white/5`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Mobile navbar */}
                <div className="flex md:hidden items-center justify-between">
                    <Link to="/" className="flex flex-col items-start flex-shrink-0">
                        <div className="overflow-hidden h-16">
                            <img src="/logotriadak.png" alt="Triadak" className="h-40 w-auto object-contain -my-12" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase -mt-1">{t('layout.tagline')}</span>
                    </Link>
                    <button
                        onClick={() => setOpen(!open)}
                        className="p-3 -mr-2 text-slate-300 hover:text-white transition-colors"
                        aria-label="Toggle menu"
                    >
                        {open ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
                    </button>
                </div>

                {/* Desktop navbar — full size logo */}
                <div className="hidden md:flex items-center justify-between h-36">
                    <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                        <img src="/logotriadak.png" alt="Triadak" className="h-48 w-auto object-contain" />
                        <span className="text-xs font-bold text-slate-500 tracking-[0.25em] uppercase">{t('layout.tagline')}</span>
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
                        <select
                            value={i18n.language}
                            onChange={(e) => i18n.changeLanguage(e.target.value)}
                            className="text-xs bg-[#1e293b] border border-white/10 rounded-lg px-2 py-1.5 text-slate-300 hover:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            aria-label="Language"
                        >
                            <option value="en" className="bg-[#1e293b] text-slate-300">EN</option>
                            <option value="de" className="bg-[#1e293b] text-slate-300">DE</option>
                            <option value="es" className="bg-[#1e293b] text-slate-300">ES</option>
                            <option value="fr" className="bg-[#1e293b] text-slate-300">FR</option>
                        </select>
                        <Link
                            to="/explore"
                            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors px-4 py-2 flex items-center gap-1.5"
                        >
                            <Home className="h-3.5 w-3.5" />
                            Explorar alojamientos
                        </Link>
                        <Link
                            to="/login"
                            className="text-sm text-slate-300 hover:text-white transition-colors px-4 py-2"
                        >
                            {t('landing.nav.login')}
                        </Link>
                        <Link
                            to="/login"
                            className="text-sm font-semibold bg-black text-white px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                        >
                            Empezar
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
                            <Link
                                to="/explore"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 text-base text-emerald-400 hover:text-emerald-300 transition-colors py-3 px-2 rounded-lg hover:bg-white/5"
                            >
                                <Home className="h-4 w-4" />
                                Explorar alojamientos
                            </Link>
                            <div className="pt-3 mt-2 border-t border-white/5 space-y-2">
                                <select
                                    value={i18n.language}
                                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                                    className="w-full text-sm bg-[#1e293b] border border-white/10 rounded-lg px-3 py-2.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                    aria-label="Language"
                                >
                                    <option value="en" className="bg-[#1e293b] text-slate-300">English</option>
                                    <option value="de" className="bg-[#1e293b] text-slate-300">Deutsch</option>
                                    <option value="es" className="bg-[#1e293b] text-slate-300">Español</option>
                                    <option value="fr" className="bg-[#1e293b] text-slate-300">Français</option>
                                </select>
                                <Link
                                    to="/login"
                                    onClick={() => setOpen(false)}
                                    className="block text-base text-slate-300 hover:text-white transition-colors py-3 px-2 text-center rounded-lg hover:bg-white/5"
                                >
                                    {t('landing.nav.login')}
                                </Link>
                                <Link
                                    to="/login"
                                    onClick={() => setOpen(false)}
                                    className="block text-base font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 py-3 rounded-xl text-center"
                                >
                                    {t('landing.nav.startFree')}
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
    const { t } = useTranslation();
    return (
        <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
            {/* Background image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/hero-bg.jpg"
                    alt="Vacation rental property"
                    className="w-full h-full object-cover object-[60%_40%] sm:object-center"
                />
                {/* Mobile overlay — ligero para ver bien la imagen */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/40 via-[#0f172a]/20 to-[#0f172a]/85 sm:from-[#0f172a]/50 sm:via-[#0f172a]/30 sm:to-[#0f172a]/90" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 sm:pt-40 sm:pb-28 text-center">
                {/* Badge — oculto en móvil */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="hidden sm:inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-8"
                >
                    <Zap className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                    <span>{t('landing.hero.badge')}</span>
                </motion.div>

                {/* Headline — todo blanco */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.55 }}
                    className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight drop-shadow-lg"
                >
                    {t('landing.hero.title1')}{' '}
                    <span className="text-white">
                        {t('landing.hero.titleHighlight')}
                    </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mt-5 sm:mt-6 text-base sm:text-lg lg:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed px-2"
                >
                    {t('landing.hero.subtitle')}
                </motion.p>

                {/* CTA Buttons — ambos con el mismo estilo ghost */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4"
                >
                    <Link
                        to="/login"
                        className="w-full sm:w-auto text-white/90 hover:text-white font-semibold px-7 sm:px-9 py-3.5 sm:py-4 rounded-xl border border-white/25 hover:border-white/50 backdrop-blur-sm bg-white/8 hover:bg-white/15 transition-all text-sm sm:text-base flex items-center justify-center gap-2 group"
                    >
                        {t('landing.hero.cta')}
                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <a
                        href="#features"
                        className="w-full sm:w-auto text-white/90 hover:text-white font-medium px-7 sm:px-9 py-3.5 sm:py-4 rounded-xl border border-white/25 hover:border-white/50 backdrop-blur-sm bg-white/8 hover:bg-white/15 transition-all text-sm sm:text-base text-center"
                    >
                        {t('landing.hero.secondary')}
                    </a>
                </motion.div>

                {/* Tourist explore banner */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.4 }}
                    className="mt-5 sm:mt-6"
                >
                    <Link
                        to="/explore"
                        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-emerald-400 transition-colors group"
                    >
                        <Home className="h-3.5 w-3.5 text-emerald-500/60 group-hover:text-emerald-400 transition-colors" />
                        <span>¿Buscas alojamiento?</span>
                        <span className="text-emerald-500/80 group-hover:text-emerald-400 font-medium transition-colors">
                            Explorar propiedades
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-emerald-500/60 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                    </Link>
                </motion.div>

                {/* Social proof */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-xs sm:text-sm text-white/50"
                >
                    <div className="flex items-center gap-1.5">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="ml-1 text-white/70">{t('landing.hero.rating')}</span>
                    </div>
                    <span className="hidden sm:block text-white/20">|</span>
                    <span className="text-white/70">{t('landing.hero.freePlan')}</span>
                </motion.div>
            </div>

            {/* Bottom fade into next section */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0f172a] to-transparent pointer-events-none z-10" />
        </section>
    );
}

// ─── Features Section ─────────────────────────────────
const features = [
    {
        icon: Building2,
        title: 'Property Management',
        description: 'Add unlimited properties with details, photos, pricing, and availability. Track everything in one place.',
    },
    {
        icon: CalendarDays,
        title: 'Smart Bookings',
        description: 'Manage reservations, check-ins, check-outs, and calendar availability. Never double-book again.',
    },
    {
        icon: Users,
        title: 'Guest CRM',
        description: 'Build guest profiles automatically. Track preferences, history, and communication in one view.',
    },
    {
        icon: PiggyBank,
        title: 'Finance Engine',
        description: 'Track income, expenses, and profitability per property. Real-time financial overview.',
    },
    {
        icon: BarChart3,
        title: 'Analytics Dashboard',
        description: 'Occupancy rates, revenue trends, and performance metrics at a glance. Data-driven decisions.',
    },
    {
        icon: Shield,
        title: 'Secure & Private',
        description: 'Enterprise-grade security with row-level isolation. Your data is yours — always encrypted, always safe.',
    },
];

function Features() {
    const { t } = useTranslation();
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
                    <p className="text-xs sm:text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-2 sm:mb-3">{t('landing.features.badge')}</p>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 px-2">
                        {t('landing.features.title')}
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-lg px-2">
                        {t('landing.features.subtitle')}
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
                            className="group p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
                        >
                            <div className="inline-flex items-center justify-center p-2.5 sm:p-3 rounded-xl border border-white/10 bg-white/5 mb-4 sm:mb-5 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 transition-all duration-300">
                                <f.icon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-300 group-hover:text-indigo-300 transition-colors duration-300" />
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 sm:mb-2">{t(`landing.features.items.${i}.title`)}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{t(`landing.features.items.${i}.description`)}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

// ─── Tourist / Host Dual CTA ──────────────────────────
function DualCTA() {
    return (
        <>
            {/* Mobile: cards apiladas */}
            <section className="md:hidden relative z-10 -mt-6 pb-6 px-4">
                <div className="max-w-lg mx-auto flex flex-col gap-3">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-900/60 to-[#0f172a]/80 backdrop-blur-xl p-5 flex flex-col gap-3"
                    >
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/20">
                                <Building2 className="h-4 w-4 text-indigo-400" />
                            </div>
                            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Para gestores</span>
                        </div>
                        <h3 className="text-lg font-bold text-white leading-tight">Gestiona tus propiedades en un solo lugar</h3>
                        <Link to="/login" className="inline-flex items-center gap-2 self-start text-white/90 hover:text-white font-medium text-sm px-4 py-2 rounded-xl border border-white/25 hover:border-white/50 bg-white/8 hover:bg-white/15 transition-all group">
                            Empezar gratis <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-900/50 to-[#0f172a]/80 backdrop-blur-xl p-5 flex flex-col gap-3"
                    >
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/20">
                                <Globe className="h-4 w-4 text-emerald-400" />
                            </div>
                            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Para viajeros</span>
                        </div>
                        <h3 className="text-lg font-bold text-white leading-tight">Encuentra tu alojamiento perfecto</h3>
                        <Link to="/explore" className="inline-flex items-center gap-2 self-start text-white/90 hover:text-white font-medium text-sm px-4 py-2 rounded-xl border border-white/25 hover:border-white/50 bg-white/8 hover:bg-white/15 transition-all group">
                            Ver alojamientos <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Desktop: split-screen full width */}
            <section className="hidden md:flex relative z-10 w-full overflow-hidden" style={{ minHeight: '260px' }}>
                {/* Mitad izquierda — Gestores */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="relative flex-1 flex flex-col items-center justify-center px-12 lg:px-20 py-16 bg-gradient-to-r from-indigo-950/80 to-[#0f172a]/60 border-r border-white/5 group hover:from-indigo-950/90 transition-all duration-500"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.08)_0%,_transparent_60%)] pointer-events-none" />
                    <div className="relative z-10 max-w-md text-center mx-auto">
                        <div className="flex items-center justify-center gap-3 mb-5">
                            <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/20">
                                <Building2 className="h-5 w-5 text-indigo-400" />
                            </div>
                            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Para gestores</span>
                        </div>
                        <h3 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-3">
                            Gestiona tus propiedades en un solo lugar
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed mb-6">
                            Reservas, contabilidad, propietarios, mensajería y más. Todo integrado.
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 mx-auto text-white/90 hover:text-white font-medium text-sm px-6 py-3 rounded-xl border border-white/25 hover:border-white/50 backdrop-blur-sm bg-white/8 hover:bg-white/15 transition-all group/btn"
                        >
                            Empezar gratis
                            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </motion.div>

                {/* Divisor central */}
                <div className="w-px bg-gradient-to-b from-transparent via-white/10 to-transparent flex-shrink-0" />

                {/* Mitad derecha — Viajeros */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="relative flex-1 flex flex-col items-center justify-center px-12 lg:px-20 py-16 bg-gradient-to-l from-emerald-950/70 to-[#0f172a]/60 group hover:from-emerald-950/90 transition-all duration-500"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.07)_0%,_transparent_60%)] pointer-events-none" />
                    <div className="relative z-10 max-w-md text-center mx-auto">
                        <div className="flex items-center justify-center gap-3 mb-5">
                            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20">
                                <Globe className="h-5 w-5 text-emerald-400" />
                            </div>
                            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Para viajeros</span>
                        </div>
                        <h3 className="text-2xl lg:text-3xl font-bold text-white leading-tight mb-3">
                            Encuentra tu alojamiento perfecto
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed mb-6">
                            Explora apartamentos y casas rurales disponibles. Reserva directo sin intermediarios.
                        </p>
                        <Link
                            to="/explore"
                            className="inline-flex items-center gap-2 mx-auto text-white/90 hover:text-white font-medium text-sm px-6 py-3 rounded-xl border border-white/25 hover:border-white/50 backdrop-blur-sm bg-white/8 hover:bg-white/15 transition-all group/btn"
                        >
                            Ver alojamientos
                            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </motion.div>
            </section>
        </>
    );
}

// ─── Stats Bar ────────────────────────────────────────
function StatsBar() {
    const stats = [
        { value: '40+', label: 'Funcionalidades incluidas' },
        { value: '6', label: 'Canales conectados' },
        { value: '4', label: 'Idiomas disponibles' },
        { value: '100%', label: 'En la nube — sin instalar nada' },
    ];

    return (
        <section className="py-12 sm:py-16 border-y border-white/[0.06] bg-white/[0.02]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 text-center">
                    {stats.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.45 }}
                        >
                            <p className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
                                {s.value}
                            </p>
                            <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-snug">{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Replace Your Stack ────────────────────────────────
const oldTools = [
    { name: 'Channel Manager', icon: RefreshCw, color: 'text-rose-400' },
    { name: 'Software de reservas', icon: CalendarDays, color: 'text-orange-400' },
    { name: 'Contabilidad', icon: PiggyBank, color: 'text-amber-400' },
    { name: 'CRM de huéspedes', icon: Users, color: 'text-yellow-400' },
    { name: 'WhatsApp Business', icon: MessageCircle, color: 'text-green-400' },
    { name: 'Portal de propietarios', icon: UserCog, color: 'text-cyan-400' },
    { name: 'Contratos digitales', icon: FileSignature, color: 'text-blue-400' },
    { name: 'Revenue management', icon: TrendingUp, color: 'text-violet-400' },
];

const integrations = [
    { name: 'Airbnb', icon: Building2 },
    { name: 'Booking.com', icon: Globe },
    { name: 'VRBO', icon: Building2 },
    { name: 'Lodgify', icon: Zap },
    { name: 'Stripe', icon: CreditCard },
    { name: 'WhatsApp', icon: MessageCircle },
    { name: 'iCal Sync', icon: CalendarDays },
    { name: 'SMS', icon: Smartphone },
];

function ReplaceStack() {
    return (
        <section className="py-16 sm:py-24 lg:py-32 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-purple-500/6 rounded-full blur-[100px]" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* Left — Replace tools */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-60px' }}
                        variants={stagger}
                    >
                        <motion.div variants={fadeUp} custom={0}>
                            <p className="text-xs sm:text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-3">Por qué Triadak</p>
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                                Deja de pagar por{' '}
                                <span className="line-through text-slate-500">8 herramientas</span>
                                <br />
                                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                    Usa solo una.
                                </span>
                            </h2>
                            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
                                La mayoría de gestores usan entre 4 y 8 herramientas distintas. Triadak las reemplaza todas con una plataforma unificada, más barata y sin fricciones.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeUp} custom={1} className="grid grid-cols-2 gap-2.5">
                            {oldTools.map((tool) => (
                                <div
                                    key={tool.name}
                                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.03]"
                                >
                                    <tool.icon className={`h-4 w-4 flex-shrink-0 ${tool.color}`} />
                                    <span className="text-xs sm:text-sm text-slate-400 truncate">{tool.name}</span>
                                    <Check className="h-3.5 w-3.5 text-emerald-400 ml-auto flex-shrink-0" />
                                </div>
                            ))}
                        </motion.div>

                        <motion.div variants={fadeUp} custom={2} className="mt-8">
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-5 py-3 rounded-xl transition-all group"
                            >
                                Empieza gratis hoy
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Right — Integrations hub */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 0.6 }}
                        className="relative"
                    >
                        {/* Central Triadak node */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shadow-xl shadow-indigo-500/10">
                                    <Trophy className="h-9 w-9 sm:h-10 sm:w-10 text-indigo-400" />
                                </div>
                                {/* Pulse ring */}
                                <div className="absolute inset-0 rounded-2xl border border-indigo-500/20 animate-ping opacity-30" />
                            </div>
                            <p className="mt-3 text-sm font-semibold text-white">Triadak</p>
                            <p className="text-xs text-slate-500">Todo en uno</p>
                        </div>

                        {/* Integration icons */}
                        <div className="grid grid-cols-4 gap-x-4 gap-y-6">
                            {integrations.map((int, i) => (
                                <motion.div
                                    key={int.name}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.07, duration: 0.35 }}
                                    className="flex flex-col items-center gap-2 group cursor-default"
                                >
                                    <int.icon className="h-6 w-6 text-emerald-400/70 group-hover:text-emerald-400 transition-colors duration-200" />
                                    <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors duration-200">{int.name}</span>
                                </motion.div>
                            ))}
                        </div>

                        <p className="text-center text-xs text-slate-700 mt-6">
                            Más integraciones próximamente
                        </p>
                    </motion.div>
                </div>
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
    const { t } = useTranslation();
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
                    <p className="text-xs sm:text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-2 sm:mb-3">{t('landing.howItWorks.badge')}</p>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                        {t('landing.howItWorks.title')}
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-lg px-2">
                        {t('landing.howItWorks.subtitle')}
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
                            <div className="inline-flex items-center justify-center mb-4 sm:mb-6">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
                                    <step.icon className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-400" />
                                </div>
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold text-white mb-1.5 sm:mb-2">{t(`landing.howItWorks.step${i + 1}Title`)}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{t(`landing.howItWorks.step${i + 1}Desc`)}</p>
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
    const { t } = useTranslation();
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
                    <p className="text-xs sm:text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-2 sm:mb-3">{t('landing.pricing.badge')}</p>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                        {t('landing.pricing.title')}
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-lg px-2">
                        {t('landing.pricing.subtitle')}
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
                                            <Star className="h-2.5 w-2.5" /> {t('landing.pricing.popular').toUpperCase()}
                                        </div>
                                    </div>
                                )}
                                <div className="p-5 flex-1">
                                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                                    <p className="text-xs text-slate-400 mt-1">{t(`landing.pricing.planDesc.${plan.name.toLowerCase()}`)}</p>
                                    <div className="mt-3 mb-5 flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-white">{plan.price}</span>
                                        <span className="text-slate-400 text-sm">{plan.period === 'forever' ? t('landing.pricing.forever') : t('landing.pricing.perMonth')}</span>
                                    </div>
                                    <ul className="space-y-2">
                                        {plan.features.map((f, fi) => (
                                            <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                                                <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                                                {t(`landing.pricing.features.${plan.name.toLowerCase()}.${fi}`)}
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
                                        {t(`landing.pricing.planCta.${plan.name.toLowerCase()}`)}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Scroll hint */}
                    <p className="text-center text-slate-600 text-xs mt-3">{t('landing.pricing.swipeHint')}</p>
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
                                        <Star className="h-3 w-3" /> {t('landing.pricing.popular').toUpperCase()}
                                    </div>
                                </div>
                            )}

                            <div className="p-6 flex-1">
                                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                <p className="text-sm text-slate-400 mt-1">{t(`landing.pricing.planDesc.${plan.name.toLowerCase()}`)}</p>
                                <div className="mt-4 mb-6 flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                                    <span className="text-slate-400 text-sm">{plan.period === 'forever' ? t('landing.pricing.forever') : t('landing.pricing.perMonth')}</span>
                                </div>
                                <ul className="space-y-2.5">
                                    {plan.features.map((f, fi) => (
                                        <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                                            <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                                            {t(`landing.pricing.features.${plan.name.toLowerCase()}.${fi}`)}
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
                                    {t(`landing.pricing.planCta.${plan.name.toLowerCase()}`)}
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                <p className="text-center text-slate-500 text-xs sm:text-sm mt-6 sm:mt-8 px-2">
                    {t('landing.pricing.trialNote')}
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
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
    },
    {
        quote: "The financial tracking alone is worth it. I finally have a clear picture of profitability per property.",
        name: 'James Mitchell',
        role: 'Rental Owner, Barcelona',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
    },
    {
        quote: 'We switched from spreadsheets to Triadak and never looked back. The CRM is incredibly useful.',
        name: 'Sofia Andersson',
        role: 'Co-host, Lisbon',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80',
    },
];

function Testimonials() {
    const { t } = useTranslation();
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
                    <p className="text-xs sm:text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-2 sm:mb-3">{t('landing.testimonials.badge')}</p>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                        {t('landing.testimonials.title')}
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
                    {testimonials.map((testimonial, i) => (
                        <motion.div
                            key={testimonial.name}
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
                            <p className="text-slate-300 text-sm leading-relaxed mb-4 sm:mb-6">"{t(`landing.testimonials.items.${i}.quote`)}"</p>
                            <div className="flex items-center gap-3">
                                <img
                                    src={testimonial.avatar}
                                    alt={testimonial.name}
                                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover flex-shrink-0 ring-2 ring-white/10"
                                />
                                <div>
                                    <p className="text-sm font-medium text-white">{testimonial.name}</p>
                                    <p className="text-xs text-slate-500">{testimonial.role}</p>
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
    const { t } = useTranslation();
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
                    <p className="text-xs sm:text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-2 sm:mb-3">{t('landing.faq.badge')}</p>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                        {t('landing.faq.title')}
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-lg px-2">{t('landing.faq.subtitle')}</p>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={stagger}
                    className="space-y-2 sm:space-y-3"
                >
                    {faqs.map((_, i) => (
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
                                <span className="text-sm font-medium text-white">{t(`landing.faq.items.${i}.question`)}</span>
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
                                            <p className="text-sm text-slate-400 leading-relaxed">{t(`landing.faq.items.${i}.answer`)}</p>
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
    const { t } = useTranslation();
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
                            {t('landing.cta.title')}
                        </h2>
                        <p className="text-slate-400 text-sm sm:text-lg max-w-xl mx-auto mb-6 sm:mb-8 px-2">
                            {t('landing.cta.subtitle')}
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base hover:shadow-xl hover:shadow-indigo-500/25 transition-all group w-full sm:w-auto"
                        >
                            {t('landing.cta.button')}
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
    const { t } = useTranslation();
    return (
        <footer className="border-t border-white/5 bg-[#0b1120]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 lg:col-span-1">
                        <img src="/logotriadak.png" alt="Triadak" className="h-24 sm:h-28 w-auto object-contain mb-3 sm:mb-4" />
                        <p className="text-sm text-slate-500 max-w-xs">
                            {t('landing.footer.description')}
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3 sm:mb-4">{t('landing.footer.product')}</h4>
                        <ul className="space-y-2 sm:space-y-2.5">
                            <li><a href="#features" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{t('landing.nav.features')}</a></li>
                            <li><a href="#pricing" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{t('landing.nav.pricing')}</a></li>
                            <li><a href="#faq" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{t('landing.nav.faq')}</a></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3 sm:mb-4">{t('landing.footer.company')}</h4>
                        <ul className="space-y-2 sm:space-y-2.5">
                            <li><span className="text-sm text-slate-500">{t('landing.footer.about')}</span></li>
                            <li><span className="text-sm text-slate-500">{t('landing.footer.blog')}</span></li>
                            <li><span className="text-sm text-slate-500">{t('landing.footer.careers')}</span></li>
                        </ul>
                    </div>

                    {/* Highlights */}
                    <div className="col-span-2 sm:col-span-1">
                        <h4 className="text-sm font-semibold text-white mb-3 sm:mb-4">{t('landing.footer.whyTriadak')}</h4>
                        <ul className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:space-y-2.5 sm:gap-0">
                            <li className="flex items-center gap-2 text-sm text-slate-500">
                                <Clock className="h-4 w-4 text-indigo-400 flex-shrink-0" /> {t('landing.footer.setup2min')}
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-500">
                                <Shield className="h-4 w-4 text-indigo-400 flex-shrink-0" /> {t('landing.footer.security')}
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-500">
                                <Smartphone className="h-4 w-4 text-indigo-400 flex-shrink-0" /> {t('landing.footer.mobileFriendly')}
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-500">
                                <Globe className="h-4 w-4 text-indigo-400 flex-shrink-0" /> {t('landing.footer.worldwide')}
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/5 flex flex-col items-center gap-3 sm:gap-4">
                    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                        <p className="text-xs text-slate-600">{t('landing.footer.copyright', { year: new Date().getFullYear() })}</p>
                        <div className="flex items-center gap-6">
                            <span className="text-xs text-slate-600 hover:text-slate-400 cursor-pointer transition-colors">{t('landing.footer.privacy')}</span>
                            <span className="text-xs text-slate-600 hover:text-slate-400 cursor-pointer transition-colors">{t('landing.footer.terms')}</span>
                        </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700">
                        Developed by{' '}
                        <a href="https://zirox.io" target="_blank" rel="noopener noreferrer" className="text-indigo-500/60 hover:text-indigo-400 transition-colors">
                            zirox.io
                        </a>
                    </p>
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
            <DualCTA />
            <StatsBar />
            <Features />
            <ReplaceStack />
            <HowItWorks />
            <Pricing />
            <Testimonials />
            <FAQ />
            <CTASection />
            <Footer />
        </div>
    );
}
