import { useState, type ComponentPropsWithoutRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FAQEntry {
    question: string;
    answer: string;
}

export type FAQData = Record<string, FAQEntry[]>;

export interface FAQProps extends ComponentPropsWithoutRef<'section'> {
    title?: string;
    subtitle?: string;
    categories: Record<string, string>;
    faqData: FAQData;
    onDarkBackground?: boolean;
}

export function FAQ({
    title = 'FAQs',
    subtitle = 'Frequently Asked Questions',
    categories,
    faqData,
    className,
    onDarkBackground = false,
    ...props
}: FAQProps) {
    const categoryKeys = Object.keys(categories);
    const [selectedCategory, setSelectedCategory] = useState(
        () => categoryKeys[0] ?? '',
    );

    if (categoryKeys.length === 0) {
        return null;
    }

    return (
        <section
            className={cn(
                'relative overflow-hidden px-4 py-12 sm:py-16',
                onDarkBackground
                    ? 'bg-[#0f172a] text-white'
                    : 'bg-background text-foreground',
                className,
            )}
            {...props}
        >
            <FAQHeader
                title={title}
                subtitle={subtitle}
                onDarkBackground={onDarkBackground}
            />
            <FAQTabs
                categories={categories}
                selected={selectedCategory}
                setSelected={setSelectedCategory}
                onDarkBackground={onDarkBackground}
            />
            <FAQList faqData={faqData} selected={selectedCategory} onDarkBackground={onDarkBackground} />
        </section>
    );
}

function FAQHeader({
    title,
    subtitle,
    onDarkBackground,
}: {
    title: string;
    subtitle: string;
    onDarkBackground: boolean;
}) {
    return (
        <div className="relative z-10 mb-10 flex flex-col items-center justify-center text-center sm:mb-12">
            <span
                className={cn(
                    'mb-3 text-xs font-semibold uppercase tracking-wider sm:mb-4 sm:text-sm',
                    onDarkBackground ? 'text-slate-400' : 'text-muted-foreground',
                )}
            >
                {subtitle}
            </span>
            <h2
                className={cn(
                    'text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl',
                    onDarkBackground ? 'text-white' : 'text-foreground',
                )}
            >
                {title}
            </h2>
        </div>
    );
}

function FAQTabs({
    categories,
    selected,
    setSelected,
    onDarkBackground,
}: {
    categories: Record<string, string>;
    selected: string;
    setSelected: (key: string) => void;
    onDarkBackground: boolean;
}) {
    return (
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {Object.entries(categories).map(([key, label]) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => setSelected(key)}
                    className={cn(
                        'relative overflow-hidden whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors duration-300',
                        selected === key
                            ? onDarkBackground
                                ? 'border-white/25 bg-white/10 text-white'
                                : 'border-primary bg-primary text-primary-foreground'
                            : onDarkBackground
                              ? 'border-white/10 bg-transparent text-slate-400 hover:border-white/20 hover:text-slate-200'
                              : 'border-border bg-transparent text-muted-foreground hover:text-foreground',
                    )}
                >
                    <span className="relative z-10">{label}</span>
                    <AnimatePresence>
                        {selected === key && !onDarkBackground && (
                            <motion.span
                                initial={{ y: '100%' }}
                                animate={{ y: '0%' }}
                                exit={{ y: '100%' }}
                                transition={{ duration: 0.35, ease: 'easeInOut' }}
                                className="absolute inset-0 z-0 bg-primary"
                            />
                        )}
                    </AnimatePresence>
                </button>
            ))}
        </div>
    );
}

function FAQList({
    faqData,
    selected,
    onDarkBackground,
}: {
    faqData: FAQData;
    selected: string;
    onDarkBackground: boolean;
}) {
    return (
        <div className="relative z-10 mx-auto mt-10 max-w-3xl sm:mt-12">
            <AnimatePresence mode="wait">
                {Object.entries(faqData).map(([category, questions]) => {
                    if (selected !== category) return null;
                    return (
                        <motion.div
                            key={category}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 16 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="space-y-3"
                        >
                            {questions.map((faq, index) => (
                                <FAQItem
                                    key={`${category}-${index}`}
                                    question={faq.question}
                                    answer={faq.answer}
                                    onDarkBackground={onDarkBackground}
                                />
                            ))}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}

function FAQItem({
    question,
    answer,
    onDarkBackground,
}: FAQEntry & { onDarkBackground: boolean }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            animate={isOpen ? 'open' : 'closed'}
            className={cn(
                'rounded-xl border transition-colors',
                onDarkBackground
                    ? isOpen
                        ? 'border-white/15 bg-white/[0.06]'
                        : 'border-white/10 bg-white/[0.03]'
                    : isOpen
                      ? 'border-border bg-muted/50'
                      : 'border-border bg-card',
            )}
        >
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5"
            >
                <span
                    className={cn(
                        'text-base font-medium transition-colors sm:text-lg',
                        isOpen
                            ? onDarkBackground
                                ? 'text-white'
                                : 'text-foreground'
                            : onDarkBackground
                              ? 'text-slate-300'
                              : 'text-muted-foreground',
                    )}
                >
                    {question}
                </span>
                <motion.span
                    variants={{
                        open: { rotate: '45deg' },
                        closed: { rotate: '0deg' },
                    }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                >
                    <Plus
                        className={cn(
                            'h-5 w-5 transition-colors',
                            isOpen
                                ? onDarkBackground
                                    ? 'text-white'
                                    : 'text-foreground'
                                : onDarkBackground
                                  ? 'text-slate-500'
                                  : 'text-muted-foreground',
                        )}
                        strokeWidth={1.75}
                    />
                </motion.span>
            </button>
            <motion.div
                initial={false}
                animate={{
                    height: isOpen ? 'auto' : 0,
                    marginBottom: isOpen ? 16 : 0,
                    opacity: isOpen ? 1 : 0,
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden px-4 sm:px-5"
            >
                <p
                    className={cn(
                        'pb-4 text-sm leading-relaxed sm:text-base',
                        onDarkBackground ? 'text-slate-400' : 'text-muted-foreground',
                    )}
                >
                    {answer}
                </p>
            </motion.div>
        </motion.div>
    );
}

export default FAQ;
