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
    className?: string;
}

export default function ParallaxCards({
    cards = [],
    slideVh = 100,
    className,
}: ParallaxCardsProps) {
    const cardCount = cards.length;
    if (!cardCount) return null;

    return (
        <div className={cn('relative w-full', className)}>
            {/* Altura total = scroll necesario para apilar todas las cards */}
            <div className="relative" style={{ height: `${cardCount * slideVh}vh` }}>
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className="sticky mx-auto flex w-full max-w-3xl items-center justify-center px-4 py-8 sm:px-6 lg:max-w-7xl lg:px-8"
                        style={{
                            top: '5rem',
                            height: `calc(${slideVh}vh - 5rem)`,
                            zIndex: index + 1,
                        }}
                    >
                        <Card
                            className={cn(
                                'flex h-[min(520px,72vh)] w-full items-center justify-center overflow-hidden rounded-2xl border text-center shadow-none transition-transform duration-300',
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
