import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

export const GlassCard = ({ children, className, delay = 0, ...props }: GlassCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay, ease: "easeOut" }}
            className={cn(
                "surface-card p-6 shadow-sm transition-colors hover:border-border/80",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
};
