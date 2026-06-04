import { useState, useEffect, lazy, Suspense } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularTestimonials } from '@/components/ui/circular-testimonials';
import { BentoGrid, type BentoItem } from '@/components/ui/bento-grid';
import { FAQ as FAQTabs, type FAQData } from '@/components/ui/faq-tabs';
import { IlluminatedHero } from '@/components/ui/illuminated-hero';
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
    Layers,
    UserCog,
    RefreshCw,
    Home,
    MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DotGlobeHero = lazy(() =>
    import('@/components/ui/globe-hero').then((m) => ({ default: m.DotGlobeHero })),
);

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
{ label: t('landing.nav.faq'), href: '#faq' },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#061020]/95 backdrop-blur-xl shadow-lg shadow-black/10' : 'bg-[#061020]/70 backdrop-blur-md'} border-b border-white/5`}>
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
                            className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-300 transition-colors hover:text-white"
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
                        className="md:hidden bg-[#061020]/98 backdrop-blur-xl border-t border-white/5 overflow-hidden"
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
                                className="flex items-center gap-2 rounded-lg px-2 py-3 text-base text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
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
                                    className="block text-base font-semibold bg-primary text-white px-5 py-3 rounded-xl text-center"
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
                    src="/cabana-mobile.webp"
                    alt="Vacation rental property"
                    className="w-full h-full object-cover object-center"
                />
                {/* Mobile overlay — ligero para ver bien la imagen */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#061020]/40 via-[#061020]/20 to-[#061020]/85 sm:from-[#061020]/50 sm:via-[#061020]/30 sm:to-[#061020]/90" />
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
                    <Zap className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                    <span>{t('landing.hero.badge')}</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.55 }}
                    className="text-4xl sm:text-6xl lg:text-7xl font-semibold text-white leading-[1.1] tracking-tight drop-shadow-lg"
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
                        className="group inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
                    >
                        <Home className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-slate-200" />
                        <span>¿Buscas alojamiento?</span>
                        <span className="font-medium text-slate-300 transition-colors group-hover:text-white">
                            Explorar propiedades
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-slate-200" />
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
                            <Star key={i} className="h-3.5 w-3.5 fill-slate-400 text-slate-400" />
                        ))}
                        <span className="ml-1 text-white/70">{t('landing.hero.rating')}</span>
                    </div>
                    <span className="hidden sm:block text-white/20">|</span>
                    <span className="text-white/70">{t('landing.hero.freePlan')}</span>
                </motion.div>
            </div>

            {/* Bottom fade into next section */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
        </section>
    );
}

function HookIlluminatedSection() {
    const { t } = useTranslation();
    return (
        <IlluminatedHero
            id="enganche"
            introLine1={t('landing.illuminated.intro1')}
            highlightText={t('landing.illuminated.highlight')}
            trailingLine1={t('landing.illuminated.trailing1')}
            trailingLine2={t('landing.illuminated.trailing2')}
            description={t('landing.illuminated.description')}
            descriptionHighlight={t('landing.illuminated.descriptionHighlight')}
        />
    );
}

// ─── Features (Bento grid) ──────────────────────────────
const FEATURE_ICONS = [
    Building2,
    CalendarDays,
    Users,
    PiggyBank,
    BarChart3,
    Shield,
] as const;

const FEATURE_ICON_COLORS = [
    'text-slate-300',
    'text-slate-300',
    'text-slate-300',
    'text-slate-300',
    'text-slate-300',
    'text-slate-300',
] as const;

const FEATURE_BENTO_LAYOUT: { colSpan?: 1 | 2; hasPersistentHover?: boolean }[] = [
    { colSpan: 2, hasPersistentHover: true },
    {},
    {},
    {},
    { colSpan: 2 },
    {},
];

function Features() {
    const { t } = useTranslation();

    const bentoItems: BentoItem[] = FEATURE_ICONS.map((Icon, i) => {
        const layout = FEATURE_BENTO_LAYOUT[i];
        const tags = t(`landing.features.items.${i}.tags`, { returnObjects: true }) as string[];
        return {
            title: t(`landing.features.items.${i}.title`),
            description: t(`landing.features.items.${i}.description`),
            meta: t(`landing.features.items.${i}.meta`),
            status: t(`landing.features.items.${i}.status`),
            tags: Array.isArray(tags) ? tags : [],
            cta: t('landing.features.cta'),
            icon: <Icon className={cn('h-4 w-4', FEATURE_ICON_COLORS[i])} />,
            colSpan: layout.colSpan,
            hasPersistentHover: layout.hasPersistentHover,
        };
    });

    return (
        <section id="features" className="relative border-t border-white/5 bg-[#061020] py-14 sm:py-20 lg:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={fadeUp}
                    custom={0}
                    className="mx-auto mb-10 max-w-2xl text-center sm:mb-14"
                >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 sm:mb-3">
                        {t('landing.features.badge')}
                    </p>
                    <h2 className="mb-3 px-2 text-2xl font-bold text-white sm:mb-4 sm:text-3xl lg:text-4xl">
                        {t('landing.features.title')}
                    </h2>
                    <p className="px-2 text-sm text-slate-400 sm:text-lg">
                        {t('landing.features.subtitle')}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.45 }}
                >
                    <BentoGrid items={bentoItems} onDarkBackground />
                </motion.div>
            </div>
        </section>
    );
}

// ─── Audiencias + métricas (gestores / viajeros) ─────────
const AUDIENCE_PANELS: {
    key: 'managers' | 'travelers';
    icon: LucideIcon;
    to: string;
    image: string;
}[] = [
    { key: 'managers', icon: Building2, to: '/login', image: '/cabin.webp' },
    { key: 'travelers', icon: MapPin, to: '/explore', image: '/sala.jpg' },
];

const STAT_KEYS = ['0', '1', '2', '3'] as const;

type AudienceCardLayout = 'stacked' | 'side';

function AudiencePanelCard({
    panelKey,
    icon: Icon,
    to,
    image,
    index,
    layout = 'stacked',
}: {
    panelKey: 'managers' | 'travelers';
    icon: LucideIcon;
    to: string;
    image: string;
    index: number;
    layout?: AudienceCardLayout;
}) {
    const { t } = useTranslation();
    const base = `landing.audience.${panelKey}`;
    const isSide = layout === 'side';

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
            className={cn(
                'flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm',
                isSide && 'h-full text-left shadow-lg shadow-black/20',
            )}
        >
            <div
                className={cn(
                    'relative shrink-0 overflow-hidden',
                    isSide ? 'h-44 xl:h-52' : 'h-36 sm:h-40',
                )}
            >
                <img
                    src={image}
                    alt={t(`${base}.imageAlt`)}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061020] via-[#061020]/45 to-[#061020]/15" />
                <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-black/35 backdrop-blur-sm">
                    <Icon className="h-5 w-5 text-slate-200" strokeWidth={1.75} />
                </div>
            </div>

            <div
                className={cn(
                    'flex flex-1 flex-col p-6 sm:p-8',
                    !isSide && 'md:text-center',
                )}
            >
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {t(`${base}.badge`)}
                </p>
                <h3 className="mb-3 text-xl font-semibold leading-snug tracking-tight text-white sm:text-2xl">
                    {t(`${base}.title`)}
                </h3>
                <p
                    className={cn(
                        'mb-6 text-sm leading-relaxed text-slate-400',
                        isSide ? 'max-w-none' : 'max-w-sm md:mx-auto',
                    )}
                >
                    {t(`${base}.description`)}
                </p>
                <Link
                    to={to}
                    className={cn(
                        'group mt-auto inline-flex w-fit items-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/25 hover:bg-white/[0.1]',
                        !isSide && 'md:mx-auto',
                    )}
                >
                    {t(`${base}.cta`)}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
                </Link>
            </div>
        </motion.article>
    );
}

function AudienceStatsRow({ className }: { className?: string }) {
    const { t } = useTranslation();

    return (
        <div
            className={cn(
                'grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm lg:grid-cols-4 lg:divide-x lg:divide-white/10',
                className,
            )}
        >
            {STAT_KEYS.map((key, i) => (
                <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.06, duration: 0.4 }}
                    className={cn(
                        'px-4 py-8 text-center sm:px-6',
                        i < 2 && 'border-b border-white/10 lg:border-b-0',
                    )}
                >
                    <p className="text-3xl font-semibold tabular-nums tracking-tight text-white sm:text-4xl">
                        {t(`landing.audience.stats.${key}.value`)}
                    </p>
                    <p className="mx-auto mt-2 max-w-[12rem] text-[11px] font-medium uppercase leading-snug tracking-wider text-slate-500 sm:text-xs">
                        {t(`landing.audience.stats.${key}.label`)}
                    </p>
                </motion.div>
            ))}
        </div>
    );
}

function AudienceSectionDesktopGlobe() {
    return (
        <div className="relative mx-auto flex h-[min(520px,52vh)] w-full max-w-[300px] items-center justify-center xl:max-w-[340px]">
            <DotGlobeHero
                layout="embedded"
                rotationSpeed={0.0035}
                globeRadius={0.92}
                wireframeOpacity={0.22}
                className="h-full w-full bg-transparent"
                globeClassName="opacity-90"
            />
        </div>
    );
}

function AudienceSection() {
    return (
        <section id="audience" className="relative border-t border-white/[0.06] bg-lp">
            {/* Desktop / laptop: orbe al centro, cards a los lados */}
            <div className="relative hidden lg:block">
                <div className="mx-auto max-w-7xl px-8 py-16 xl:px-10 xl:py-20">
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(220px,300px)_minmax(0,1fr)] items-center gap-8 xl:gap-10">
                        <AudiencePanelCard
                            panelKey="managers"
                            icon={Building2}
                            to="/login"
                            image="/cabin.webp"
                            index={0}
                            layout="side"
                        />

                        <Suspense fallback={<div className="mx-auto h-64 w-64 rounded-full border border-white/10 bg-white/[0.02]" />}>
                            <AudienceSectionDesktopGlobe />
                        </Suspense>

                        <AudiencePanelCard
                            panelKey="travelers"
                            icon={MapPin}
                            to="/explore"
                            image="/sala.jpg"
                            index={1}
                            layout="side"
                        />
                    </div>

                    <AudienceStatsRow className="mt-12" />
                </div>
            </div>

            {/* Móvil / tablet: apilado (sin orbe central) */}
            <div className="lg:hidden">
                <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
                    <div className="grid gap-5 md:grid-cols-2">
                        {AUDIENCE_PANELS.map((panel, i) => (
                            <AudiencePanelCard
                                key={panel.key}
                                panelKey={panel.key}
                                icon={panel.icon}
                                to={panel.to}
                                image={panel.image}
                                index={i}
                                layout="stacked"
                            />
                        ))}
                    </div>
                    <AudienceStatsRow className="mt-8" />
                </div>
            </div>
        </section>
    );
}

// ─── Replace Your Stack ────────────────────────────────
const oldTools = [
    { name: 'Channel Manager', icon: RefreshCw },
    { name: 'Software de reservas', icon: CalendarDays },
    { name: 'Contabilidad', icon: PiggyBank },
    { name: 'CRM de huéspedes', icon: Users },
    { name: 'WhatsApp Business', icon: MessageCircle },
    { name: 'Portal de propietarios', icon: UserCog },
    { name: 'Contratos digitales', icon: FileSignature },
    { name: 'Revenue management', icon: TrendingUp },
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
        <section className="relative overflow-hidden bg-[#061020] py-16 sm:py-24 lg:py-32">
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">

                    {/* Left — Replace tools */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-60px' }}
                        variants={stagger}
                    >
                        <motion.div variants={fadeUp} custom={0}>
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 sm:text-sm">Por qué Triadak</p>
                            <h2 className="mb-4 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                                Deja de pagar por{' '}
                                <span className="text-slate-500 line-through">8 herramientas</span>
                                <br />
                                <span className="text-white">Usa solo una.</span>
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
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                                        <tool.icon className="h-4 w-4 text-slate-300" strokeWidth={1.75} />
                                    </div>
                                    <span className="truncate text-xs text-slate-400 sm:text-sm">{tool.name}</span>
                                    <Check className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-slate-500" strokeWidth={2} />
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
                        <div className="mb-6 flex flex-col items-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] sm:h-24 sm:w-24">
                                <Layers className="h-9 w-9 text-slate-200 sm:h-10 sm:w-10" strokeWidth={1.5} />
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
                                    className="group flex cursor-default flex-col items-center gap-2"
                                >
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition-colors group-hover:border-white/20 group-hover:bg-white/[0.06]">
                                        <int.icon className="h-5 w-5 text-slate-400 transition-colors group-hover:text-slate-200" strokeWidth={1.75} />
                                    </div>
                                    <span className="text-center text-xs text-slate-500 transition-colors group-hover:text-slate-300">{int.name}</span>
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
        <section id="how-it-works" className="relative bg-[#061020] py-14 sm:py-20 lg:py-32">
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={fadeUp}
                    custom={0}
                    className="text-center max-w-2xl mx-auto mb-10 sm:mb-16"
                >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 sm:mb-3 sm:text-sm">{t('landing.howItWorks.badge')}</p>
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
                                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] sm:h-20 sm:w-20 sm:rounded-2xl">
                                    <step.icon className="h-6 w-6 text-slate-300 sm:h-8 sm:w-8" strokeWidth={1.75} />
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


// ─── Testimonials (circular carousel — 21st.dev pattern) ───
const TESTIMONIAL_META = [
    {
        name: 'Maria Rodriguez',
        designationKey: '0',
        src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80',
    },
    {
        name: 'James Mitchell',
        designationKey: '1',
        src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80',
    },
    {
        name: 'Sofia Andersson',
        designationKey: '2',
        src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=1200&q=80',
    },
] as const;

function Testimonials() {
    const { t } = useTranslation();

    const carouselItems = TESTIMONIAL_META.map((item) => ({
        quote: t(`landing.testimonials.items.${item.designationKey}.quote`),
        name: item.name,
        designation: t(`landing.testimonials.items.${item.designationKey}.role`),
        src: item.src,
    }));

    return (
        <section className="relative border-t border-border/40 py-16 sm:py-24 lg:py-32">
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={fadeUp}
                    custom={0}
                    className="mx-auto mb-12 max-w-2xl text-center sm:mb-16"
                >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 sm:mb-3 sm:text-sm">{t('landing.testimonials.badge')}</p>
                    <h2 className="text-display text-white">
                        {t('landing.testimonials.title')}
                    </h2>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto flex justify-center"
                >
                    <CircularTestimonials
                        testimonials={carouselItems}
                        autoplay
                        colors={{
                            name: '#f8fafc',
                            designation: '#94a3b8',
                            testimony: '#cbd5e1',
                            arrowBackground: '#1e293b',
                            arrowForeground: '#f1f5f9',
                            arrowHoverBackground: 'hsl(214 32% 52%)',
                        }}
                        fontSizes={{
                            name: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                            designation: 'clamp(0.875rem, 1.5vw, 1rem)',
                            quote: 'clamp(1rem, 2vw, 1.125rem)',
                        }}
                    />
                </motion.div>
            </div>
        </section>
    );
}

// ─── FAQ (tabs, 21st.dev) ───────────────────────────────
const FAQ_CATEGORY_KEYS = ['general', 'plans', 'security', 'product'] as const;
const FAQ_ITEMS_BY_CATEGORY: Record<(typeof FAQ_CATEGORY_KEYS)[number], string[]> = {
    general: ['0', '3'],
    plans: ['1', '5'],
    security: ['2'],
    product: ['4'],
};

function LandingFAQ() {
    const { t } = useTranslation();

    const categories = FAQ_CATEGORY_KEYS.reduce(
        (acc, key) => {
            acc[key] = t(`landing.faq.categories.${key}`);
            return acc;
        },
        {} as Record<string, string>,
    );

    const faqData = FAQ_CATEGORY_KEYS.reduce((acc, key) => {
        acc[key] = FAQ_ITEMS_BY_CATEGORY[key].map((id) => ({
            question: t(`landing.faq.items.${id}.question`),
            answer: t(`landing.faq.items.${id}.answer`),
        }));
        return acc;
    }, {} as FAQData);

    return (
        <FAQTabs
            id="faq"
            title={t('landing.faq.title')}
            subtitle={t('landing.faq.subtitle')}
            categories={categories}
            faqData={faqData}
            onDarkBackground
            className="py-14 sm:py-20 lg:py-32"
        />
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
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center sm:rounded-3xl sm:p-10 lg:p-16"
                >
                    <div className="relative z-10">
                        <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                            {t('landing.cta.title')}
                        </h2>
                        <p className="text-slate-400 text-sm sm:text-lg max-w-xl mx-auto mb-6 sm:mb-8 px-2">
                            {t('landing.cta.subtitle')}
                        </p>
                        <Link
                            to="/login"
                            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/30 hover:bg-white/15 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
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
        <footer className="relative border-t border-white/[0.08] bg-lp-footer">
            <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/25"
                aria-hidden
            />
            <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
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
                                <Clock className="h-4 w-4 flex-shrink-0 text-slate-400" /> {t('landing.footer.setup2min')}
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-500">
                                <Shield className="h-4 w-4 flex-shrink-0 text-slate-400" /> {t('landing.footer.security')}
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-500">
                                <Smartphone className="h-4 w-4 flex-shrink-0 text-slate-400" /> {t('landing.footer.mobileFriendly')}
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-500">
                                <Globe className="h-4 w-4 flex-shrink-0 text-slate-400" /> {t('landing.footer.worldwide')}
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
                        <a href="https://zirox.io" target="_blank" rel="noopener noreferrer" className="text-slate-500 transition-colors hover:text-slate-300">
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
        <div className="min-h-screen bg-[#061020] text-slate-100 overflow-x-hidden scroll-smooth">
            <Navbar />
            <Hero />
            <HookIlluminatedSection />
            <AudienceSection />
            <Features />
            <ReplaceStack />
            <HowItWorks />
<Testimonials />
            <LandingFAQ />
            <CTASection />
            <Footer />
        </div>
    );
}
