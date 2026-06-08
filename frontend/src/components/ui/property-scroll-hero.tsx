import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SLIDE_SRCS = [
  { src: '/cabana-mobile.webp', align: 'left'   as const },
  { src: '/cabin.webp',         align: 'left'   as const },
  { src: '/sala.jpg',           align: 'right'  as const },
  { src: '/hero-bg.jpg',        align: 'center' as const, cta: true },
] as const;

const TOTAL = SLIDE_SRCS.length;

// ─── First slide: full hero content with i18n ─────────
function HeroSlide({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const { t } = useTranslation();
  const step = 1 / TOTAL;
  const overlap = step * 0.18;

  const opacity = useTransform(scrollYProgress, [0, step - overlap, step], [1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, step], [1.0, 1.07]);
  const textY = useTransform(scrollYProgress, [0, step], ['0%', '-8%']);
  const textOpacity = useTransform(scrollYProgress, [0, step * 0.62, step * 0.82], [1, 1, 0]);

  return (
    <motion.div style={{ opacity }} className="absolute inset-0">
      <motion.div style={{ scale }} className="absolute inset-0 origin-center">
        <img src="/cabana-mobile.webp" alt="Triadak" className="h-full w-full object-cover" />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#061020]/95 via-[#061020]/45 to-[#061020]/15" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#061020]/65 via-[#061020]/15 to-transparent" />

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="absolute inset-0 flex flex-col justify-center pl-10 pb-6 pt-24 md:pl-20 md:pt-28"
      >
        <p className="mb-4 text-[10px] tracking-[0.38em] text-white/45 uppercase sm:text-[11px]">
          {t('landing.hero.badge')}
        </p>

        <h1 className="text-[clamp(2rem,6vw,4.75rem)] font-bold uppercase leading-[1.02] tracking-[0.025em]">
          <span className="block text-slate-400">{t('landing.hero.title1')}</span>
          <span className="block text-white">{t('landing.hero.titleHighlight')}</span>
        </h1>

        <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-300/90 sm:max-w-sm md:max-w-md md:text-base">
          {t('landing.hero.subtitle')}
        </p>

        <p className="mt-2.5 text-xs font-medium tracking-[0.12em] text-cyan-300/90 sm:text-sm">
          {t('landing.hero.tagline')}
        </p>

        <div className="mt-8 flex items-center gap-5 sm:gap-7">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:text-cyan-300 sm:text-sm"
          >
            {t('landing.hero.cta')}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1.5" />
          </Link>
          <span className="h-4 w-px bg-white/15" aria-hidden />
          <a
            href="#features"
            className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 transition-colors hover:text-white sm:text-sm"
          >
            {t('landing.hero.secondary')}
          </a>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.18em]">
          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-slate-200">{t('landing.hero.rating')}</span>
          </div>
          <span className="text-slate-600">·</span>
          <span className="text-slate-200">{t('landing.hero.freePlan')}</span>
        </div>

        <div className="mt-4">
          <Link
            to="/explore"
            className="group inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 transition-colors hover:text-white sm:text-xs"
          >
            <Home className="h-3 w-3 shrink-0" strokeWidth={1.5} />
            <span>{t('landing.hero.explorePrompt')}</span>
            <span className="text-slate-300 group-hover:text-white">{t('landing.hero.exploreLink')}</span>
            <ArrowRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Slides 1-3: cinematic minimal format ─────────────
interface SlideProps {
  index: number;
  scrollYProgress: MotionValue<number>;
}

function Slide({ index, scrollYProgress }: SlideProps) {
  const { t } = useTranslation();
  const { src, align } = SLIDE_SRCS[index];
  const isCta = 'cta' in SLIDE_SRCS[index];

  const step = 1 / TOTAL;
  const start = index * step;
  const end = (index + 1) * step;
  const overlap = step * 0.18;
  const isLast = index === TOTAL - 1;

  const opacity = useTransform(
    scrollYProgress,
    isLast
      ? [start - overlap, start, 1]
      : [start - overlap, start, end - overlap, end],
    isLast ? [0, 1, 1] : [0, 1, 1, 0],
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

  const alignClass: Record<'left' | 'right' | 'center', string> = {
    left:   'items-start text-left pl-10 md:pl-20',
    right:  'items-end text-right pr-10 md:pr-20',
    center: 'items-center text-center px-6',
  };

  const label = t(`landing.scrollSlides.slides.${index}.label`);
  const title = t(`landing.scrollSlides.slides.${index}.title`);
  const sub   = t(`landing.scrollSlides.slides.${index}.sub`);
  const cta1  = t(`landing.scrollSlides.slides.${index}.cta1`);
  const cta2  = t(`landing.scrollSlides.slides.${index}.cta2`);

  return (
    <motion.div style={{ opacity }} className="absolute inset-0">
      <motion.div style={{ scale }} className="absolute inset-0 origin-center">
        <img src={src} alt={label} className="h-full w-full object-cover" />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#061020]/90 via-[#061020]/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#061020]/40 to-transparent" />

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className={`absolute bottom-0 left-0 right-0 flex flex-col justify-end pb-20 md:pb-28 ${alignClass[align]}`}
      >
        <p className="mb-3 text-[10px] tracking-[0.35em] text-white/50 uppercase">
          {label}
        </p>
        <h2
          className="text-[clamp(3rem,8vw,6.5rem)] font-light leading-[1.05] text-white"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", whiteSpace: 'pre-line' }}
        >
          {title}
        </h2>
        <p className="mt-4 text-xs tracking-[0.25em] text-white/60 uppercase md:text-sm">
          {sub}
        </p>

        {isCta && (
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#061020] transition-all hover:bg-cyan-300"
            >
              {cta1}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition-all hover:border-white/40 hover:text-white"
            >
              {cta2}
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
      {SLIDE_SRCS.map((_, i) => (
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
          <HeroSlide scrollYProgress={scrollYProgress} />
          {SLIDE_SRCS.slice(1).map((_, i) => (
            <Slide key={i + 1} index={i + 1} scrollYProgress={scrollYProgress} />
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
