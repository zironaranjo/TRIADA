import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

export type FeatureCarouselItem = {
    title: string;
    description: string;
    meta?: string;
    status?: string;
    tags?: string[];
    cta?: string;
    icon: ReactNode;
};

const PREMIUM_ACCENTS = [
    {
        ring: 'ring-sky-400/35',
        border: 'border-sky-500/25',
        glow: 'from-sky-500/20 via-sky-400/5 to-transparent',
        badge: 'border-sky-400/20 bg-sky-500/15 text-sky-200',
        icon: 'border-sky-400/25 bg-sky-500/10',
        tag: 'bg-sky-500/10 text-sky-200/90',
    },
    {
        ring: 'ring-cyan-400/35',
        border: 'border-cyan-500/25',
        glow: 'from-cyan-500/20 via-cyan-400/5 to-transparent',
        badge: 'border-cyan-400/20 bg-cyan-500/15 text-cyan-100',
        icon: 'border-cyan-400/25 bg-cyan-500/10',
        tag: 'bg-cyan-500/10 text-cyan-100/90',
    },
    {
        ring: 'ring-violet-400/35',
        border: 'border-violet-500/25',
        glow: 'from-violet-500/20 via-violet-400/5 to-transparent',
        badge: 'border-violet-400/20 bg-violet-500/15 text-violet-100',
        icon: 'border-violet-400/25 bg-violet-500/10',
        tag: 'bg-violet-500/10 text-violet-100/90',
    },
    {
        ring: 'ring-emerald-400/35',
        border: 'border-emerald-500/25',
        glow: 'from-emerald-500/20 via-emerald-400/5 to-transparent',
        badge: 'border-emerald-400/20 bg-emerald-500/15 text-emerald-100',
        icon: 'border-emerald-400/25 bg-emerald-500/10',
        tag: 'bg-emerald-500/10 text-emerald-100/90',
    },
    {
        ring: 'ring-amber-400/35',
        border: 'border-amber-500/25',
        glow: 'from-amber-500/20 via-amber-400/5 to-transparent',
        badge: 'border-amber-400/20 bg-amber-500/15 text-amber-100',
        icon: 'border-amber-400/25 bg-amber-500/10',
        tag: 'bg-amber-500/10 text-amber-100/90',
    },
    {
        ring: 'ring-rose-400/35',
        border: 'border-rose-500/25',
        glow: 'from-rose-500/20 via-rose-400/5 to-transparent',
        badge: 'border-rose-400/20 bg-rose-500/15 text-rose-100',
        icon: 'border-rose-400/25 bg-rose-500/10',
        tag: 'bg-rose-500/10 text-rose-100/90',
    },
] as const;

function FeaturePremiumCard({ item, index }: { item: FeatureCarouselItem; index: number }) {
    const accent = PREMIUM_ACCENTS[index % PREMIUM_ACCENTS.length];

    return (
        <Card
            className={cn(
                'relative overflow-hidden border bg-[#0a1628]/90 shadow-none backdrop-blur-md',
                'ring-1 ring-inset',
                accent.border,
                accent.ring,
            )}
        >
            <div
                className={cn(
                    'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80',
                    accent.glow,
                )}
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <CardContent className="relative flex min-h-[280px] flex-col p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <div
                        className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-sm',
                            accent.icon,
                        )}
                    >
                        {item.icon}
                    </div>
                    {item.status ? (
                        <span
                            className={cn(
                                'rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm',
                                accent.badge,
                            )}
                        >
                            {item.status}
                        </span>
                    ) : null}
                </div>

                <div className="mb-3 space-y-1">
                    <h3 className="text-base font-semibold leading-snug text-white">
                        {item.title}
                        {item.meta ? (
                            <span className="ml-2 text-xs font-normal text-slate-500">{item.meta}</span>
                        ) : null}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-400">{item.description}</p>
                </div>

                {item.tags && item.tags.length > 0 ? (
                    <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                        {item.tags.map((tag) => (
                            <span
                                key={tag}
                                className={cn(
                                    'rounded-md px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm',
                                    accent.tag,
                                )}
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                ) : null}

                {item.cta ? (
                    <p className="mt-3 text-xs font-medium text-slate-500">{item.cta}</p>
                ) : null}
            </CardContent>
        </Card>
    );
}

export function FeaturesMobileCarousel({ items }: { items: FeatureCarouselItem[] }) {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);

    const onSelect = useCallback((carouselApi: CarouselApi) => {
        if (!carouselApi) return;
        setCurrent(carouselApi.selectedScrollSnap());
    }, []);

    useEffect(() => {
        if (!api) return;
        onSelect(api);
        api.on('select', onSelect);
        api.on('reInit', onSelect);
        return () => {
            api.off('select', onSelect);
        };
    }, [api, onSelect]);

    return (
        <div className="md:hidden">
            <Carousel
                setApi={setApi}
                opts={{ align: 'start', loop: false }}
                className="mx-auto w-full max-w-sm"
            >
                <CarouselContent className="-ml-3">
                    {items.map((item, index) => (
                        <CarouselItem key={item.title} className="basis-[88%] pl-3 sm:basis-[82%]">
                            <FeaturePremiumCard item={item} index={index} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            <div className="mt-4 flex items-center justify-center gap-1.5">
                {items.map((item, index) => (
                    <button
                        key={item.title}
                        type="button"
                        aria-label={`Ir a ${item.title}`}
                        onClick={() => api?.scrollTo(index)}
                        className={cn(
                            'h-1.5 rounded-full transition-all',
                            current === index ? 'w-5 bg-white/80' : 'w-1.5 bg-white/25',
                        )}
                    />
                ))}
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-600">Desliza para ver todas las funciones →</p>
        </div>
    );
}
