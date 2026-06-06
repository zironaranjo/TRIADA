import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const BLOCK_KEYS = ['0', '1', '2'] as const;

const BLOCK_ACCENTS = [
    {
        border: 'border-sky-500/20 hover:border-sky-400/35',
        glow: 'from-sky-500/10',
        label: 'text-sky-400/90',
    },
    {
        border: 'border-violet-500/20 hover:border-violet-400/35',
        glow: 'from-violet-500/10',
        label: 'text-violet-400/90',
    },
    {
        border: 'border-cyan-500/20 hover:border-cyan-400/35',
        glow: 'from-cyan-500/10',
        label: 'text-cyan-400/90',
    },
] as const;

export function EditorialFeatureBlocks() {
    const { t } = useTranslation();

    return (
        <div className="relative w-full">
            {BLOCK_KEYS.map((key, i) => {
                const accent = BLOCK_ACCENTS[i];
                const bullets = t(`landing.editorial.features.${key}.bullets`, {
                    returnObjects: true,
                }) as string[];

                return (
                    <motion.article
                        key={key}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.55, delay: i * 0.05 }}
                        className={cn(
                            'relative border-t border-white/[0.06] py-14 sm:py-20 lg:py-24',
                            i === 0 && 'border-t-0',
                        )}
                    >
                        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
                            <div className="lg:col-span-5">
                                <p
                                    className={cn(
                                        'mb-4 text-[10px] font-medium uppercase tracking-[0.32em] sm:text-xs',
                                        accent.label,
                                    )}
                                >
                                    {t(`landing.editorial.features.${key}.index`)}
                                </p>
                                <h3 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold uppercase leading-[1.05] tracking-[0.03em] text-white">
                                    <span className="block text-slate-500">
                                        {t(`landing.editorial.features.${key}.titleLine1`)}
                                    </span>
                                    <span className="block">{t(`landing.editorial.features.${key}.titleLine2`)}</span>
                                </h3>
                            </div>

                            <div className="lg:col-span-7">
                                <div
                                    className={cn(
                                        'relative overflow-hidden rounded-2xl border bg-white/[0.02] p-6 sm:p-8 lg:p-10',
                                        accent.border,
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-80',
                                            accent.glow,
                                        )}
                                    />
                                    <p className="relative text-sm leading-relaxed text-slate-400 sm:text-base lg:text-lg">
                                        {t(`landing.editorial.features.${key}.description`)}
                                    </p>
                                    {Array.isArray(bullets) && bullets.length > 0 && (
                                        <ul className="relative mt-6 space-y-3 border-t border-white/[0.06] pt-6">
                                            {bullets.map((item) => (
                                                <li
                                                    key={item}
                                                    className="flex items-start gap-3 text-sm text-slate-300 sm:text-base"
                                                >
                                                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-400/80" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <Link
                                        to="/login"
                                        className="relative mt-8 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80 transition-colors hover:text-cyan-300 sm:text-xs"
                                    >
                                        {t('landing.editorial.features.explore')}
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.article>
                );
            })}
        </div>
    );
}

export default EditorialFeatureBlocks;
