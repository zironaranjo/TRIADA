import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface SplitScrollPage {
    leftBgImage?: string | null;
    rightBgImage?: string | null;
    leftContent?: React.ReactNode;
    rightContent?: React.ReactNode;
}

export type SplitScrollAxis = 'horizontal' | 'vertical';

export interface SplitScrollAdventureProps {
    pages: SplitScrollPage[];
    className?: string;
    animTimeMs?: number;
    /** Bloquea el scroll de la página al cambiar de slide (solo dentro del contenedor visible). */
    lockPageScroll?: boolean;
    showIndicators?: boolean;
    onPageChange?: (page: number) => void;
    /** horizontal = mitades izq/der (desktop). vertical = arriba/abajo (móvil). */
    splitAxis?: SplitScrollAxis;
}

export function SplitScrollAdventure({
    pages,
    className,
    animTimeMs = 1000,
    lockPageScroll = true,
    showIndicators = true,
    onPageChange,
    splitAxis = 'horizontal',
}: SplitScrollAdventureProps) {
    const isVertical = splitAxis === 'vertical';
    const [currentPage, setCurrentPage] = useState(1);

    const goToPage = useCallback(
        (next: number | ((p: number) => number)) => {
            setCurrentPage((prev) => {
                const value = typeof next === 'function' ? next(prev) : next;
                onPageChange?.(value);
                return value;
            });
        },
        [onPageChange],
    );
    const numOfPages = pages.length;
    const scrolling = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentPageRef = useRef(currentPage);
    currentPageRef.current = currentPage;

    const navigateUp = useCallback(() => {
        goToPage((p) => Math.max(1, p - 1));
    }, [goToPage]);

    const navigateDown = useCallback(() => {
        goToPage((p) => Math.min(numOfPages, p + 1));
    }, [goToPage, numOfPages]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el || !lockPageScroll) return;

        const onWheel = (e: WheelEvent) => {
            if (scrolling.current) {
                e.preventDefault();
                return;
            }

            const rect = el.getBoundingClientRect();
            const inSection =
                rect.top <= window.innerHeight * 0.25 &&
                rect.bottom >= window.innerHeight * 0.4;
            if (!inSection) return;

            const page = currentPageRef.current;
            const goingDown = e.deltaY > 0;
            const goingUp = e.deltaY < 0;

            if (goingDown && page >= numOfPages) return;
            if (goingUp && page <= 1) return;

            e.preventDefault();
            scrolling.current = true;
            if (goingDown) navigateDown();
            else navigateUp();
            window.setTimeout(() => {
                scrolling.current = false;
            }, animTimeMs);
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [lockPageScroll, animTimeMs, numOfPages, navigateDown, navigateUp]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (scrolling.current) return;
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const inSection =
                rect.top <= window.innerHeight * 0.35 &&
                rect.bottom >= window.innerHeight * 0.35;
            if (!inSection) return;

            if (e.key === 'ArrowUp') {
                scrolling.current = true;
                navigateUp();
                window.setTimeout(() => {
                    scrolling.current = false;
                }, animTimeMs);
            } else if (e.key === 'ArrowDown') {
                scrolling.current = true;
                navigateDown();
                window.setTimeout(() => {
                    scrolling.current = false;
                }, animTimeMs);
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [animTimeMs, navigateDown, navigateUp]);

    return (
        <div
            ref={containerRef}
            className={cn('relative overflow-hidden bg-[#061020]', className)}
        >
            {pages.map((page, i) => {
                const idx = i + 1;
                const isActive = currentPage === idx;
                const upOff = 'translateY(-100%)';
                const downOff = 'translateY(100%)';
                const leftTrans = isActive ? 'translateY(0)' : downOff;
                const rightTrans = isActive ? 'translateY(0)' : upOff;

                return (
                    <div
                        key={idx}
                        className={cn(
                            'absolute inset-0 transition-opacity duration-300',
                            isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none',
                        )}
                        aria-hidden={!isActive}
                    >
                        {/* Primera mitad (izq o arriba) */}
                        <div
                            className={cn(
                                'absolute transition-transform ease-in-out',
                                isVertical
                                    ? 'left-0 top-0 h-[45%] w-full'
                                    : 'left-0 top-0 h-full w-1/2',
                            )}
                            style={{
                                transform: leftTrans,
                                transitionDuration: `${animTimeMs}ms`,
                            }}
                        >
                            {page.leftBgImage ? (
                                <ImageHalf
                                    url={page.leftBgImage}
                                    gradient={isVertical ? 'to-b' : 'to-r'}
                                />
                            ) : (
                                <ContentHalf>{page.leftContent}</ContentHalf>
                            )}
                        </div>

                        {/* Segunda mitad (der o abajo) */}
                        <div
                            className={cn(
                                'absolute transition-transform ease-in-out',
                                isVertical
                                    ? 'left-0 top-[45%] h-[55%] w-full'
                                    : 'left-1/2 top-0 h-full w-1/2',
                            )}
                            style={{
                                transform: rightTrans,
                                transitionDuration: `${animTimeMs}ms`,
                            }}
                        >
                            {page.rightBgImage ? (
                                <ImageHalf
                                    url={page.rightBgImage}
                                    gradient={isVertical ? 'to-t' : 'to-l'}
                                />
                            ) : (
                                <ContentHalf>{page.rightContent}</ContentHalf>
                            )}
                        </div>
                    </div>
                );
            })}

            {showIndicators && numOfPages > 1 && (
                <>
                    {/* ── Desktop (horizontal): flechas laterales centradas en su panel ── */}
                    {!isVertical && (
                        <>
                            <button
                                onClick={navigateUp}
                                disabled={currentPage === 1}
                                aria-label="Anterior"
                                className="absolute left-6 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white shadow-lg shadow-black/40 backdrop-blur-sm transition-all hover:scale-105 hover:border-white/55 hover:bg-black/70 disabled:pointer-events-none disabled:opacity-0"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                            </button>

                            <button
                                onClick={navigateDown}
                                disabled={currentPage === numOfPages}
                                aria-label="Siguiente"
                                className="absolute right-6 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white shadow-lg shadow-black/40 backdrop-blur-sm transition-all hover:scale-105 hover:border-white/55 hover:bg-black/70 disabled:pointer-events-none disabled:opacity-0"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </button>

                            {/* Dots desktop — bottom center */}
                            <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
                                {pages.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => goToPage(i + 1)}
                                        aria-label={`Ir a página ${i + 1}`}
                                        className={cn(
                                            'h-1.5 rounded-full transition-all duration-300',
                                            currentPage === i + 1
                                                ? 'w-8 bg-white/80'
                                                : 'w-1.5 bg-white/30 hover:bg-white/55',
                                        )}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* ── Móvil (vertical): pill "Ver siguiente" + dots separados ── */}
                    {isVertical && (
                        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2.5">
                            {/* Dots */}
                            <div className="flex items-center gap-2">
                                {pages.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => goToPage(i + 1)}
                                        aria-label={`Ir a página ${i + 1}`}
                                        className={cn(
                                            'h-1.5 rounded-full transition-all duration-300',
                                            currentPage === i + 1
                                                ? 'w-8 bg-white/80'
                                                : 'w-1.5 bg-white/30 hover:bg-white/55',
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Pills navegación */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={navigateUp}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/8 px-4 py-2 text-[11px] font-medium text-white/80 backdrop-blur-md transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-0"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                                    Anterior
                                </button>

                                <button
                                    onClick={navigateDown}
                                    disabled={currentPage === numOfPages}
                                    className="relative flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-black/30 backdrop-blur-md transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-0"
                                >
                                    <span className="absolute inset-0 rounded-full animate-ping bg-white/10 [animation-duration:2.5s]" />
                                    <span className="relative">Siguiente</span>
                                    <svg className="relative h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function ImageHalf({ url, gradient }: { url: string; gradient: 'to-r' | 'to-l' | 'to-b' | 'to-t' }) {
    const sideGradient = {
        'to-r': 'bg-gradient-to-r from-[#061020]/85 via-[#061020]/35 to-transparent',
        'to-l': 'bg-gradient-to-l from-[#061020]/85 via-[#061020]/35 to-transparent',
        'to-b': 'bg-gradient-to-b from-transparent via-[#061020]/25 to-[#061020]/90',
        'to-t': 'bg-gradient-to-t from-[#061020]/90 via-[#061020]/25 to-transparent',
    }[gradient];

    return (
        <div className="relative h-full w-full">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${url})` }}
            />
            <div className={cn('absolute inset-0', sideGradient)} />
        </div>
    );
}

function ContentHalf({ children }: { children?: React.ReactNode }) {
    return (
        <div className="relative h-full w-full overflow-hidden bg-[#061020]">
            {children}
        </div>
    );
}

export default SplitScrollAdventure;
