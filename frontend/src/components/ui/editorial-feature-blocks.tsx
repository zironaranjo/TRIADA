import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GhostIndex } from '@/components/ui/scroll-parallax';

const BLOCK_KEYS = ['0', '1', '2'] as const;

const BLOCK_ACCENTS = [
    { label: 'text-sky-400/90', line: 'from-sky-400/60', ghost: '02.01' },
    { label: 'text-violet-400/90', line: 'from-violet-400/60', ghost: '02.02' },
    { label: 'text-cyan-400/90', line: 'from-cyan-400/60', ghost: '02.03' },
] as const;

function FeatureBlock({ blockKey, index }: { blockKey: (typeof BLOCK_KEYS)[number]; index: number }) {
    const { t } = useTranslation();
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });

    const accent = BLOCK_ACCENTS[index];
    const bullets = t(`landing.editorial.features.${blockKey}.bullets`, {
        returnObjects: true,
    }) as string[];

    const lineWidth = useTransform(scrollYProgress, [0.2, 0.45], ['0%', '100%']);

    return (
        <article
            ref={ref}
            className={cn(
                'relative min-h-[85vh] overflow-x-clip py-16 sm:min-h-[90vh] sm:py-24 lg:min-h-screen lg:py-28',
                index > 0 && 'border-t border-white/[0.06]',
            )}
        >
            <GhostIndex
                scrollYProgress={scrollYProgress}
                label={accent.ghost}
                className="left-0 top-8 text-[clamp(4rem,14vw,11rem)] sm:left-4"
            />

            <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
                {/* Título sticky en desktop */}
                <div className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
                    <p
                        className={cn(
                            'mb-5 text-[10px] font-medium uppercase tracking-[0.32em] sm:text-xs',
                            accent.label,
                        )}
                    >
                        {t(`landing.editorial.features.${blockKey}.index`)}
                    </p>
                    <h3 className="text-[clamp(2rem,5vw,3.5rem)] font-bold uppercase leading-[1.02] tracking-[0.03em]">
                        <span className="block text-slate-500">
                            {t(`landing.editorial.features.${blockKey}.titleLine1`)}
                        </span>
                        <span className="block text-white">
                            {t(`landing.editorial.features.${blockKey}.titleLine2`)}
                        </span>
                    </h3>
                    <motion.div
                        style={{ width: lineWidth }}
                        className={cn('mt-8 h-px max-w-xs bg-gradient-to-r to-transparent', accent.line)}
                    />
                </div>

                <div className="lg:col-span-7 lg:pt-6">
                    <p className="max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg lg:max-w-2xl lg:text-xl lg:leading-relaxed">
                        {t(`landing.editorial.features.${blockKey}.description`)}
                    </p>

                    {Array.isArray(bullets) && bullets.length > 0 && (
                        <ul className="mt-10 space-y-4 sm:mt-12">
                            {bullets.map((item, i) => (
                                <li
                                    key={item}
                                    className="flex items-baseline gap-4 border-b border-white/[0.05] pb-4 text-sm text-slate-300 sm:text-base"
                                >
                                    <span className="shrink-0 text-[10px] font-medium tabular-nums text-slate-600">
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    )}

                    <Link
                        to="/login"
                        className="group mt-10 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/70 transition-colors hover:text-cyan-300 sm:mt-12 sm:text-xs"
                    >
                        {t('landing.editorial.features.explore')}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </article>
    );
}

export function EditorialFeatureBlocks() {
    return (
        <div className="relative w-full">
            {BLOCK_KEYS.map((key, i) => (
                <FeatureBlock key={key} blockKey={key} index={i} />
            ))}
        </div>
    );
}

export default EditorialFeatureBlocks;
