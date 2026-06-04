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

const PAGE_STYLES = `
  @keyframes ds-word-appear {
    0% { opacity: 0; transform: translateY(20px); filter: blur(6px); }
    100% { opacity: 1; transform: translateY(0); filter: blur(0); }
  }
  @keyframes ds-underline-grow {
    to { width: 100%; }
  }
  .ds-word {
    display: inline-block;
    opacity: 0;
    margin: 0 0.12em;
    color: inherit;
    animation: ds-word-appear 0.75s ease-out forwards;
    transition: opacity 0.25s ease;
  }
  .ds-title-deco::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.25);
    animation: ds-underline-grow 2s ease-out forwards;
    animation-delay: 1.8s;
  }
`;

function WordSpan({ text, delay }: SerenityWord) {
  return (
    <span className="ds-word" style={{ animationDelay: `${delay}ms` }}>
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
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    if (!scrolled) setScrolled(true);
  }, [scrolled]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <section
        ref={sectionRef}
        id="engagement"
        className={cn(
          'relative min-h-[70vh] overflow-hidden border-b border-white/5 bg-[#0f172a] text-white',
          className,
        )}
        aria-label="Triadak value proposition"
      >
        <div className="relative z-10 flex min-h-[70vh] flex-col items-center justify-between px-6 py-14 sm:px-10 md:px-16 md:py-20">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400 sm:text-sm">
              {topLine.map((w) => (
                <WordSpan key={`top-${w.text}-${w.delay}`} {...w} />
              ))}
            </p>
            <div className="mx-auto mt-4 h-px w-14 bg-white/15" />
          </div>

          <div className="relative mx-auto max-w-5xl text-center">
            <h2 className="ds-title-deco relative text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              <div className="mb-4 md:mb-6">
                {mainLine1.map((w) => (
                  <WordSpan key={`m1-${w.text}-${w.delay}`} {...w} />
                ))}
              </div>
              <div className="text-xl font-normal leading-relaxed text-slate-400 sm:text-2xl md:text-3xl">
                {mainLine2.map((w) => (
                  <WordSpan key={`m2-${w.text}-${w.delay}`} {...w} />
                ))}
              </div>
            </h2>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-4 h-px w-14 bg-white/15" />
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400 sm:text-sm">
              {bottomLine.map((w) => (
                <WordSpan key={`bot-${w.text}-${w.delay}`} {...w} />
              ))}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default DigitalSerenity;
