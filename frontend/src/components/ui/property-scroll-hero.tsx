import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const SLIDES = [
  {
    src: '/cabana-mobile.webp',
    label: 'YOUR PORTFOLIO',
    title: 'All Your\nProperties',
    sub: 'Cabins, villas, apartments — one platform',
    align: 'left' as const,
  },
  {
    src: '/cabin.webp',
    label: 'EVERY PROPERTY',
    title: 'Managed\nSeamlessly',
    sub: 'From bookings to maintenance, fully automated',
    align: 'left' as const,
  },
  {
    src: '/sala.jpg',
    label: 'EVERY DETAIL',
    title: 'Nothing\nSlips Through',
    sub: 'Billing, guest CRM, and operations in sync',
    align: 'right' as const,
  },
  {
    src: '/hero-bg.jpg',
    label: 'TRIADAK',
    title: 'Start Managing\nSmarter',
    sub: 'Join property managers who already made the switch',
    align: 'center' as const,
    cta: true,
  },
] as const;

const TOTAL = SLIDES.length;

interface SlideProps {
  slide: (typeof SLIDES)[number];
  index: number;
  scrollYProgress: MotionValue<number>;
}

function Slide({ slide, index, scrollYProgress }: SlideProps) {
  const step = 1 / TOTAL;
  const start = index * step;
  const end = (index + 1) * step;
  const overlap = step * 0.18;

  const isFirst = index === 0;
  const isLast = index === TOTAL - 1;

  const fadeInStart = isFirst ? 0 : start - overlap;
  const fadeInEnd = isFirst ? 0 : start;
  const fadeOutStart = end - overlap;

  const opacity = useTransform(
    scrollYProgress,
    isFirst
      ? [0, fadeOutStart, end]
      : isLast
        ? [fadeInStart, fadeInEnd, 1]
        : [fadeInStart, fadeInEnd, fadeOutStart, end],
    isFirst
      ? [1, 1, 0]
      : isLast
        ? [0, 1, 1]
        : [0, 1, 1, 0],
  );

  const scale = useTransform(scrollYProgress, [start, end], [1.0, 1.07]);

  const textY = useTransform(scrollYProgress, [start, end], ['0%', '-10%']);
  const textOpacity = useTransform(
    scrollYProgress,
    isLast
      ? [start + step * 0.2, start + step * 0.4, 1]
      : [start + step * 0.2, start + step * 0.35, end - step * 0.25, end - step * 0.1],
    isLast ? [0, 1, 1] : [0, 1, 1, 0],
  );

  const alignClass = {
    left: 'items-start text-left pl-10 md:pl-20',
    right: 'items-end text-right pr-10 md:pr-20',
    center: 'items-center text-center px-6',
  }[slide.align];

  return (
    <motion.div style={{ opacity }} className="absolute inset-0">
      <motion.div style={{ scale }} className="absolute inset-0 origin-center">
        <img src={slide.src} alt={slide.label} className="h-full w-full object-cover" />
      </motion.div>

      {/* Gradiente inferior */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#061020]/90 via-[#061020]/30 to-transparent" />
      {/* Gradiente lateral */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#061020]/40 to-transparent" />

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className={`absolute bottom-0 left-0 right-0 flex flex-col justify-end pb-20 md:pb-28 ${alignClass}`}
      >
        <p className="mb-3 text-[10px] tracking-[0.35em] text-white/50 uppercase">
          {slide.label}
        </p>
        <h2
          className="text-[clamp(3rem,8vw,6.5rem)] font-light leading-[1.05] text-white"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", whiteSpace: 'pre-line' }}
        >
          {slide.title}
        </h2>
        <p className="mt-4 text-xs tracking-[0.25em] text-white/60 uppercase md:text-sm">
          {slide.sub}
        </p>

        {'cta' in slide && slide.cta && (
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#061020] transition-all hover:bg-cyan-300"
            >
              Start Free
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition-all hover:border-white/40 hover:text-white"
            >
              See Demo
            </Link>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function ScrollCue({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const opacity = useTransform(scrollYProgress, [0, 0.07], [1, 0]);
  return (
    <motion.div
      style={{ opacity }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
    >
      <p className="text-[9px] tracking-[0.45em] uppercase">Scroll</p>
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        className="h-8 w-px bg-gradient-to-b from-white/40 to-transparent"
      />
    </motion.div>
  );
}

function ProgressBar({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <motion.div
      style={{ scaleX, transformOrigin: 'left' }}
      className="fixed top-0 left-0 right-0 h-px bg-white/25 z-40"
    />
  );
}

function SectionDots({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    return scrollYProgress.on('change', (v) => {
      setActive(Math.min(Math.floor(v * TOTAL), TOTAL - 1));
    });
  }, [scrollYProgress]);

  return (
    <div className="fixed right-5 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-40">
      {SLIDES.map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-500 ${
            i === active ? 'h-4 w-1 bg-white' : 'h-1 w-1 bg-white/25'
          }`}
        />
      ))}
    </div>
  );
}

function PropertyScrollHeroInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  return (
    <>
      <ProgressBar scrollYProgress={scrollYProgress} />
      <SectionDots scrollYProgress={scrollYProgress} />

      <div ref={containerRef} style={{ height: `${TOTAL * 110}vh` }} className="relative bg-[#061020]">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {SLIDES.map((slide, i) => (
            <Slide key={i} slide={slide} index={i} scrollYProgress={scrollYProgress} />
          ))}
          <ScrollCue scrollYProgress={scrollYProgress} />
        </div>
      </div>
    </>
  );
}

export function PropertyScrollHero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="h-screen bg-[#061020]" />;
  return <PropertyScrollHeroInner />;
}
