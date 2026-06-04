import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface SerenityWord {
  text: string;
  delay: number;
}

export interface DigitalSerenityProps {
  topLine: SerenityWord[];
  mainLine1: SerenityWord[];
  mainLine2: SerenityWord[];
  bottomLine: SerenityWord[];
  className?: string;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const PAGE_STYLES = `
  .ds-mouse-gradient {
    position: absolute;
    pointer-events: none;
    border-radius: 9999px;
    background-image: radial-gradient(circle, rgba(148, 163, 184, 0.06), transparent 70%);
    transform: translate(-50%, -50%);
    will-change: left, top, opacity;
    transition: left 70ms linear, top 70ms linear, opacity 300ms ease-out;
  }
  @keyframes ds-word-appear {
    0% { opacity: 0; transform: translateY(24px) scale(0.92); filter: blur(8px); }
    100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
  }
  @keyframes ds-grid-draw {
    0% { stroke-dashoffset: 1000; opacity: 0; }
    100% { stroke-dashoffset: 0; opacity: 0.12; }
  }
  @keyframes ds-pulse-glow {
    0%, 100% { opacity: 0.15; transform: scale(1); }
    50% { opacity: 0.35; transform: scale(1.1); }
  }
  @keyframes ds-underline-grow {
    to { width: 100%; }
  }
  @keyframes ds-float {
    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
    50% { transform: translateY(-8px) translateX(4px); opacity: 0.5; }
  }
  .ds-word {
    display: inline-block;
    opacity: 0;
    margin: 0 0.12em;
    animation: ds-word-appear 0.75s ease-out forwards;
    transition: color 0.25s ease, transform 0.25s ease;
  }
  .ds-word:hover {
    color: hsl(var(--foreground));
    transform: translateY(-2px);
  }
  .ds-grid-line {
    stroke: hsl(215 16% 45%);
    stroke-width: 0.5;
    opacity: 0;
    stroke-dasharray: 5 5;
    stroke-dashoffset: 1000;
    animation: ds-grid-draw 2s ease-out forwards;
  }
  .ds-detail-dot {
    fill: hsl(215 16% 65%);
    opacity: 0;
    animation: ds-pulse-glow 3s ease-in-out infinite;
  }
  .ds-corner {
    position: absolute;
    width: 40px;
    height: 40px;
    border: 1px solid hsl(var(--border));
    opacity: 0;
    animation: ds-word-appear 1s ease-out forwards;
  }
  .ds-title-deco::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 0;
    width: 0;
    height: 1px;
    background: hsl(var(--primary));
    animation: ds-underline-grow 2s ease-out forwards;
    animation-delay: 1.8s;
  }
  .ds-float-dot {
    position: absolute;
    width: 2px;
    height: 2px;
    background: hsl(215 16% 65%);
    border-radius: 50%;
    opacity: 0;
    animation: ds-float 4s ease-in-out infinite;
    animation-play-state: paused;
  }
  .ds-ripple {
    position: absolute;
    width: 4px;
    height: 4px;
    background: hsl(214 32% 52% / 0.5);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    animation: ds-pulse-glow 1s ease-out forwards;
    z-index: 20;
  }
`;

function WordSpan({ text, delay }: SerenityWord) {
  return (
    <span
      className="ds-word"
      style={{ animationDelay: `${delay}ms` }}
    >
      {text}
    </span>
  );
}

export function DigitalSerenity({
  topLine,
  mainLine1,
  mainLine2,
  bottomLine,
  className,
}: DigitalSerenityProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [mouseStyle, setMouseStyle] = useState({ left: '50%', top: '50%', opacity: 0 });
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    if (scrolled) return;
    setScrolled(true);
    const root = sectionRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>('.ds-float-dot').forEach((el, index) => {
      const delay = parseFloat(el.style.animationDelay || '0') * 1000 + index * 80;
      setTimeout(() => {
        el.style.animationPlayState = 'running';
      }, delay);
    });
  }, [scrolled]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setMouseStyle({
        left: `${e.clientX - rect.left}px`,
        top: `${e.clientY - rect.top}px`,
        opacity: 1,
      });
    };
    const onLeave = () => setMouseStyle((p) => ({ ...p, opacity: 0 }));
    const onClick = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const ripple = { id: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top };
      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== ripple.id)), 900);
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('click', onClick);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      el.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <section
        ref={sectionRef}
        id="engagement"
        className={cn(
          'relative min-h-[70vh] overflow-hidden border-b border-border bg-background text-foreground',
          className,
        )}
        aria-label="Triadak value proposition"
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <pattern id="ds-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ds-grid)" />
          <line x1="0" y1="20%" x2="100%" y2="20%" className="ds-grid-line" style={{ animationDelay: '0.5s' }} />
          <line x1="0" y1="80%" x2="100%" y2="80%" className="ds-grid-line" style={{ animationDelay: '1s' }} />
          <line x1="20%" y1="0" x2="20%" y2="100%" className="ds-grid-line" style={{ animationDelay: '1.5s' }} />
          <line x1="80%" y1="0" x2="80%" y2="100%" className="ds-grid-line" style={{ animationDelay: '2s' }} />
          <circle cx="20%" cy="20%" r="2" className="ds-detail-dot" style={{ animationDelay: '2.5s' }} />
          <circle cx="80%" cy="80%" r="2" className="ds-detail-dot" style={{ animationDelay: '2.8s' }} />
          <circle cx="50%" cy="50%" r="1.5" className="ds-detail-dot" style={{ animationDelay: '3s' }} />
        </svg>

        <div className="ds-corner top-4 left-4 md:top-8 md:left-8" style={{ animationDelay: '3.2s' }}>
          <div className="absolute left-0 top-0 h-2 w-2 rounded-full bg-primary/40" />
        </div>
        <div className="ds-corner top-4 right-4 md:top-8 md:right-8" style={{ animationDelay: '3.4s' }}>
          <div className="absolute right-0 top-0 h-2 w-2 rounded-full bg-primary/40" />
        </div>
        <div className="ds-corner bottom-4 left-4 md:bottom-8 md:left-8" style={{ animationDelay: '3.6s' }}>
          <div className="absolute bottom-0 left-0 h-2 w-2 rounded-full bg-primary/40" />
        </div>
        <div className="ds-corner bottom-4 right-4 md:bottom-8 md:right-8" style={{ animationDelay: '3.8s' }}>
          <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-primary/40" />
        </div>

        <div className="ds-float-dot" style={{ top: '25%', left: '15%', animationDelay: '0.5s' }} />
        <div className="ds-float-dot" style={{ top: '60%', left: '85%', animationDelay: '1s' }} />
        <div className="ds-float-dot" style={{ top: '40%', left: '12%', animationDelay: '1.5s' }} />

        <div className="relative z-10 flex min-h-[70vh] flex-col items-center justify-between px-6 py-14 sm:px-10 md:px-16 md:py-20">
          <div className="text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground sm:text-sm">
              {topLine.map((w) => (
                <WordSpan key={`top-${w.text}-${w.delay}`} {...w} />
              ))}
            </p>
            <div className="mx-auto mt-4 h-px w-14 bg-border opacity-60" />
          </div>

          <div className="relative mx-auto max-w-5xl text-center">
            <h2 className="ds-title-deco relative text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
              <div className="mb-4 md:mb-6">
                {mainLine1.map((w) => (
                  <WordSpan key={`m1-${w.text}-${w.delay}`} {...w} />
                ))}
              </div>
              <div className="text-xl font-normal leading-relaxed text-muted-foreground sm:text-2xl md:text-3xl">
                {mainLine2.map((w) => (
                  <WordSpan key={`m2-${w.text}-${w.delay}`} {...w} />
                ))}
              </div>
            </h2>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 h-px w-14 bg-border opacity-60" />
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground sm:text-sm">
              {bottomLine.map((w) => (
                <WordSpan key={`bot-${w.text}-${w.delay}`} {...w} />
              ))}
            </p>
          </div>
        </div>

        <div
          className="ds-mouse-gradient h-48 w-48 blur-2xl sm:h-64 sm:w-64 md:h-80 md:w-80"
          style={{
            left: mouseStyle.left,
            top: mouseStyle.top,
            opacity: mouseStyle.opacity,
          }}
        />

        {ripples.map((r) => (
          <div key={r.id} className="ds-ripple" style={{ left: r.x, top: r.y }} />
        ))}
      </section>
    </>
  );
}

export default DigitalSerenity;
