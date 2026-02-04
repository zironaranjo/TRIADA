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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: "easeOut" }}
            className={cn(
                "relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md transition-all hover:bg-white/10",
                className
            )}
            {...props}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity hover:opacity-100" />
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
};
