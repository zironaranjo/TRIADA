import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LpGridBackground } from '@/components/ui/lp-grid-background';

export interface IlluminatedHeroProps extends ComponentPropsWithoutRef<'section'> {
    introLine1: string;
    introLine2?: string;
    highlightText: string;
    trailingLine1?: string;
    trailingLine2?: string;
    description: string;
    descriptionHighlight?: string;
    backgroundNode?: ReactNode;
    className?: string;
}

export function IlluminatedHero({
    introLine1,
    introLine2,
    highlightText,
    trailingLine1,
    trailingLine2,
    description,
    descriptionHighlight,
    backgroundNode,
    className,
    ...props
}: IlluminatedHeroProps) {
    return (
        <section
            className={cn(
                'relative flex w-full min-h-[min(100vh,52rem)] flex-wrap items-center justify-center overflow-hidden border-b border-white/5 bg-lp text-white',
                '[--factor:min(1000px,100vh)] [--size:min(var(--factor),100vw)] text-[calc(var(--size)*0.022)]',
                className,
            )}
            aria-label={highlightText}
            {...props}
        >
            <LpGridBackground patternId="lp-grid-illuminated" />

            {backgroundNode && (
                <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-40">
                    {backgroundNode}
                </div>
            )}

            <div className="bg pointer-events-none absolute h-full w-full max-w-[44em]">
                <div className="shadow-bgt absolute size-full translate-y-[-70%] scale-[1.2] animate-[onloadbgt_1s_ease-in-out_forwards] rounded-[100em] opacity-60" />
                <div className="shadow-bgb absolute size-full translate-y-[70%] scale-[1.2] animate-[onloadbgb_1s_ease-in-out_forwards] rounded-[100em] opacity-60" />
            </div>

            <div
                className="relative z-10 px-4 text-center text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl lg:text-6xl"
                aria-hidden="true"
            >
                {introLine1}
                {introLine2 ? (
                    <>
                        <br />
                        {introLine2}
                    </>
                ) : null}
                <br />
                <span
                    className={cn(
                        'relative inline-block',
                        'before:absolute before:animate-[onloadopacity_1s_ease-out_forwards] before:opacity-0 before:content-[attr(data-text)]',
                        'before:bg-[linear-gradient(0deg,#dfe5ee_0%,#fffaf6_50%)] before:bg-clip-text before:text-[#fffaf6]',
                        '[filter:url(#glow-4)]',
                    )}
                    data-text={highlightText}
                >
                    {highlightText}
                </span>
                {trailingLine1 ? (
                    <>
                        <br />
                        {trailingLine1}
                    </>
                ) : null}
                {trailingLine2 ? (
                    <>
                        <br />
                        {trailingLine2}
                    </>
                ) : null}
            </div>

            <p className="absolute top-0 bottom-0 z-10 m-auto h-fit max-w-[28em] translate-y-[10em] px-6 bg-gradient-to-t from-[#86868b] to-[#bdc2c9] bg-clip-text text-center text-sm font-semibold text-transparent sm:translate-y-[12em] sm:text-base">
                {descriptionHighlight ? (
                    <>
                        {description.split(descriptionHighlight)[0]}
                        <span className="relative inline-block font-black text-[#e7dfd6]">
                            {descriptionHighlight}
                        </span>
                        {description.split(descriptionHighlight)[1] ?? ''}
                    </>
                ) : (
                    description
                )}
            </p>

            <svg
                className="absolute -z-10 h-0 w-0"
                width="1440"
                height="300"
                viewBox="0 0 1440 300"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
            >
                <defs>
                    <filter
                        id="glow-4"
                        colorInterpolationFilters="sRGB"
                        x="-50%"
                        y="-200%"
                        width="200%"
                        height="500%"
                    >
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur4" />
                        <feGaussianBlur in="SourceGraphic" stdDeviation="19" result="blur19" />
                        <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur9" />
                        <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur30" />
                        <feColorMatrix
                            in="blur4"
                            result="color-0-blur"
                            type="matrix"
                            values="1 0 0 0 0  0 0.98 0 0 0  0 0 0.96 0 0  0 0 0 0.8 0"
                        />
                        <feOffset in="color-0-blur" result="layer-0-offsetted" dx="0" dy="0" />
                        <feColorMatrix
                            in="blur19"
                            result="color-1-blur"
                            type="matrix"
                            values="0.82 0 0 0 0  0 0.49 0 0 0  0 0 0.26 0 0  0 0 0 1 0"
                        />
                        <feOffset in="color-1-blur" result="layer-1-offsetted" dx="0" dy="2" />
                        <feColorMatrix
                            in="blur9"
                            result="color-2-blur"
                            type="matrix"
                            values="1 0 0 0 0  0 0.67 0 0 0  0 0 0.36 0 0  0 0 0 0.65 0"
                        />
                        <feOffset in="color-2-blur" result="layer-2-offsetted" dx="0" dy="2" />
                        <feColorMatrix
                            in="blur30"
                            result="color-3-blur"
                            type="matrix"
                            values="1 0 0 0 0  0 0.61 0 0 0  0 0 0.39 0 0  0 0 0 1 0"
                        />
                        <feOffset in="color-3-blur" result="layer-3-offsetted" dx="0" dy="2" />
                        <feColorMatrix
                            in="blur30"
                            result="color-4-blur"
                            type="matrix"
                            values="0.45 0 0 0 0  0 0.16 0 0 0  0 0 0 0 0  0 0 0 1 0"
                        />
                        <feOffset in="color-4-blur" result="layer-4-offsetted" dx="0" dy="16" />
                        <feColorMatrix
                            in="blur30"
                            result="color-5-blur"
                            type="matrix"
                            values="0.42 0 0 0 0  0 0.2 0 0 0  0 0 0.11 0 0  0 0 0 1 0"
                        />
                        <feOffset in="color-5-blur" result="layer-5-offsetted" dx="0" dy="64" />
                        <feColorMatrix
                            in="blur30"
                            result="color-6-blur"
                            type="matrix"
                            values="0.21 0 0 0 0  0 0.11 0 0 0  0 0 0.07 0 0  0 0 0 1 0"
                        />
                        <feOffset in="color-6-blur" result="layer-6-offsetted" dx="0" dy="64" />
                        <feColorMatrix
                            in="blur30"
                            result="color-7-blur"
                            type="matrix"
                            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.68 0"
                        />
                        <feOffset in="color-7-blur" result="layer-7-offsetted" dx="0" dy="64" />
                        <feMerge>
                            <feMergeNode in="layer-0-offsetted" />
                            <feMergeNode in="layer-1-offsetted" />
                            <feMergeNode in="layer-2-offsetted" />
                            <feMergeNode in="layer-3-offsetted" />
                            <feMergeNode in="layer-4-offsetted" />
                            <feMergeNode in="layer-5-offsetted" />
                            <feMergeNode in="layer-6-offsetted" />
                            <feMergeNode in="layer-7-offsetted" />
                            <feMergeNode in="layer-0-offsetted" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
            </svg>
        </section>
    );
}

export default IlluminatedHero;
