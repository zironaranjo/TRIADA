import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { StripedGrid } from '@/components/ui/striped-grid';
import { cn } from '@/lib/utils';
import {
    GhostIndex,
    ParallaxFloat,
    ScrollReveal,
    useSectionScroll,
} from '@/components/ui/scroll-parallax';

export type EditorialFeatureItem = {
    title: string;
    description: string;
    meta?: string;
    status?: string;
    tags?: string[];
    icon: ReactNode;
};

const ROW_ACCENTS = [
    'text-sky-400/85',
    'text-cyan-400/85',
    'text-violet-400/85',
    'text-emerald-400/85',
    'text-amber-400/85',
    'text-rose-400/85',
] as const;

function FeatureRow({
    item,
    index,
}: {
    item: EditorialFeatureItem;
    index: number;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });
    const contentY = useTransform(scrollYProgress, [0, 1], [24, -24]);
    const opacity = useTransform(scrollYProgress, [0.12, 0.35, 0.75], [0.35, 1, 1]);
    const lineWidth = useTransform(scrollYProgress, [0.2, 0.5], ['0%', '100%']);

    const words = item.title.trim().split(/\s+/);
    const titleFirst = words[0] ?? item.title;
    const titleRest = words.slice(1).join(' ');

    return (
        <div
            ref={ref}
            className="grid gap-6 py-10 sm:grid-cols-12 sm:gap-10 sm:py-14 lg:py-16"
        >
            <motion.div style={{ opacity }} className="sm:col-span-4 lg:col-span-5">
                <p
                    className={cn(
                        'mb-4 text-[10px] font-medium uppercase tracking-[0.32em]',
                        ROW_ACCENTS[index % ROW_ACCENTS.length],
                    )}
                >
                    {String(index + 1).padStart(2, '0')}
                </p>
                <div className="mb-5 flex items-center gap-3 text-slate-400">{item.icon}</div>
                <h3 className="text-[clamp(1.35rem,3vw,2rem)] font-bold uppercase leading-[1.05] tracking-[0.03em]">
                    <span className="text-slate-500">{titleFirst}</span>
                    {titleRest ? <span className="text-white"> {titleRest}</span> : null}
                </h3>
                {(item.meta || item.status) && (
                    <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-600 sm:text-xs">
                        {[item.meta, item.status].filter(Boolean).join(' · ')}
                    </p>
                )}
                <motion.div
                    style={{ width: lineWidth }}
                    className="mt-6 h-px max-w-[8rem] bg-gradient-to-r from-cyan-400/50 to-transparent"
                />
            </motion.div>

            <motion.div style={{ y: contentY, opacity }} className="sm:col-span-8 lg:col-span-7">
                <p className="max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base lg:max-w-2xl lg:text-lg lg:leading-relaxed">
                    {item.description}
                </p>
                {item.tags && item.tags.length > 0 && (
                    <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600 sm:text-xs">
                        {item.tags.join(' · ')}
                    </p>
                )}
            </motion.div>
        </div>
    );
}

export function EditorialFeaturesSection({ items }: { items: EditorialFeatureItem[] }) {
    const { t } = useTranslation();
    const { ref, scrollYProgress } = useSectionScroll();

    return (
        <section
            ref={ref}
            id="features"
            className="relative overflow-x-clip border-t border-white/[0.06]"
        >
            <StripedGrid
                speed="4s"
                backgroundColor="#061020"
                stripeColor="56, 189, 248"
                stripeWidth="1px"
                stripeSpacing="12px"
                opacity={0.08}
                baseGridOpacity={0.05}
                enableBaseGrid
                className="relative w-full py-16 sm:py-24 lg:py-32"
            >
                <GhostIndex
                    scrollYProgress={scrollYProgress}
                    label="06"
                    className="right-2 top-12 text-[clamp(4rem,16vw,12rem)] sm:right-8 lg:right-16"
                />

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <ScrollReveal scrollYProgress={scrollYProgress} enter={[0.06, 0.28]}>
                        <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.35em] text-slate-500 sm:text-xs">
                            {t('landing.features.badge')}
                        </p>
                        <ParallaxFloat scrollYProgress={scrollYProgress} speed={0.15}>
                            <h2 className="max-w-4xl text-[clamp(1.75rem,5vw,3.5rem)] font-bold uppercase leading-[1.04] tracking-[0.03em] text-white">
                                {t('landing.features.title')}
                            </h2>
                        </ParallaxFloat>
                        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base lg:text-lg">
                            {t('landing.features.subtitle')}
                        </p>
                    </ScrollReveal>

                    <ScrollReveal
                        scrollYProgress={scrollYProgress}
                        enter={[0.18, 0.45]}
                        className="mt-12 divide-y divide-white/[0.06] sm:mt-16 lg:mt-20"
                    >
                        {items.map((item, index) => (
                            <FeatureRow key={item.title} item={item} index={index} />
                        ))}
                    </ScrollReveal>

                    <ScrollReveal scrollYProgress={scrollYProgress} enter={[0.5, 0.78]} className="mt-10 sm:mt-14">
                        <a
                            href="#how-it-works"
                            className="group inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/80 transition-colors hover:text-cyan-300 sm:text-sm"
                        >
                            {t('landing.features.cta')}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                        </a>
                    </ScrollReveal>
                </div>
            </StripedGrid>
        </section>
    );
}

export default EditorialFeaturesSection;
