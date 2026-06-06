import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, Building2, Globe } from 'lucide-react';
import { CardContent } from '@/components/ui/card';
import ParallaxCards from '@/components/ui/parallaxcards';
import { cn } from '@/lib/utils';

const STEP_ICONS: LucideIcon[] = [Globe, Building2, BarChart3];

const STEP_ACCENTS = [
    {
        card: 'border-sky-500/30 bg-gradient-to-br from-sky-950/40 via-[#061020] to-[#061020] ring-1 ring-inset ring-sky-400/20 shadow-[0_24px_60px_rgba(14,165,233,0.08)]',
        icon: 'border-sky-400/25 bg-sky-500/10 text-sky-200',
        step: 'text-sky-400',
        glow: 'from-sky-500/15',
    },
    {
        card: 'border-violet-500/30 bg-gradient-to-br from-violet-950/35 via-[#061020] to-[#061020] ring-1 ring-inset ring-violet-400/20 shadow-[0_24px_60px_rgba(139,92,246,0.08)]',
        icon: 'border-violet-400/25 bg-violet-500/10 text-violet-200',
        step: 'text-violet-400',
        glow: 'from-violet-500/15',
    },
    {
        card: 'border-cyan-500/30 bg-gradient-to-br from-cyan-950/35 via-[#061020] to-[#061020] ring-1 ring-inset ring-cyan-400/20 shadow-[0_24px_60px_rgba(34,211,238,0.08)]',
        icon: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200',
        step: 'text-cyan-400',
        glow: 'from-cyan-500/15',
    },
] as const;

export function HowItWorksParallax() {
    const { t } = useTranslation();

    const cards = useMemo(
        () =>
            STEP_ICONS.map((Icon, i) => {
                const accent = STEP_ACCENTS[i];
                return {
                    className: accent.card,
                    content: (
                        <CardContent className="relative flex h-full flex-col items-center justify-center px-6 py-10 text-center sm:px-10 sm:py-12">
                            <div
                                className={cn(
                                    'pointer-events-none absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-80',
                                    accent.glow,
                                )}
                            />
                            <span
                                className={cn(
                                    'relative mb-4 text-xs font-bold uppercase tracking-[0.2em]',
                                    accent.step,
                                )}
                            >
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            <div
                                className={cn(
                                    'relative mb-5 flex h-14 w-14 items-center justify-center rounded-xl border sm:h-16 sm:w-16',
                                    accent.icon,
                                )}
                            >
                                <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.75} />
                            </div>
                            <h3 className="relative mb-3 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                                {t(`landing.howItWorks.step${i + 1}Title`)}
                            </h3>
                            <p className="relative max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base lg:text-lg">
                                {t(`landing.howItWorks.step${i + 1}Desc`)}
                            </p>
                        </CardContent>
                    ),
                };
            }),
        [t],
    );

    return (
        <ParallaxCards cards={cards} slideVh={100} className="pb-12 sm:pb-16" />
    );
}
