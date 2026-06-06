import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.55 },
    }),
};

export function PlatformEditorialSection() {
    const { t } = useTranslation();
    const pillars = ['0', '1', '2'] as const;

    return (
        <section id="platform" className="relative border-t border-white/[0.06] bg-[#061020] py-16 sm:py-24 lg:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={fadeUp}
                    custom={0}
                    className="mb-10 sm:mb-14"
                >
                    <p className="mb-6 text-[10px] font-medium uppercase tracking-[0.35em] text-slate-500 sm:text-xs">
                        {t('landing.editorial.sectionLabel')}
                    </p>
                    <h2 className="max-w-4xl text-[clamp(1.75rem,5vw,3.5rem)] font-bold uppercase leading-[1.05] tracking-[0.04em] text-white">
                        <span className="text-slate-500">{t('landing.editorial.headlineMuted')}</span>{' '}
                        <span className="text-white">{t('landing.editorial.headlineBold')}</span>
                    </h2>
                    <p className="mt-6 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base lg:text-lg">
                        {t('landing.editorial.description')}
                    </p>
                    <p className="mt-4 text-sm font-medium tracking-wide text-cyan-300/90 sm:text-base">
                        {t('landing.editorial.tagline')}
                    </p>
                </motion.div>

                {/* WHERE → becomes */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    variants={fadeUp}
                    custom={1}
                    className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8 lg:p-12"
                >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.08),transparent_55%)]" />

                    <div className="relative grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-10">
                        <div>
                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                                {t('landing.editorial.whereLabel')}
                            </p>
                            <p className="text-lg font-bold uppercase leading-snug tracking-[0.06em] text-white sm:text-xl lg:text-2xl">
                                {t('landing.editorial.whereTitle')}
                            </p>
                            <p className="mt-4 text-xs font-medium uppercase leading-relaxed tracking-[0.18em] text-slate-400 sm:text-sm">
                                {t('landing.editorial.whereDetail')}
                            </p>
                        </div>

                        <div className="flex items-center justify-center">
                            <span className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400 sm:text-xs">
                                {t('landing.editorial.becomesLabel')}
                            </span>
                        </div>

                        <div className="lg:text-right">
                            <p className="text-lg font-bold uppercase leading-snug tracking-[0.06em] text-cyan-200 sm:text-xl lg:text-2xl">
                                {t('landing.editorial.becomesTitle')}
                            </p>
                            <p className="mt-4 text-xs font-medium uppercase leading-relaxed tracking-[0.18em] text-slate-400 sm:text-sm lg:ml-auto lg:max-w-md">
                                {t('landing.editorial.becomesDetail')}
                            </p>
                            <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-slate-600">
                                {t('landing.editorial.becomesTags')}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Three pillars */}
                <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-3 sm:gap-5">
                    {pillars.map((key, i) => (
                        <motion.div
                            key={key}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-40px' }}
                            variants={fadeUp}
                            custom={i + 2}
                            className={cn(
                                'rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6',
                                'transition-colors hover:border-cyan-500/20 hover:bg-cyan-500/[0.03]',
                            )}
                        >
                            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
                                {t(`landing.editorial.pillars.${key}.label`)}
                            </p>
                            <p className="mt-3 text-sm font-bold uppercase leading-snug tracking-[0.05em] text-white sm:text-base">
                                {t(`landing.editorial.pillars.${key}.title`)}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={5}
                    className="mt-10 flex justify-center sm:mt-14"
                >
                    <Link
                        to="/login"
                        className="group inline-flex items-center gap-2 border border-white/20 bg-white/[0.04] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all hover:border-cyan-400/40 hover:bg-cyan-500/10 sm:text-sm"
                    >
                        {t('landing.editorial.cta')}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}

export default PlatformEditorialSection;
