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

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.06, duration: 0.4 },
    }),
};

const listStagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
};

export function ReplaceStackSection() {
    const { t } = useTranslation();
    const tools = t('landing.replaceStack.tools', { returnObjects: true }) as string[];
    const integrations = t('landing.replaceStack.integrations', { returnObjects: true }) as string[];
    const toolList = Array.isArray(tools) ? tools : [];
    const integrationList = Array.isArray(integrations) ? integrations : [];

    return (
        <section
            id="replace-stack"
            className="relative border-t border-white/[0.06] bg-lp py-10 sm:py-14 lg:py-20"
        >
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid items-start gap-8 md:gap-10 lg:grid-cols-2 lg:items-center lg:gap-12 xl:gap-14">
                    {/* Columna copy + herramientas reemplazadas */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-40px' }}
                        variants={listStagger}
                        className="flex flex-col"
                    >
                        <motion.div variants={fadeUp} custom={0}>
                            <Badge
                                variant="outline"
                                className="mb-3 border-blue-500/25 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-300/90 sm:text-[11px]"
                            >
                                {t('landing.replaceStack.badge')}
                            </Badge>
                            <h2 className="mb-3 max-w-md text-xl font-bold leading-snug tracking-tight text-white sm:text-2xl lg:text-[1.75rem] xl:text-3xl">
                                {t('landing.replaceStack.titleBefore')}{' '}
                                <span className="text-blue-400/90 line-through decoration-blue-400/50">
                                    {t('landing.replaceStack.titleStrike')}
                                </span>
                                <br />
                                <span className="text-white">{t('landing.replaceStack.titleAfter')}</span>
                            </h2>
                            <p className="mb-5 max-w-md text-xs leading-relaxed text-slate-400 sm:mb-6 sm:text-sm">
                                {t('landing.replaceStack.description')}
                            </p>
                        </motion.div>

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
                                        className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-2 sm:gap-2.5 sm:px-3 sm:py-2.5"
                                    >
                                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] sm:h-8 sm:w-8 sm:rounded-lg">
                                            <Icon
                                                className="h-3.5 w-3.5 text-slate-300 sm:h-4 sm:w-4"
                                                strokeWidth={1.75}
                                            />
                                        </div>
                                        <span className="min-w-0 flex-1 text-[11px] leading-tight text-slate-400 sm:text-xs lg:text-sm">
                                            {name}
                                        </span>
                                        <Check
                                            className="h-3 w-3 flex-shrink-0 text-slate-600 sm:h-3.5 sm:w-3.5"
                                            strokeWidth={2}
                                        />
                                    </div>
                                );
                            })}
                        </motion.div>

                        <motion.div variants={fadeUp} custom={2} className="mt-5 sm:mt-6">
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-10 w-full rounded-xl border-white/15 bg-white/[0.04] text-sm text-white hover:border-white/25 hover:bg-white/[0.08] sm:h-11 sm:w-auto sm:px-5"
                            >
                                <Link to="/login" className="group">
                                    {t('landing.replaceStack.cta')}
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </Button>
                        </motion.div>
                    </motion.div>

                    {/* Columna hub + integraciones (Card shadcn) */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card className="border-white/10 bg-white/[0.02] shadow-none backdrop-blur-sm">
                            <CardContent className="p-4 sm:p-6 lg:p-8">
                                <div className="mb-5 flex flex-col items-center sm:mb-6">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] sm:h-16 sm:w-16 sm:rounded-2xl lg:h-[4.5rem] lg:w-[4.5rem]">
                                        <Layers
                                            className="h-7 w-7 text-slate-200 sm:h-8 sm:w-8"
                                            strokeWidth={1.5}
                                        />
                                    </div>
                                    <p className="mt-2.5 text-sm font-semibold text-white sm:text-base">
                                        {t('landing.replaceStack.hubName')}
                                    </p>
                                    <p className="text-[11px] text-slate-500 sm:text-xs">
                                        {t('landing.replaceStack.hubTagline')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4 sm:gap-x-3 sm:gap-y-5">
                                    {integrationList.map((name, i) => {
                                        const Icon = INTEGRATION_ICONS[i] ?? Globe;
                                        return (
                                            <motion.div
                                                key={name}
                                                initial={{ opacity: 0, y: 8 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: i * 0.04, duration: 0.3 }}
                                                className="group flex flex-col items-center gap-1.5 sm:gap-2"
                                            >
                                                <div
                                                    className={cn(
                                                        'flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] transition-colors',
                                                        'h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11',
                                                        'group-hover:border-white/20 group-hover:bg-white/[0.06]',
                                                    )}
                                                >
                                                    <Icon
                                                        className="h-4 w-4 text-slate-400 transition-colors group-hover:text-slate-200 sm:h-[1.125rem] sm:w-[1.125rem]"
                                                        strokeWidth={1.75}
                                                    />
                                                </div>
                                                <span className="max-w-[4.5rem] text-center text-[9px] leading-tight text-slate-500 transition-colors group-hover:text-slate-300 sm:max-w-none sm:text-[10px] lg:text-xs">
                                                    {name}
                                                </span>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                <p className="mt-4 text-center text-[10px] text-slate-600 sm:mt-5 sm:text-xs">
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
