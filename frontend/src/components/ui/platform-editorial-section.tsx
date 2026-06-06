import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    GhostIndex,
    ParallaxFloat,
    ScrollReveal,
    useSectionScroll,
} from '@/components/ui/scroll-parallax';

const PILLAR_ACCENTS = ['text-sky-400/80', 'text-violet-400/80', 'text-cyan-400/80'] as const;

export function PlatformEditorialSection() {
    const { t } = useTranslation();
    const pillars = ['0', '1', '2'] as const;
    const { ref, scrollYProgress } = useSectionScroll();

    return (
        <section
            ref={ref}
            id="platform"
            className="relative min-h-[90vh] overflow-x-clip border-t border-white/[0.06] bg-[#061020] py-20 sm:py-28 lg:py-36"
        >
            <GhostIndex
                scrollYProgress={scrollYProgress}
                label="01"
                className="right-4 top-16 text-[clamp(5rem,18vw,14rem)] sm:right-8 lg:right-16"
            />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <ScrollReveal scrollYProgress={scrollYProgress} enter={[0.08, 0.32]}>
                    <p className="mb-6 text-[10px] font-medium uppercase tracking-[0.35em] text-slate-500 sm:text-xs">
                        {t('landing.editorial.sectionLabel')}
                    </p>
                    <ParallaxFloat scrollYProgress={scrollYProgress} speed={0.2}>
                        <h2 className="max-w-5xl text-[clamp(2rem,6vw,4.5rem)] font-bold uppercase leading-[1.02] tracking-[0.03em] text-white">
                            <span className="block text-slate-500">
                                {t('landing.editorial.headlineMuted')}
                            </span>
                            <span className="block">{t('landing.editorial.headlineBold')}</span>
                        </h2>
                    </ParallaxFloat>
                    <p className="mt-8 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg lg:text-xl">
                        {t('landing.editorial.description')}
                    </p>
                    <p className="mt-5 text-sm font-medium tracking-[0.12em] text-cyan-300/90 sm:text-base">
                        {t('landing.editorial.tagline')}
                    </p>
                </ScrollReveal>

                {/* WHERE → becomes — sin card, tipografía abierta */}
                <ScrollReveal scrollYProgress={scrollYProgress} enter={[0.22, 0.52]} className="mt-20 sm:mt-28">
                    <div className="relative grid gap-12 lg:grid-cols-[1fr_auto_1fr] lg:items-start lg:gap-16">
                        <ParallaxFloat scrollYProgress={scrollYProgress} speed={0.15} className="lg:pt-4">
                            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-500">
                                {t('landing.editorial.whereLabel')}
                            </p>
                            <p className="text-[clamp(1.25rem,3vw,2rem)] font-bold uppercase leading-tight tracking-[0.05em] text-white">
                                {t('landing.editorial.whereTitle')}
                            </p>
                            <p className="mt-5 max-w-md text-xs font-medium uppercase leading-relaxed tracking-[0.16em] text-slate-500 sm:text-sm">
                                {t('landing.editorial.whereDetail')}
                            </p>
                        </ParallaxFloat>

                        <div className="flex flex-col items-center gap-4 lg:pt-8">
                            <span className="hidden h-24 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent lg:block" />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-600 sm:text-xs">
                                {t('landing.editorial.becomesLabel')}
                            </span>
                            <span className="hidden h-24 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent lg:block" />
                        </div>

                        <ParallaxFloat scrollYProgress={scrollYProgress} speed={-0.12} className="lg:text-right">
                            <p className="text-[clamp(1.25rem,3vw,2rem)] font-bold uppercase leading-tight tracking-[0.05em] text-cyan-200">
                                {t('landing.editorial.becomesTitle')}
                            </p>
                            <p className="mt-5 text-xs font-medium uppercase leading-relaxed tracking-[0.16em] text-slate-500 sm:text-sm lg:ml-auto lg:max-w-md">
                                {t('landing.editorial.becomesDetail')}
                            </p>
                            <p className="mt-4 text-[10px] uppercase tracking-[0.28em] text-slate-600">
                                {t('landing.editorial.becomesTags')}
                            </p>
                        </ParallaxFloat>
                    </div>
                </ScrollReveal>

                {/* Pilares — líneas, sin cajas */}
                <ScrollReveal scrollYProgress={scrollYProgress} enter={[0.38, 0.68]} className="mt-20 sm:mt-28">
                    <div className="grid gap-0 sm:grid-cols-3">
                        {pillars.map((key, i) => (
                            <div
                                key={key}
                                className={cn(
                                    'border-t border-white/[0.08] py-8 sm:border-l sm:border-t-0 sm:py-10 sm:pl-8 sm:first:border-l-0 sm:first:pl-0',
                                )}
                            >
                                <p
                                    className={cn(
                                        'text-[10px] font-medium uppercase tracking-[0.3em]',
                                        PILLAR_ACCENTS[i],
                                    )}
                                >
                                    {t(`landing.editorial.pillars.${key}.label`)}
                                </p>
                                <p className="mt-4 text-lg font-bold uppercase leading-snug tracking-[0.04em] text-white sm:text-xl">
                                    {t(`landing.editorial.pillars.${key}.title`)}
                                </p>
                            </div>
                        ))}
                    </div>
                </ScrollReveal>

                <ScrollReveal scrollYProgress={scrollYProgress} enter={[0.55, 0.82]} className="mt-16 sm:mt-20">
                    <Link
                        to="/login"
                        className="group inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/90 transition-colors hover:text-cyan-300 sm:text-sm"
                    >
                        {t('landing.editorial.cta')}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
                    </Link>
                </ScrollReveal>
            </div>
        </section>
    );
}

export default PlatformEditorialSection;
