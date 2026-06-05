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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    'https://images.unsplash.com/photo-1554224315-bb4a0b5a0b0b?w=800&auto=format&fit=crop&q=70',
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop&q=70',
    'https://images.unsplash.com/photo-1611746872915-a19607a5227e?w=800&auto=format&fit=crop&q=70',
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
    const [dims, setDims] = useState<StackDims>({ width: 280, height: 176, spread: 36, maxVisible: 5 });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const update = (width: number) => {
            const cardW = Math.min(480, Math.max(220, Math.floor(width * 0.72)));
            const cardH = Math.round(cardW * 0.58);
            const spread = width < 360 ? 28 : width < 520 ? 36 : 44;
            const maxVisible = width < 360 ? 3 : width < 640 ? 5 : 7;
            setDims({ width: cardW, height: cardH, spread, maxVisible });
        };

        update(el.clientWidth);

        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width ?? el.clientWidth;
            update(w);
        });
        ro.observe(el);
        return () => ro.disconnect();
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
                    <span className="inline-flex rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-blue-300/90">
                        {item.tag}
                    </span>
                    <p className="text-base font-semibold leading-snug text-white sm:text-lg">{item.title}</p>
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
            className="relative overflow-hidden border-t border-white/[0.06] bg-lp py-10 sm:py-14 lg:py-16"
        >
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-40px' }}
                    variants={listStagger}
                    className="mb-8 text-center lg:mb-10"
                >
                    <motion.div variants={fadeUp} custom={0}>
                        <Badge
                            variant="outline"
                            className="mb-3 border-blue-500/25 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-300/90 sm:text-[11px]"
                        >
                            {t('landing.replaceStack.badge')}
                        </Badge>
                        <h2 className="mb-3 text-xl font-bold leading-snug tracking-tight text-white sm:text-2xl lg:text-3xl">
                            {t('landing.replaceStack.titleBefore')}{' '}
                            <span className="text-blue-400/90 line-through decoration-blue-400/50">
                                {t('landing.replaceStack.titleStrike')}
                            </span>
                            <br />
                            <span className="text-white">{t('landing.replaceStack.titleAfter')}</span>
                        </h2>
                        <p className="mx-auto max-w-xl text-xs leading-relaxed text-slate-400 sm:text-sm">
                            {t('landing.replaceStack.description')}
                        </p>
                        <p className="mx-auto mt-3 max-w-md text-[10px] text-slate-500 sm:text-[11px]">
                            {t('landing.replaceStack.stackSwipeHint')}
                        </p>
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.45 }}
                    ref={stackContainerRef}
                    className="relative isolate mx-auto w-full overflow-hidden"
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

                <p className="mt-2 text-center text-[10px] text-slate-600 sm:text-xs">
                    {t('landing.replaceStack.integrationsNote')}
                </p>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-40px' }}
                    variants={fadeUp}
                    custom={1}
                    className="mt-6 flex justify-center sm:mt-8"
                >
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-10 rounded-xl border-white/15 bg-white/[0.04] px-5 text-sm text-white hover:border-white/25 hover:bg-white/[0.08]"
                    >
                        <Link to="/login" className="group">
                            {t('landing.replaceStack.cta')}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}
