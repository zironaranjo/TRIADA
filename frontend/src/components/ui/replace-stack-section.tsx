import { useMemo } from 'react';
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

function ToolCard({
    title,
    tag,
    imageSrc,
    icon: Icon,
    index,
}: {
    title: string;
    tag: string;
    imageSrc: string;
    icon: LucideIcon;
    index: number;
}) {
    return (
        <motion.article
            variants={fadeUp}
            custom={index}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 shadow-lg shadow-black/20 transition-colors hover:border-white/20"
        >
            <img
                src={imageSrc}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                draggable={false}
                loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061020] via-[#061020]/60 to-[#061020]/25" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2.5 p-3 text-center sm:gap-3 sm:p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-black/40 backdrop-blur-sm sm:h-11 sm:w-11">
                    <Icon className="h-4 w-4 text-slate-100 sm:h-5 sm:w-5" strokeWidth={1.75} />
                </div>
                <div className="space-y-1">
                    <span className="inline-flex rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-blue-300/90 sm:text-[9px]">
                        {tag}
                    </span>
                    <p className="text-sm font-semibold leading-snug text-white sm:text-base">{title}</p>
                </div>
                <Check className="h-3.5 w-3.5 text-emerald-400/80 sm:h-4 sm:w-4" strokeWidth={2.25} />
            </div>
        </motion.article>
    );
}

export function ReplaceStackSection() {
    const { t } = useTranslation();

    const tools = t('landing.replaceStack.tools', { returnObjects: true }) as string[];
    const toolList = Array.isArray(tools) ? tools : [];

    const toolItems = useMemo(
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
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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
                    </motion.div>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-40px' }}
                    variants={listStagger}
                    className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5"
                >
                    {toolItems.map((item, i) => (
                        <ToolCard
                            key={item.id}
                            title={item.title}
                            tag={item.tag}
                            imageSrc={item.imageSrc}
                            icon={TOOL_ICONS[item.iconIndex] ?? RefreshCw}
                            index={i + 1}
                        />
                    ))}
                </motion.div>

                <p className="mt-5 text-center text-[10px] text-slate-600 sm:mt-6 sm:text-xs">
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
