import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface StripedGridProps {
    speed?: string;
    opacity?: number;
    direction?: 'left' | 'right';
    stripeColor?: string;
    stripeWidth?: string;
    stripeSpacing?: string;
    backgroundColor?: string;
    enableBaseGrid?: boolean;
    baseGridOpacity?: number;
    className?: string;
    children?: React.ReactNode;
}

export function StripedGrid({
    speed = '15s',
    opacity = 0.3,
    direction = 'right',
    stripeColor = '16, 185, 129',
    stripeWidth = '2px',
    stripeSpacing = '8px',
    backgroundColor = '#ffffff',
    enableBaseGrid = true,
    baseGridOpacity = 0.15,
    className,
    children,
}: StripedGridProps) {
    const id = React.useId();
    const directionValue = direction === 'right' ? '40px' : '-40px';

    return (
        <div
            className={cn('relative overflow-hidden', className)}
            style={{ backgroundColor }}
        >
            <style>{`
        @keyframes diagonalStripeMove-${id} {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: ${directionValue} ${directionValue};
          }
        }
      `}</style>

            <motion.div
                style={
                    {
                        '--speed': speed,
                        '--stripe-color': stripeColor,
                        '--opacity': opacity,
                        '--stripe-width': stripeWidth,
                        '--stripe-spacing': stripeSpacing,
                        backgroundImage: `
              repeating-linear-gradient(45deg, rgba(var(--stripe-color), var(--opacity)) 0, rgba(var(--stripe-color), var(--opacity)) var(--stripe-width), transparent var(--stripe-width), transparent var(--stripe-spacing)),
              repeating-linear-gradient(-45deg, rgba(var(--stripe-color), var(--opacity)) 0, rgba(var(--stripe-color), var(--opacity)) var(--stripe-width), transparent var(--stripe-width), transparent var(--stripe-spacing))
            `,
                        backgroundSize: '40px 40px',
                        animation: `diagonalStripeMove-${id} var(--speed) linear infinite`,
                    } as React.CSSProperties
                }
                className="pointer-events-none absolute inset-0 z-0"
            />

            {enableBaseGrid ? (
                <div
                    className="pointer-events-none absolute inset-0 z-0"
                    style={{
                        backgroundImage: `
              linear-gradient(90deg, rgba(${stripeColor}, ${baseGridOpacity}) 1px, transparent 0),
              linear-gradient(180deg, rgba(${stripeColor}, ${baseGridOpacity}) 1px, transparent 0)
            `,
                        backgroundSize: '24px 24px',
                    }}
                />
            ) : null}

            {children ? <div className="relative z-10">{children}</div> : null}
        </div>
    );
}
