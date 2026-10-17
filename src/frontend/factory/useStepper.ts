import { useCallback, useEffect, useRef, useState } from 'react';

// Steps through a figure on a timer while it is on screen and nobody is
// interacting with it. Under reduced motion it never advances on its own.
export function useStepper(count: number, intervalMs: number) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const held = useRef(false);
  const visible = useRef(false);

  useEffect(() => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPlaying(!still);
    const root = rootRef.current;
    if (!root) return undefined;
    const observer = new IntersectionObserver((entries) => {
      visible.current = entries[entries.length - 1].isIntersecting;
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(() => {
      if (!held.current && visible.current && !document.hidden) setStep((current) => (current + 1) % count);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [playing, count, intervalMs]);

  const go = useCallback((next: number) => {
    setStep(((next % count) + count) % count);
    setPlaying(false);
  }, [count]);

  const hold = {
    onPointerEnter: () => { held.current = true; },
    onPointerLeave: () => { held.current = false; },
    onFocus: () => { held.current = true; },
    onBlur: () => { held.current = false; },
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); go(step + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); go(step - 1); }
    },
  };

  return { step, playing, setPlaying, go, rootRef, hold };
}
