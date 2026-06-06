import { useRef, type ReactNode } from 'react';
import {
    motion,
    useScroll,
    useTransform,
    type MotionValue,
} from 'framer-motion';
import { cn } from '@/lib/utils';

export function useSectionScroll() {
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });
    return { ref, scrollYProgress };
}

interface ParallaxFloatProps {
    scrollYProgress: MotionValue<number>;
    speed?: number;
    className?: string;
    children?: ReactNode;
}

/** Desplaza contenido a distinta velocidad — sin cambiar opacidad del texto. */
export function ParallaxFloat({
    scrollYProgress,
    speed = 0.35,
    className,
    children,
}: ParallaxFloatProps) {
    const y = useTransform(scrollYProgress, [0, 1], [speed * 120, speed * -120]);

    return (
        <motion.div style={{ y }} className={className}>
            {children}
        </motion.div>
    );
}

interface ScrollRevealProps {
    className?: string;
    children?: ReactNode;
}

/** Contenedor estático: el copy mantiene color fijo al hacer scroll (sin fade por progreso). */
export function ScrollReveal({ className, children }: ScrollRevealProps) {
    return <div className={className}>{children}</div>;
}

interface SectionParallaxBridgeProps {
    className?: string;
}

/** Transición visual entre secciones con orbes en parallax. */
export function SectionParallaxBridge({ className }: SectionParallaxBridgeProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });

    const orb1Y = useTransform(scrollYProgress, [0, 1], ['20%', '-30%']);
    const orb2Y = useTransform(scrollYProgress, [0, 1], ['-10%', '25%']);
    const lineScale = useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0, 1, 0]);

    return (
        <div
            ref={ref}
            className={cn(
                'relative h-[clamp(6rem,14vh,10rem)] overflow-hidden bg-[#061020]',
                className,
            )}
            aria-hidden
        >
            <motion.div
                style={{ y: orb1Y }}
                className="pointer-events-none absolute left-[12%] top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-cyan-500/[0.07] blur-3xl sm:h-48 sm:w-48"
            />
            <motion.div
                style={{ y: orb2Y }}
                className="pointer-events-none absolute right-[10%] top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-violet-500/[0.06] blur-3xl sm:h-40 sm:w-40"
            />
            <motion.div
                style={{ scaleX: lineScale }}
                className="absolute left-1/2 top-1/2 h-px w-[min(90%,48rem)] -translate-x-1/2 -translate-y-1/2 origin-center bg-gradient-to-r from-transparent via-white/15 to-transparent"
            />
        </div>
    );
}

interface GhostIndexProps {
    scrollYProgress: MotionValue<number>;
    label: string;
    className?: string;
}

export function GhostIndex({ scrollYProgress, label, className }: GhostIndexProps) {
    const y = useTransform(scrollYProgress, [0, 1], ['8%', '-18%']);
    const opacity = useTransform(scrollYProgress, [0, 0.35, 0.75, 1], [0.03, 0.07, 0.07, 0.02]);

    return (
        <motion.span
            style={{ y, opacity }}
            className={cn(
                'pointer-events-none absolute select-none font-bold uppercase leading-none tracking-tighter text-white',
                className,
            )}
            aria-hidden
        >
            {label}
        </motion.span>
    );
}

export default useSectionScroll;
