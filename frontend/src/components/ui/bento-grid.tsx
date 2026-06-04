import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface BentoItem {
    title: string;
    description: string;
    icon: ReactNode;
    status?: string;
    tags?: string[];
    meta?: string;
    cta?: string;
    colSpan?: 1 | 2;
    hasPersistentHover?: boolean;
}

interface BentoGridProps {
    items: BentoItem[];
    className?: string;
    /** Visual 21st.dev sobre la landing oscura (#0f172a) */
    onDarkBackground?: boolean;
}

export function BentoGrid({
    items,
    className,
    onDarkBackground = false,
}: BentoGridProps) {
    return (
        <div
            className={cn(
                'mx-auto grid max-w-7xl grid-cols-1 gap-3 p-0 md:grid-cols-3',
                className,
            )}
        >
            {items.map((item, index) => (
                <div
                    key={`${item.title}-${index}`}
                    className={cn(
                        'group relative overflow-hidden rounded-xl p-4 transition-all duration-300 will-change-transform',
                        item.colSpan === 2 ? 'md:col-span-2' : 'md:col-span-1',
                        onDarkBackground
                            ? [
                                  'border border-white/10 bg-white/[0.04]',
                                  'hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]',
                                  'hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)]',
                                  item.hasPersistentHover &&
                                      '-translate-y-0.5 border-white/20 bg-white/[0.07] shadow-[0_8px_30px_rgba(0,0,0,0.35)]',
                              ]
                            : [
                                  'border border-gray-100/80 bg-white dark:border-white/10 dark:bg-black',
                                  'hover:-translate-y-0.5 hover:shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_2px_12px_rgba(255,255,255,0.03)]',
                                  item.hasPersistentHover &&
                                      '-translate-y-0.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(255,255,255,0.03)]',
                              ],
                    )}
                >
                    <div
                        className={cn(
                            'pointer-events-none absolute inset-0 transition-opacity duration-300',
                            item.hasPersistentHover
                                ? 'opacity-100'
                                : 'opacity-0 group-hover:opacity-100',
                        )}
                    >
                        <div
                            className={cn(
                                'absolute inset-0 bg-[length:4px_4px]',
                                onDarkBackground
                                    ? 'bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_1px,transparent_1px)]'
                                    : 'bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)]',
                            )}
                        />
                    </div>

                    <div
                        className={cn(
                            'pointer-events-none absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-transparent p-px transition-opacity duration-300',
                            onDarkBackground
                                ? 'via-white/15 to-transparent'
                                : 'via-gray-100/50 to-transparent dark:via-white/10',
                            item.hasPersistentHover
                                ? 'opacity-100'
                                : 'opacity-0 group-hover:opacity-100',
                        )}
                    />

                    <div className="relative flex flex-col space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <div
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300',
                                    onDarkBackground
                                        ? 'bg-white/10 group-hover:bg-white/15'
                                        : 'bg-black/5 group-hover:bg-gradient-to-br dark:bg-white/10',
                                )}
                            >
                                {item.icon}
                            </div>
                            <span
                                className={cn(
                                    'rounded-lg px-2 py-1 text-xs font-medium backdrop-blur-sm transition-colors duration-300',
                                    onDarkBackground
                                        ? 'bg-white/10 text-slate-300 group-hover:bg-white/15'
                                        : 'bg-black/5 text-gray-600 group-hover:bg-black/10 dark:bg-white/10 dark:text-gray-300 dark:group-hover:bg-white/20',
                                )}
                            >
                                {item.status || 'Active'}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h3
                                className={cn(
                                    'text-[15px] font-medium tracking-tight',
                                    onDarkBackground
                                        ? 'text-white'
                                        : 'text-gray-900 dark:text-gray-100',
                                )}
                            >
                                {item.title}
                                {item.meta ? (
                                    <span
                                        className={cn(
                                            'ml-2 text-xs font-normal',
                                            onDarkBackground
                                                ? 'text-slate-500'
                                                : 'text-gray-500 dark:text-gray-400',
                                        )}
                                    >
                                        {item.meta}
                                    </span>
                                ) : null}
                            </h3>
                            <p
                                className={cn(
                                    'text-sm leading-snug font-[425]',
                                    onDarkBackground
                                        ? 'text-slate-400'
                                        : 'text-gray-600 dark:text-gray-300',
                                )}
                            >
                                {item.description}
                            </p>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            {item.tags && item.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {item.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className={cn(
                                                'rounded-md px-2 py-1 text-xs backdrop-blur-sm transition-all duration-200',
                                                onDarkBackground
                                                    ? 'bg-white/10 text-slate-400 hover:bg-white/15'
                                                    : 'bg-black/5 text-gray-500 hover:bg-black/10 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/20',
                                            )}
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span />
                            )}
                            {item.cta ? (
                                <span
                                    className={cn(
                                        'text-xs opacity-0 transition-opacity group-hover:opacity-100',
                                        onDarkBackground
                                            ? 'text-indigo-300'
                                            : 'text-gray-500 dark:text-gray-400',
                                    )}
                                >
                                    {item.cta}
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default BentoGrid;
