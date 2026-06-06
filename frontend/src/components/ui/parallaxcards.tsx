import * as React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface ParallaxCardItem {
    className?: string;
    content: React.ReactNode;
}

export interface ParallaxCardsProps {
    cards?: ParallaxCardItem[];
    /** Altura de cada slide en vh */
    slideVh?: number;
    slideMaxPx?: number;
    className?: string;
}

export default function ParallaxCards({
    cards = [],
    slideVh = 70,
    slideMaxPx = 520,
    className,
}: ParallaxCardsProps) {
    const cardCount = cards.length;
    if (!cardCount) return null;

    return (
        <div className={cn('relative w-full', className)}>
            <div className="relative" style={{ height: `${cardCount * slideVh}vh` }}>
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className="sticky top-0 flex items-center justify-center px-4 py-6 sm:px-6"
                        style={{ height: `${slideVh}vh`, maxHeight: slideMaxPx, zIndex: index + 1 }}
                    >
                        <Card
                            className={cn(
                                'flex h-full w-full max-w-3xl items-center justify-center overflow-hidden rounded-2xl border text-center shadow-none',
                                card.className,
                            )}
                        >
                            {card.content}
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
}

export { ParallaxCards };
