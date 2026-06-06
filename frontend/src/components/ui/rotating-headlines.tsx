import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface RotatingHeadlinesProps {
    lines: string[];
    intervalMs?: number;
    className?: string;
}

export function RotatingHeadlines({
    lines,
    intervalMs = 3200,
    className,
}: RotatingHeadlinesProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (lines.length <= 1) return;
        const id = window.setInterval(() => {
            setIndex((prev) => (prev + 1) % lines.length);
        }, intervalMs);
        return () => window.clearInterval(id);
    }, [lines.length, intervalMs]);

    if (!lines.length) return null;

    return (
        <div
            className={cn(
                'relative mx-auto flex min-h-[3.5rem] max-w-4xl items-center justify-center sm:min-h-[4.5rem] lg:min-h-[5.5rem]',
                className,
            )}
        >
            <AnimatePresence mode="wait">
                <motion.p
                    key={index}
                    initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -28, filter: 'blur(6px)' }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-x-0 text-center text-[clamp(1.35rem,4.5vw,3.25rem)] font-bold uppercase leading-[1.05] tracking-[0.06em] text-white sm:tracking-[0.08em]"
                >
                    {lines[index]}
                </motion.p>
            </AnimatePresence>
        </div>
    );
}

export default RotatingHeadlines;
