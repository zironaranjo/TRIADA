import { cn } from '@/lib/utils';

interface LpGridBackgroundProps {
    className?: string;
    patternId?: string;
}

/** Cuadrícula sutil para secciones de la landing */
export function LpGridBackground({
    className,
    patternId = 'lp-grid',
}: LpGridBackgroundProps) {
    return (
        <svg
            className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <defs>
                <pattern
                    id={patternId}
                    width="56"
                    height="56"
                    patternUnits="userSpaceOnUse"
                >
                    <path
                        d="M 56 0 L 0 0 0 56"
                        fill="none"
                        stroke="rgba(100, 140, 200, 0.14)"
                        strokeWidth="0.5"
                    />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId})`} />
            <line
                x1="0"
                y1="20%"
                x2="100%"
                y2="20%"
                className="lp-grid-line"
                style={{ animationDelay: '0.4s' }}
            />
            <line
                x1="0"
                y1="80%"
                x2="100%"
                y2="80%"
                className="lp-grid-line"
                style={{ animationDelay: '0.8s' }}
            />
            <line
                x1="20%"
                y1="0"
                x2="20%"
                y2="100%"
                className="lp-grid-line"
                style={{ animationDelay: '1.2s' }}
            />
            <line
                x1="80%"
                y1="0"
                x2="80%"
                y2="100%"
                className="lp-grid-line"
                style={{ animationDelay: '1.6s' }}
            />
        </svg>
    );
}
