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
}

export function BentoGrid({ items, className }: BentoGridProps) {
    return (
        <div
            className={cn(
                'mx-auto grid max-w-7xl grid-cols-1 gap-3 md:grid-cols-3',
                className,
            )}
        >
            {items.map((item, index) => (
                <div
                    key={`${item.title}-${index}`}
                    className={cn(
                        'group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300',
                        'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm will-change-transform',
                        item.colSpan === 2 ? 'md:col-span-2' : 'md:col-span-1',
                        item.hasPersistentHover &&
                            '-translate-y-0.5 border-primary/25 shadow-sm',
                    )}
                >
                    <div
                        className={cn(
                            'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300',
                            item.hasPersistentHover
                                ? 'opacity-100'
                                : 'group-hover:opacity-100',
                        )}
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--border))_1px,transparent_1px)] bg-[length:4px_4px] opacity-40" />
                    </div>

                    <div className="relative flex flex-col space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted transition-colors duration-300 group-hover:border-primary/30 group-hover:bg-accent">
                                {item.icon}
                            </div>
                            {item.status ? (
                                <span className="rounded-lg bg-muted px-2 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors group-hover:bg-accent">
                                    {item.status}
                                </span>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                                {item.title}
                                {item.meta ? (
                                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                                        {item.meta}
                                    </span>
                                ) : null}
                            </h3>
                            <p className="text-sm leading-snug text-muted-foreground">
                                {item.description}
                            </p>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                            {item.tags && item.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {item.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span />
                            )}
                            {item.cta ? (
                                <span className="text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
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
