import React from 'react';
import { cn } from '@/lib/utils';

interface LustreTextProps {
    text: string;
    disabled?: boolean;
    speed?: number;
    className?: string;
    /** `hero` título hero con brillo cian; `dark` fondos oscuros; `light` fondos claros */
    variant?: 'hero' | 'light' | 'dark';
}

const VARIANT_CLASS = {
    hero: 'lustre-hero',
    light: 'lustre-light-gradient',
    dark: 'lustre-dark-gradient',
} as const;

const LustreText: React.FC<LustreTextProps> = ({
    text,
    disabled = false,
    speed,
    className = '',
    variant = 'dark',
}) => {
    const gradientClass = VARIANT_CLASS[variant];

    return (
        <span
            className={cn('lustre-text', !disabled && gradientClass, className)}
            style={
                !disabled && speed
                    ? { animationDuration: `${speed}s` }
                    : undefined
            }
        >
            {text}
        </span>
    );
};

export default LustreText;
