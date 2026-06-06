import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const wordStagger = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: 0.15 + i * 0.07, duration: 0.5 },
    }),
};

export function EditorialCTA() {
    const { t } = useTranslation();
    const leadWords = t('landing.editorial.ctaBlock.leadWords', { returnObjects: true }) as string[];
    const mainWords = t('landing.editorial.ctaBlock.mainWords', { returnObjects: true }) as string[];
    const subWords = t('landing.editorial.ctaBlock.subWords', { returnObjects: true }) as string[];

    return (
        <section className="relative border-t border-white/[0.06] py-20 sm:py-28 lg:py-36">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.06),transparent_60%)]" />
            <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    className="mb-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2"
                >
                    {Array.isArray(leadWords) &&
                        leadWords.map((word, i) => (
                            <motion.span
                                key={`lead-${word}`}
                                custom={i}
                                variants={wordStagger}
                                className="text-[clamp(1.5rem,4vw,2.5rem)] font-bold uppercase tracking-[0.06em] text-slate-500"
                            >
                                {word}
                            </motion.span>
                        ))}
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    className="mb-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1"
                >
                    {Array.isArray(mainWords) &&
                        mainWords.map((word, i) => (
                            <motion.span
                                key={`main-${word}`}
                                custom={i + 3}
                                variants={wordStagger}
                                className="text-[clamp(1.75rem,5vw,3.25rem)] font-bold uppercase leading-none tracking-[0.04em] text-white"
                            >
                                {word}
                            </motion.span>
                        ))}
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                    className="mx-auto mb-10 max-w-2xl text-sm text-slate-400 sm:text-base lg:text-lg"
                >
                    {t('landing.editorial.ctaBlock.description')}
                </motion.p>

                {Array.isArray(subWords) && subWords.length > 0 && (
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="mb-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-1"
                    >
                        {subWords.map((word, i) => (
                            <motion.span
                                key={`sub-${word}`}
                                custom={i + 8}
                                variants={wordStagger}
                                className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500 sm:text-sm"
                            >
                                {word}
                                {i < subWords.length - 1 && (
                                    <span className="ml-2 text-slate-700">·</span>
                                )}
                            </motion.span>
                        ))}
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.45, duration: 0.5 }}
                    className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
                >
                    <Link
                        to="/login"
                        className="group inline-flex w-full items-center justify-center gap-2 border border-white/25 bg-white/[0.06] px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-all hover:border-cyan-400/40 hover:bg-cyan-500/10 sm:w-auto sm:text-sm"
                    >
                        {t('landing.editorial.ctaBlock.primary')}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <a
                        href="#features"
                        className="inline-flex w-full items-center justify-center border border-white/10 px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 transition-colors hover:border-white/20 hover:text-white sm:w-auto sm:text-sm"
                    >
                        {t('landing.editorial.ctaBlock.secondary')}
                    </a>
                </motion.div>
            </div>
        </section>
    );
}

export default EditorialCTA;
