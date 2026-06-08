import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularTestimonials } from '@/components/ui/circular-testimonials';
import { EditorialFeaturesSection } from '@/components/ui/editorial-features-section';
import { EditorialFeatureBlocks } from '@/components/ui/editorial-feature-blocks';
import { EditorialCTA } from '@/components/ui/editorial-cta';
import { PlatformEditorialSection } from '@/components/ui/platform-editorial-section';
import { SectionParallaxBridge } from '@/components/ui/scroll-parallax';
import { FAQ as FAQTabs, type FAQData } from '@/components/ui/faq-tabs';
import { IlluminatedHero } from '@/components/ui/illuminated-hero';
import { PropertyScrollHero } from '@/components/ui/property-scroll-hero';
import {
    Building2,
    CalendarDays,
    Users,
    PiggyBank,
    BarChart3,
    Shield,
    ArrowRight,
    Menu,
    X,
    Globe,
    Clock,
    Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReplaceStackSection } from '@/components/ui/replace-stack-section';
import { SplitScrollAdventure } from '@/components/ui/animated-scroll';
import type { SplitScrollAxis, SplitScrollPage } from '@/components/ui/animated-scroll';

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

// ─── Nav shared ───────────────────────────────────────
const LANG_CODES = ['en', 'de', 'es', 'fr'] as const;

const navLinkClass =
    'text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-white';
const navCtaClass =
    'group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:text-cyan-300';

function LanguageSwitcher({ className }: { className?: string }) {
    const { i18n } = useTranslation();
    const active = (lang: string) => i18n.language === lang || i18n.language.startsWith(`${lang}-`);

    return (
        <div
            className={cn(
                'flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] p-0.5',
                className,
            )}
            role="group"
            aria-label="Language"
        >
            {LANG_CODES.map((lang) => (
                <button
                    key={lang}
                    type="button"
                    onClick={() => i18n.changeLanguage(lang)}
                    className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors',
                        active(lang) ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300',
                    )}
                    aria-current={active(lang) ? 'true' : undefined}
                >
                    {lang}
                </button>
            ))}
        </div>
    );
}

// ─── Navbar ───────────────────────────────────────────
function Navbar() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 768) setOpen(false);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const links = [
        { label: t('landing.nav.features'), href: '#features' },
        { label: t('landing.nav.howItWorks'), href: '#how-it-works' },
        { label: t('landing.nav.faq'), href: '#faq' },
    ];

    return (
        <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.08] bg-[#061020]/92 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Mobile */}
                <div className="flex h-16 items-center justify-between md:hidden">
                    <Link to="/" className="flex flex-shrink-0 items-center">
                        <div className="h-14 overflow-hidden">
                            <img
                                src="/logotriadak.png"
                                alt="Triadak"
                                className="-my-12 h-40 w-auto object-contain"
                            />
                        </div>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setOpen(!open)}
                        className="-mr-1 rounded-full p-2.5 text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white"
                        aria-label="Toggle menu"
                        aria-expanded={open}
                    >
                        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>

                {/* Desktop */}
                <div className="hidden h-28 items-center justify-between md:flex">
                    <Link to="/" className="flex flex-shrink-0 items-center">
                        <div className="h-24 overflow-hidden">
                            <img
                                src="/logotriadak.png"
                                alt="Triadak"
                                className="-my-10 h-44 w-auto object-contain"
                            />
                        </div>
                    </Link>

                    <div className="flex items-center gap-10">
                        {links.map((l) => (
                            <a key={l.href} href={l.href} className={navLinkClass}>
                                {l.label}
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-5">
                        <LanguageSwitcher />
                        <span className="h-4 w-px bg-white/10" aria-hidden />
                        <Link to="/explore" className={navLinkClass}>
                            {t('landing.hero.exploreLink')}
                        </Link>
                        <Link to="/login" className={navLinkClass}>
                            {t('landing.nav.login')}
                        </Link>
                        <Link to="/login" className={navCtaClass}>
                            {t('landing.nav.startFree')}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden border-t border-white/[0.06] bg-[#061020]/98 backdrop-blur-xl md:hidden"
                    >
                        <div className="space-y-1 px-4 py-5">
                            {links.map((l) => (
                                <a
                                    key={l.href}
                                    href={l.href}
                                    onClick={() => setOpen(false)}
                                    className="block rounded-lg px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                                >
                                    {l.label}
                                </a>
                            ))}
                            <Link
                                to="/explore"
                                onClick={() => setOpen(false)}
                                className="block rounded-lg px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                            >
                                {t('landing.hero.exploreLink')}
                            </Link>

                            <div className="mt-4 space-y-4 border-t border-white/[0.06] pt-5">
                                <LanguageSwitcher className="w-fit" />
                                <Link
                                    to="/login"
                                    onClick={() => setOpen(false)}
                                    className="block px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-white"
                                >
                                    {t('landing.nav.login')}
                                </Link>
                                <Link
                                    to="/login"
                                    onClick={() => setOpen(false)}
                                    className={cn(navCtaClass, 'px-3 py-2')}
                                >
                                    {t('landing.nav.startFree')}
                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}


function HookIlluminatedSection() {
    const { t } = useTranslation();
    return (
        <IlluminatedHero
            id="enganche"
            sectionLabel={t('landing.illuminated.badge')}
            introLine1={t('landing.illuminated.intro1')}
            highlightText={t('landing.illuminated.highlight')}
            trailingLine1={t('landing.illuminated.trailing1')}
            trailingLine2={t('landing.illuminated.trailing2')}
            description={t('landing.illuminated.description')}
            descriptionHighlight={t('landing.illuminated.descriptionHighlight')}
            backgroundNode={
                <Suspense fallback={null}>
                    <div className="flex h-full w-full items-center justify-center">
                        <div className="aspect-square h-[min(98vw,44rem)] w-[min(98vw,44rem)] sm:h-[min(78vw,46rem)] sm:w-[min(78vw,46rem)]">
                            <DotGlobeHero
                                layout="embedded"
                                rotationSpeed={0.002}
                                globeRadius={0.92}
                                wireframeColor="#38bdf8"
                                wireframeOpacity={0.55}
                                className="h-full w-full bg-transparent"
                                globeClassName="opacity-100"
                            />
                        </div>
                    </div>
                </Suspense>
            }
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

function Features() {
    const { t } = useTranslation();

    const featureItems = FEATURE_ICONS.map((Icon, i) => {
        const tags = t(`landing.features.items.${i}.tags`, { returnObjects: true }) as string[];
        return {
            title: t(`landing.features.items.${i}.title`),
            description: t(`landing.features.items.${i}.description`),
            meta: t(`landing.features.items.${i}.meta`),
            status: t(`landing.features.items.${i}.status`),
            tags: Array.isArray(tags) ? tags : [],
            icon: <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', FEATURE_ICON_COLORS[i])} strokeWidth={1.5} />,
        };
    });

    return <EditorialFeaturesSection items={featureItems} />;
}

// ─── Audiencias + métricas (gestores / viajeros) ─────────
const STAT_KEYS = ['0', '1', '2', '3'] as const;

function AudienceStatsRow({ className }: { className?: string }) {
    const { t } = useTranslation();

    const stats = STAT_KEYS.map((key) => ({
        value: t(`landing.audience.stats.${key}.value`),
        label: t(`landing.audience.stats.${key}.label`),
    }));

    // Duplicamos para que el loop sea continuo sin saltos
    const items = [...stats, ...stats, ...stats];

    return (
        <div className={cn('relative overflow-hidden border-t border-white/[0.06] py-6 sm:py-7', className)}>
            {/* Fade lateral */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#061020] to-transparent sm:w-24" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#061020] to-transparent sm:w-24" />

            <div
                className="flex w-max animate-[marquee_28s_linear_infinite] items-center gap-0"
                style={{ willChange: 'transform' }}
            >
                {items.map((stat, i) => (
                    <div key={i} className="flex items-center">
                        <div className="flex flex-col items-center px-8 sm:px-12 lg:px-16">
                            <span className="bg-gradient-to-br from-white to-blue-300 bg-clip-text text-2xl font-bold tabular-nums tracking-tight text-transparent sm:text-3xl">
                                {stat.value}
                            </span>
                            <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.18em] text-slate-500 sm:text-[10px]">
                                {stat.label}
                            </span>
                        </div>
                        {/* Separador */}
                        <span className="h-6 w-px shrink-0 bg-white/10" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function AudienceEditorialPanel({
    panelKey,
    to,
    compact,
    align = 'right',
}: {
    panelKey: 'managers' | 'travelers';
    to: string;
    compact?: boolean;
    align?: 'left' | 'right';
}) {
    const { t } = useTranslation();
    const base = `landing.audience.${panelKey}`;

    return (
        <div
            className={cn(
                'text-left',
                align === 'right' ? 'lg:ml-auto' : 'lg:mr-auto',
                compact ? 'max-w-md' : 'max-w-xl lg:max-w-2xl',
            )}
        >
            <p
                className={cn(
                    'font-medium uppercase tracking-[0.35em] text-slate-400',
                    compact ? 'mb-3 text-[9px]' : 'mb-5 text-[10px] sm:text-xs',
                )}
            >
                {t(`${base}.badge`)}
            </p>

            <h3
                className={cn(
                    'font-bold uppercase tracking-[0.03em] text-white leading-[1.28]',
                    compact
                        ? 'text-[clamp(1.35rem,5vw,1.75rem)]'
                        : 'text-[clamp(1.5rem,3.5vw,2.75rem)]',
                )}
            >
                {t(`${base}.title`)}
            </h3>

            <p
                className={cn(
                    'leading-relaxed text-slate-300',
                    compact ? 'mt-3 text-sm' : 'mt-5 max-w-lg text-base sm:text-lg',
                )}
            >
                {t(`${base}.description`)}
            </p>

            <Link
                to={to}
                className={cn(
                    'group inline-flex items-center gap-2 font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:text-cyan-300',
                    compact ? 'mt-6 text-[11px]' : 'mt-8 text-xs sm:mt-10 sm:text-sm',
                )}
            >
                {t(`${base}.cta`)}
                <ArrowRight
                    className={cn(
                        'transition-transform group-hover:translate-x-1.5',
                        compact ? 'h-3.5 w-3.5' : 'h-4 w-4',
                    )}
                    strokeWidth={1.75}
                />
            </Link>
        </div>
    );
}

function useAudienceScrollPages(compact: boolean): SplitScrollPage[] {
    return useMemo(
        () => [
            {
                fullBleedImage: '/cabin.webp',
                overlayAlign: 'right',
                overlayContent: (
                    <AudienceEditorialPanel
                        panelKey="managers"
                        to="/login"
                        compact={compact}
                        align="right"
                    />
                ),
            },
            {
                fullBleedImage: '/sala.jpg',
                overlayAlign: 'left',
                overlayContent: (
                    <AudienceEditorialPanel
                        panelKey="travelers"
                        to="/explore"
                        compact={compact}
                        align="left"
                    />
                ),
            },
        ],
        [compact],
    );
}

function AudienceScrollBlock({
    splitAxis,
    heightClass,
    compact,
}: {
    splitAxis: SplitScrollAxis;
    heightClass: string;
    compact: boolean;
}) {
    const pages = useAudienceScrollPages(compact);

    return (
        <SplitScrollAdventure
            pages={pages}
            className={heightClass}
            splitAxis={splitAxis}
            animTimeMs={800}
            lockPageScroll
            showIndicators
        />
    );
}

function AudienceSection() {
    const { t } = useTranslation();
    return (
        <section id="audience" className="relative border-t border-white/[0.06] bg-lp">
            <div className="relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 sm:pb-10 sm:pt-20 lg:px-8 lg:pt-24">
                <p className="mb-6 text-[10px] font-medium uppercase tracking-[0.35em] text-slate-500 sm:text-xs">
                    {t('landing.audience.sectionBadge')}
                </p>
                <h2 className="max-w-4xl text-[clamp(1.75rem,5vw,3.5rem)] font-bold uppercase leading-[1.02] tracking-[0.03em]">
                    <span className="block text-slate-500">
                        {t('landing.audience.sectionTitleMuted')}
                    </span>
                    <span className="block text-white">{t('landing.audience.sectionTitleBold')}</span>
                </h2>
            </div>

            {/* Desktop: imagen full-bleed con copy superpuesto */}
            <div className="relative hidden lg:block">
                <AudienceScrollBlock
                    splitAxis="horizontal"
                    heightClass="h-[min(72vh,560px)] min-h-[480px]"
                    compact={false}
                />
                <div className="relative z-10 mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
                    <AudienceStatsRow />
                </div>
            </div>

            {/* Móvil / tablet: carrusel con imagen extendida y copy en overlay inferior */}
            <div className="relative lg:hidden">
                <AudienceScrollBlock
                    splitAxis="carousel"
                    heightClass="h-[min(85vh,640px)] min-h-[520px]"
                    compact
                />
                <div className="relative z-10 mx-auto max-w-lg px-4 pb-8 pt-4">
                    <AudienceStatsRow />
                </div>
            </div>
        </section>
    );
}

// ─── How It Works ─────────────────────────────────────
function HowItWorks() {
    const { t } = useTranslation();
    return (
        <section id="how-it-works" className="relative overflow-x-clip bg-[#061020] pb-4 pt-14 sm:pb-6 sm:pt-20 lg:pt-24">
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={fadeUp}
                    custom={0}
                    className="mb-4 max-w-3xl sm:mb-8"
                >
                    <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.32em] text-slate-500 sm:text-xs">
                        {t('landing.editorial.featuresSectionLabel')}
                    </p>
                    <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold uppercase leading-[1.05] tracking-[0.03em] text-white">
                        {t('landing.howItWorks.title')}
                    </h2>
                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base lg:text-lg">
                        {t('landing.howItWorks.subtitle')}
                    </p>
                </motion.div>
            </div>

            <EditorialFeatureBlocks />
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
                    <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.32em] text-slate-500 sm:text-xs">
                        {t('landing.editorial.testimonialsSectionLabel')}
                    </p>
                    <h2 className="text-display uppercase tracking-[0.03em] text-white">
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

// ─── CTA Section (editorial) ─────────────────────────
function CTASection() {
    return <EditorialCTA />;
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
                <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="col-span-2 lg:col-span-1">
                        <img
                            src="/logotriadak.png"
                            alt="Triadak"
                            className="mb-3 h-32 w-auto max-w-[280px] object-contain object-left sm:mb-4 sm:h-36 sm:max-w-[320px]"
                        />
                        <p className="max-w-xs text-sm text-slate-500">{t('landing.footer.description')}</p>
                    </div>

                    <div>
                        <h4 className="mb-3 text-sm font-semibold text-white sm:mb-4">
                            {t('landing.footer.product')}
                        </h4>
                        <ul className="space-y-2 sm:space-y-2.5">
                            <li>
                                <a
                                    href="#features"
                                    className="text-sm text-slate-500 transition-colors hover:text-slate-300"
                                >
                                    {t('landing.nav.features')}
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#faq"
                                    className="text-sm text-slate-500 transition-colors hover:text-slate-300"
                                >
                                    {t('landing.nav.faq')}
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-3 text-sm font-semibold text-white sm:mb-4">
                            {t('landing.footer.company')}
                        </h4>
                        <ul className="space-y-2 sm:space-y-2.5">
                            <li>
                                <span className="text-sm text-slate-500">{t('landing.footer.about')}</span>
                            </li>
                            <li>
                                <span className="text-sm text-slate-500">{t('landing.footer.blog')}</span>
                            </li>
                            <li>
                                <span className="text-sm text-slate-500">{t('landing.footer.careers')}</span>
                            </li>
                        </ul>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                        <h4 className="mb-3 text-sm font-semibold text-white sm:mb-4">
                            {t('landing.footer.whyTriadak')}
                        </h4>
                        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-0 sm:space-y-2.5">
                            <li className="flex items-center gap-2 text-sm text-slate-500">
                                <Clock className="h-4 w-4 flex-shrink-0 text-slate-400" />
                                {t('landing.footer.setup2min')}
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-500">
                                <Shield className="h-4 w-4 flex-shrink-0 text-slate-400" />
                                {t('landing.footer.security')}
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-500">
                                <Smartphone className="h-4 w-4 flex-shrink-0 text-slate-400" />
                                {t('landing.footer.mobileFriendly')}
                            </li>
                            <li className="flex items-center gap-2 text-sm text-slate-500">
                                <Globe className="h-4 w-4 flex-shrink-0 text-slate-400" />
                                {t('landing.footer.worldwide')}
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 flex flex-col items-center gap-3 border-t border-white/5 pt-6 sm:mt-12 sm:gap-4 sm:pt-8">
                    <div className="flex w-full flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4">
                        <p className="text-xs text-slate-600">
                            {t('landing.footer.copyright', { year: new Date().getFullYear() })}
                        </p>
                        <div className="flex items-center gap-6">
                            <span className="cursor-pointer text-xs text-slate-600 transition-colors hover:text-slate-400">
                                {t('landing.footer.privacy')}
                            </span>
                            <span className="cursor-pointer text-xs text-slate-600 transition-colors hover:text-slate-400">
                                {t('landing.footer.terms')}
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-700 sm:text-sm">
                        {t('landing.footer.developedBy')}{' '}
                        <a
                            href="https://zirox.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 transition-colors hover:text-slate-300"
                        >
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
        <div className="min-h-screen bg-[#061020] text-slate-100 overflow-x-clip scroll-smooth">
            <Navbar />
            <PropertyScrollHero />
            <HookIlluminatedSection />
            <AudienceSection />
            <Features />
            <ReplaceStackSection />
            <SectionParallaxBridge />
            <PlatformEditorialSection />
            <SectionParallaxBridge />
            <HowItWorks />
            <SectionParallaxBridge />
<Testimonials />
            <LandingFAQ />
            <CTASection />
            <Footer />
        </div>
    );
}
