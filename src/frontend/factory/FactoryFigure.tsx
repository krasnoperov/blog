import { useEffect, useRef } from 'react';
import { factorySvg } from './art';
import { startFactory } from './live';

export function FactoryFigure() {
  const stageRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const statsRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    return startFactory({ stage, readout: readoutRef.current, stats: statsRef.current });
  }, []);

  return (
    <figure className="iso-figure fx-figure">
      <div className="iso-plate fx-plate">
        <div className="iso-plate-corners" aria-hidden="true">
          <span className="iso-plate-corner" data-corner="fig">Fig 1</span>
          <span className="iso-plate-corner" data-corner="title">Software factory · three lines, one queue</span>
          <span className="iso-plate-corner" data-corner="hint">runs on its own</span>
          <span className="iso-plate-corner" data-corner="readout" ref={readoutRef}>warming up</span>
        </div>
        <div className="fx-scroll">
          <div ref={stageRef} className="iso-stage fx-stage" dangerouslySetInnerHTML={{ __html: factorySvg() }} />
        </div>
      </div>
      <figcaption className="iso-legend fx-legend">
        <span className="iso-keys">
          <span className="iso-key"><Swatch mark="lit" />Issue card, then pull request; the heavy outline is the one followed</span>
          <span className="iso-key"><Swatch mark="stack" />Stacked candidate, built on the one below; its gauge fills as CI runs</span>
          <span className="iso-key"><Swatch mark="green" />Green CI</span>
          <span className="iso-key"><Swatch mark="red" />Changes requested: lifted up and carried back to its own machine</span>
        </span>
        <span className="fx-stats">simulated · <span ref={statsRef} /></span>
      </figcaption>
    </figure>
  );
}

function Swatch({ mark }: { mark: 'lit' | 'raised' | 'stack' | 'green' | 'red' }) {
  if (mark === 'stack') {
    return (
      <svg className="iso-swatch" data-mark="raised" viewBox="0 0 16 10" aria-hidden="true">
        <path d="M4 6.2 8 4.4 12 6.2 12 7.4 8 9.2 4 7.4Z" />
        <path d="M4 2.6 8 0.8 12 2.6 12 3.8 8 5.6 4 3.8Z" />
      </svg>
    );
  }
  if (mark === 'lit' || mark === 'raised') {
    return (
      <svg className="iso-swatch" data-mark={mark} viewBox="0 0 16 10" aria-hidden="true">
        <path d="M2 4.5 8 1.5 14 4.5 14 6 8 9 2 6Z" />
        <path className="iso-swatch-crease" d="M2 4.5 8 7.5 14 4.5" />
      </svg>
    );
  }
  return (
    <svg className="iso-swatch" data-mark={mark} viewBox="0 0 16 10" aria-hidden="true">
      <path d="M1.5 5h13" />
    </svg>
  );
}
