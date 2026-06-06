import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowRight,
    CalendarDays,
    Check,
    FileSignature,
    MessageCircle,
    PiggyBank,
    RefreshCw,
    TrendingUp,
    UserCog,
    Users,
} from 'lucide-react';
import { CardStack, type CardStackItem } from '@/components/ui/card-stack';
import { cn } from '@/lib/utils';

const TOOL_ICONS: LucideIcon[] = [
    RefreshCw,
    CalendarDays,
    PiggyBank,
    Users,
    MessageCircle,
    UserCog,
    FileSignature,
    TrendingUp,
];

const TOOL_IMAGES = [
    '/cabin.webp',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=70',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=70',
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop&q=70',
    'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=800&auto=format&fit=crop&q=70',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop&q=70',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop&q=70',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=70',
];

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.05, duration: 0.4 },
    }),
};

const listStagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
};

type StackDims = {
    width: number;
    height: number;
    spread: number;
    maxVisible: number;
};

function useStackContainerDims(containerRef: React.RefObject<HTMLDivElement | null>): StackDims {
    const [dims, setDims] = useState<StackDims>({ width: 280, height: 176, spread: 32, maxVisible: 5 });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const update = () => {
            const width = el.clientWidth || window.innerWidth;
            const maxVisible = width < 480 ? 3 : width < 768 ? 5 : 7;
            const maxOffset = Math.floor(maxVisible / 2);
            const overlap = 0.5;
            const spread = width < 480 ? 24 : width < 768 ? 32 : 40;

            // Ajustar ancho de card para que el abanico quepa sin recortes laterales
            const fanFactor = 1 + 2 * maxOffset * (1 - overlap);
            const available = Math.min(width, window.innerWidth) * 0.98;
            const cardW = Math.min(440, Math.max(200, Math.floor(available / fanFactor)));
            const cardH = Math.round(cardW * 0.58);

            setDims({ width: cardW, height: cardH, spread, maxVisible });
        };

        update();

        const ro = new ResizeObserver(update);
        ro.observe(el);
        window.addEventListener('resize', update);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', update);
        };
    }, [containerRef]);

    return dims;
}

function ToolStackCard({
    item,
    icon: Icon,
    active,
}: {
    item: CardStackItem & { iconIndex: number; tag: string };
    icon: LucideIcon;
    active: boolean;
}) {
    return (
        <div className="relative h-full w-full bg-[#061020]">
            {item.imageSrc ? (
                <img
                    src={item.imageSrc}
                    alt={item.title}
                    className={cn(
                        'absolute inset-0 h-full w-full object-cover transition duration-500',
                        active ? 'scale-100' : 'scale-105',
                    )}
                    draggable={false}
                    loading="lazy"
                />
            ) : null}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061020] via-[#061020]/55 to-[#061020]/15" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 p-4 text-center sm:gap-4 sm:p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-black/40 backdrop-blur-sm sm:h-12 sm:w-12">
                    <Icon className="h-5 w-5 text-slate-100" strokeWidth={1.75} />
                </div>
                <div className="space-y-1">
                    <span className="inline-flex text-[9px] font-medium uppercase tracking-[0.28em] text-cyan-300/90 sm:text-[10px]">
                        {item.tag}
                    </span>
                    <p className="text-base font-bold uppercase leading-snug tracking-[0.03em] text-white sm:text-lg">
                        {item.title}
                    </p>
                </div>
                <Check className="h-4 w-4 text-emerald-400/80" strokeWidth={2.25} />
            </div>
        </div>
    );
}

export function ReplaceStackSection() {
    const { t } = useTranslation();
    const stackContainerRef = useRef<HTMLDivElement>(null);
    const stackDims = useStackContainerDims(stackContainerRef);

    const tools = t('landing.replaceStack.tools', { returnObjects: true }) as string[];
    const toolList = Array.isArray(tools) ? tools : [];

    const stackItems = useMemo(
        () =>
            toolList.map((name, i) => ({
                id: name,
                title: name,
                imageSrc: TOOL_IMAGES[i] ?? TOOL_IMAGES[0],
                tag: t('landing.replaceStack.hubTagline'),
                iconIndex: i,
            })),
        [toolList, t],
    );

    return (
        <section
            id="replace-stack"
            className="relative overflow-visible border-t border-white/[0.06] bg-lp py-16 sm:py-20 lg:py-24"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-40px' }}
                    variants={listStagger}
                    className="mb-10 lg:mb-12"
                >
                    <motion.div variants={fadeUp} custom={0}>
                        <p className="mb-6 text-[10px] font-medium uppercase tracking-[0.35em] text-slate-500 sm:text-xs">
                            {t('landing.replaceStack.badge')}
                        </p>
                        <h2 className="max-w-4xl text-[clamp(1.75rem,5vw,3.25rem)] font-bold uppercase leading-[1.05] tracking-[0.03em]">
                            <span className="block text-slate-500">
                                {t('landing.replaceStack.titleBefore')}{' '}
                                <span className="line-through decoration-slate-600/80">
                                    {t('landing.replaceStack.titleStrike')}
                                </span>
                            </span>
                            <span className="block text-white">{t('landing.replaceStack.titleAfter')}</span>
                        </h2>
                        <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
                            {t('landing.replaceStack.description')}
                        </p>
                        <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-600 sm:text-xs">
                            {t('landing.replaceStack.stackSwipeHint')}
                        </p>
                    </motion.div>
                </motion.div>
            </div>

            {/* CardStack a ancho completo — sin overflow-hidden para no recortar el abanico */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45 }}
                ref={stackContainerRef}
                className="relative isolate mx-auto w-full max-w-[100vw] overflow-visible px-2 sm:px-4"
            >
                <CardStack
                    items={stackItems}
                    initialIndex={0}
                    cardWidth={stackDims.width}
                    cardHeight={stackDims.height}
                    minStageHeight={stackDims.height + 72}
                    maxVisible={stackDims.maxVisible}
                    spreadDeg={stackDims.spread}
                    overlap={0.5}
                    depthPx={120}
                    tiltXDeg={10}
                    activeLiftPx={18}
                    activeScale={1.02}
                    inactiveScale={0.93}
                    perspectivePx={1100}
                    autoAdvance
                    intervalMs={2800}
                    pauseOnHover
                    showDots
                    loop
                    renderCard={(item, { active }) => (
                        <ToolStackCard
                            item={item as CardStackItem & { iconIndex: number; tag: string }}
                            icon={TOOL_ICONS[item.iconIndex as number] ?? RefreshCw}
                            active={active}
                        />
                    )}
                />
            </motion.div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600 sm:text-xs">
                    {t('landing.replaceStack.integrationsNote')}
                </p>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-40px' }}
                    variants={fadeUp}
                    custom={1}
                    className="mt-8 sm:mt-10"
                >
                    <Link
                        to="/login"
                        className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:text-cyan-300 sm:text-sm"
                    >
                        {t('landing.replaceStack.cta')}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
