import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowRight,
    Building2,
    CalendarDays,
    Check,
    CreditCard,
    FileSignature,
    Globe,
    Layers,
    MessageCircle,
    PiggyBank,
    RefreshCw,
    Smartphone,
    TrendingUp,
    UserCog,
    Users,
    Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

const INTEGRATION_ICONS: LucideIcon[] = [
    Building2,
    Globe,
    Building2,
    Zap,
    CreditCard,
    MessageCircle,
    CalendarDays,
    Smartphone,
];

const INTEGRATION_IMAGES = [
    '/cabin.webp',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=70',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=70',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop&q=70',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop&q=70',
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&auto=format&fit=crop&q=70',
    'https://images.unsplash.com/photo-1506784362847-ccbadf1f4e88?w=800&auto=format&fit=crop&q=70',
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=70',
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
};

function useStackContainerDims(containerRef: React.RefObject<HTMLDivElement | null>): StackDims {
    const [dims, setDims] = useState<StackDims>({ width: 240, height: 160, spread: 14 });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const update = (width: number) => {
            const cardW = Math.min(300, Math.max(200, Math.floor(width * 0.78)));
            const cardH = Math.round(cardW * 0.58);
            const spread = width < 320 ? 10 : width < 420 ? 14 : 18;
            setDims({ width: cardW, height: cardH, spread });
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

function IntegrationStackCard({
    item,
    icon: Icon,
    active,
}: {
    item: CardStackItem & { iconIndex: number };
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
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061020] via-[#061020]/45 to-[#061020]/15" />
            <div className="relative z-10 flex h-full flex-col justify-between p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md border border-white/10 bg-black/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-300 backdrop-blur-sm">
                        {item.tag}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/40 backdrop-blur-sm">
                        <Icon className="h-3.5 w-3.5 text-slate-200" strokeWidth={1.75} />
                    </div>
                </div>
                <p className="truncate text-sm font-semibold text-white sm:text-base">{item.title}</p>
            </div>
        </div>
    );
}

export function ReplaceStackSection() {
    const { t } = useTranslation();
    const stackContainerRef = useRef<HTMLDivElement>(null);
    const stackDims = useStackContainerDims(stackContainerRef);

    const tools = t('landing.replaceStack.tools', { returnObjects: true }) as string[];
    const integrations = t('landing.replaceStack.integrations', { returnObjects: true }) as string[];
    const toolList = Array.isArray(tools) ? tools : [];
    const integrationList = Array.isArray(integrations) ? integrations : [];

    const stackItems = useMemo(
        () =>
            integrationList.map((name, i) => ({
                id: name,
                title: name,
                imageSrc: INTEGRATION_IMAGES[i] ?? INTEGRATION_IMAGES[0],
                tag: t('landing.replaceStack.stackTag'),
                iconIndex: i,
            })),
        [integrationList, t],
    );

    return (
        <section
            id="replace-stack"
            className="relative overflow-hidden border-t border-white/[0.06] bg-lp py-10 sm:py-14 lg:py-16"
        >
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Cabecera — ancho completo, sin solaparse con el stack */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-40px' }}
                    variants={listStagger}
                    className="mb-8 max-w-2xl lg:mb-10"
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
                        <p className="max-w-xl text-xs leading-relaxed text-slate-400 sm:text-sm">
                            {t('landing.replaceStack.description')}
                        </p>
                    </motion.div>
                </motion.div>

                {/* Cuerpo: herramientas | carrusel — columnas aisladas */}
                <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
                    {/* Izquierda: lista + CTA */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-40px' }}
                        variants={listStagger}
                        className="relative z-10 min-w-0"
                    >
                        <motion.div
                            variants={fadeUp}
                            custom={1}
                            className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:gap-2.5"
                        >
                            {toolList.map((name, i) => {
                                const Icon = TOOL_ICONS[i] ?? RefreshCw;
                                return (
                                    <div
                                        key={name}
                                        className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-2 sm:px-3 sm:py-2.5"
                                    >
                                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] sm:h-8 sm:w-8">
                                            <Icon className="h-3.5 w-3.5 text-slate-300 sm:h-4 sm:w-4" strokeWidth={1.75} />
                                        </div>
                                        <span className="min-w-0 flex-1 text-[11px] text-slate-400 sm:text-xs">
                                            {name}
                                        </span>
                                        <Check className="h-3 w-3 flex-shrink-0 text-slate-600" strokeWidth={2} />
                                    </div>
                                );
                            })}
                        </motion.div>

                        <motion.div variants={fadeUp} custom={2} className="mt-5 sm:mt-6">
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-10 w-full rounded-xl border-white/15 bg-white/[0.04] text-sm text-white hover:border-white/25 hover:bg-white/[0.08] sm:w-auto sm:px-5"
                            >
                                <Link to="/login" className="group">
                                    {t('landing.replaceStack.cta')}
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </Button>
                        </motion.div>
                    </motion.div>

                    {/* Derecha: stack contenido — sin desbordar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.45 }}
                        className="relative z-0 min-w-0"
                    >
                        <Card className="overflow-hidden border-white/10 bg-white/[0.02] shadow-none">
                            <CardContent className="p-4 sm:p-5">
                                <div className="mb-3 flex items-center gap-3 border-b border-white/[0.06] pb-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">
                                        <Layers className="h-5 w-5 text-slate-200" strokeWidth={1.5} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white">{t('landing.replaceStack.hubName')}</p>
                                        <p className="text-[10px] text-slate-500 sm:text-[11px]">
                                            {t('landing.replaceStack.stackSwipeHint')}
                                        </p>
                                    </div>
                                </div>

                                <div
                                    ref={stackContainerRef}
                                    className="relative isolate w-full overflow-hidden rounded-xl bg-[#040c18]/50"
                                >
                                    <CardStack
                                        items={stackItems}
                                        cardWidth={stackDims.width}
                                        cardHeight={stackDims.height}
                                        minStageHeight={stackDims.height + 44}
                                        maxVisible={3}
                                        spreadDeg={stackDims.spread}
                                        overlap={0.62}
                                        depthPx={60}
                                        tiltXDeg={6}
                                        activeLiftPx={10}
                                        activeScale={1.01}
                                        inactiveScale={0.94}
                                        perspectivePx={900}
                                        autoAdvance
                                        intervalMs={3500}
                                        pauseOnHover
                                        showDots
                                        loop
                                        className="mx-auto max-w-full"
                                        renderCard={(item, { active }) => (
                                            <IntegrationStackCard
                                                item={item as CardStackItem & { iconIndex: number }}
                                                icon={INTEGRATION_ICONS[item.iconIndex as number] ?? Globe}
                                                active={active}
                                            />
                                        )}
                                    />
                                </div>

                                <p className="mt-3 text-center text-[10px] text-slate-600 sm:text-xs">
                                    {t('landing.replaceStack.integrationsNote')}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
