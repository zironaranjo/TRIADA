import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import {
    GhostIndex,
    ParallaxFloat,
    ScrollReveal,
    useSectionScroll,
} from '@/components/ui/scroll-parallax';

export function EditorialCTA() {
    const { t } = useTranslation();
    const { ref, scrollYProgress } = useSectionScroll();

    const leadWords = t('landing.editorial.ctaBlock.leadWords', { returnObjects: true }) as string[];
    const mainWords = t('landing.editorial.ctaBlock.mainWords', { returnObjects: true }) as string[];
    const subWords = t('landing.editorial.ctaBlock.subWords', { returnObjects: true }) as string[];

    const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

    return (
        <section
            ref={ref}
            className="relative min-h-[80vh] overflow-x-clip border-t border-white/[0.06] py-24 sm:py-32 lg:py-40"
        >
            <motion.div
                style={{ y: bgY }}
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(56,189,248,0.09),transparent_55%)]"
            />
            <GhostIndex
                scrollYProgress={scrollYProgress}
                label="04"
                className="right-6 top-20 text-[clamp(4rem,12vw,9rem)] text-cyan-500/10 sm:right-12"
            />

            <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <ScrollReveal scrollYProgress={scrollYProgress} enter={[0.1, 0.38]}>
                    <div className="mb-8 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-2">
                        {Array.isArray(leadWords) &&
                            leadWords.map((word) => (
                                <span
                                    key={`lead-${word}`}
                                    className="text-[clamp(1.5rem,4vw,2.75rem)] font-bold uppercase tracking-[0.06em] text-slate-500"
                                >
                                    {word}
                                </span>
                            ))}
                    </div>
                </ScrollReveal>

                <ParallaxFloat scrollYProgress={scrollYProgress} speed={0.18}>
                    <ScrollReveal scrollYProgress={scrollYProgress} enter={[0.18, 0.48]}>
                        <div className="mb-6 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
                            {Array.isArray(mainWords) &&
                                mainWords.map((word) => (
                                    <span
                                        key={`main-${word}`}
                                        className="text-[clamp(1.85rem,5.5vw,4rem)] font-bold uppercase leading-none tracking-[0.03em] text-white"
                                    >
                                        {word}
                                    </span>
                                ))}
                        </div>
                    </ScrollReveal>
                </ParallaxFloat>

                <ScrollReveal scrollYProgress={scrollYProgress} enter={[0.28, 0.55]}>
                    <p className="mx-auto mb-12 max-w-2xl text-center text-base leading-relaxed text-slate-400 sm:text-lg">
                        {t('landing.editorial.ctaBlock.description')}
                    </p>
                </ScrollReveal>

                {Array.isArray(subWords) && subWords.length > 0 && (
                    <ScrollReveal scrollYProgress={scrollYProgress} enter={[0.35, 0.62]}>
                        <div className="mb-14 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                            {subWords.map((word) => (
                                <span
                                    key={`sub-${word}`}
                                    className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500 sm:text-sm"
                                >
                                    {word}
                                </span>
                            ))}
                        </div>
                    </ScrollReveal>
                )}

                <ScrollReveal scrollYProgress={scrollYProgress} enter={[0.42, 0.72]}>
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
                        <Link
                            to="/login"
                            className="group inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:text-cyan-300 sm:text-sm"
                        >
                            {t('landing.editorial.ctaBlock.primary')}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                        </Link>
                        <span className="hidden h-4 w-px bg-white/15 sm:block" />
                        <a
                            href="#features"
                            className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 transition-colors hover:text-white sm:text-sm"
                        >
                            {t('landing.editorial.ctaBlock.secondary')}
                        </a>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}

export default EditorialCTA;
