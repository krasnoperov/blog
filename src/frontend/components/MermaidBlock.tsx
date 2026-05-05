import { useEffect, useId, useState } from 'react';
import styles from './MermaidBlock.module.css';

interface MermaidBlockProps {
  chart: string;
}

type MermaidApi = {
  initialize: (config: Record<string, unknown>) => void;
  render: (id: string, text: string) => Promise<{ svg: string }>;
};

let mermaidPromise: Promise<MermaidApi> | null = null;

function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((module) => {
      return module.default;
    });
  }

  return mermaidPromise;
}

// Light + dark palettes mirror the foundation tokens. Mermaid runs in the
// browser and renders SVG with hard-coded fills, so passing CSS variables
// won't work — we read prefers-color-scheme at render time and pick a
// branch.
const MERMAID_PALETTE_LIGHT = {
  paper: '#fafaf7',
  paperDeep: '#f3ece2',
  paperRule: '#ddd6c8',
  ink: '#1f1d1a',
  inkSoft: '#5a564f',
  inkQuiet: '#a39d8e',
  accent: '#b85c38',
  accentWarm: '#fff7ea',
};

const MERMAID_PALETTE_DARK = {
  paper: '#1c1916',
  paperDeep: '#2a251f',
  paperRule: '#3a342c',
  ink: '#ece6db',
  inkSoft: '#a39d8e',
  inkQuiet: '#6b6557',
  accent: '#d68460',
  accentWarm: '#382a1f',
};

function createMermaidConfig(isCompact: boolean, isDark: boolean) {
  const p = isDark ? MERMAID_PALETTE_DARK : MERMAID_PALETTE_LIGHT;
  return {
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    look: 'classic',
    htmlLabels: true,
    fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
    // Diagrams sit inside a 64-ch reading column, so they need labels that
    // hold their weight at body type size (17 px Inter). Mermaid's defaults
    // (12-14 px) read as captions; bump to 15/16 so the diagram is part of
    // the read, not a footnote.
    fontSize: isCompact ? 15 : 16,
    useMaxWidth: !isCompact,
    markdownAutoWrap: true,
    themeVariables: {
      background: 'transparent',
      fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
      primaryColor: p.paper,
      primaryTextColor: p.ink,
      primaryBorderColor: p.ink,
      secondaryColor: p.paperDeep,
      secondaryTextColor: p.ink,
      secondaryBorderColor: p.ink,
      tertiaryColor: p.paper,
      tertiaryBorderColor: p.ink,
      tertiaryTextColor: p.ink,
      noteBkgColor: p.accentWarm,
      noteBorderColor: p.accent,
      noteTextColor: p.ink,
      lineColor: p.inkSoft,
      textColor: p.ink,
      mainBkg: p.paper,
      clusterBkg: 'transparent',
      clusterBorder: p.inkSoft,
      edgeLabelBackground: p.paper,
      nodeBorder: p.ink,
      nodeTextColor: p.ink,
    },
    flowchart: {
      curve: 'basis',
      wrappingWidth: isCompact ? 140 : 220,
      nodeSpacing: isCompact ? 32 : 48,
      rankSpacing: isCompact ? 44 : 64,
      padding: isCompact ? 14 : 22,
    },
  };
}

function decorateSvg(svg: string): string {
  return svg.replace('<svg', `<svg class="${styles.diagramSvg}"`);
}

export function MermaidBlock({ chart }: MermaidBlockProps) {
  const diagramId = useId().replace(/:/g, '-');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    setColorScheme(media.matches ? 'dark' : 'light');
    const onChange = (e: MediaQueryListEvent) => setColorScheme(e.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const isCompact = typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches;
    const isDark = colorScheme === 'dark';

    getMermaid()
      .then((mermaid) => {
        mermaid.initialize(createMermaidConfig(isCompact, isDark));
        return mermaid.render(`mermaid-${diagramId}-${isDark ? 'd' : 'l'}`, chart);
      })
      .then(({ svg: renderedSvg }) => {
        if (isMounted) {
          setSvg(decorateSvg(renderedSvg));
          setError('');
        }
      })
      .catch((renderError: unknown) => {
        if (isMounted) {
          setSvg('');
          setError(renderError instanceof Error ? renderError.message : 'Unable to render Mermaid diagram.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [chart, diagramId, colorScheme]);

  if (error) {
    return (
      <figure className={styles.figure}>
        <figcaption className={styles.header}>
          <div className={styles.headerMeta}>
            <span className={styles.badge}>Mermaid</span>
            <span className={styles.label}>Diagram source</span>
          </div>
          <span className={styles.hint}>Showing source because rendering failed</span>
        </figcaption>
        <pre className={`${styles.canvas} ${styles.fallback}`}>
          <code>{chart}</code>
        </pre>
      </figure>
    );
  }

  if (!svg) {
    return (
      <figure className={styles.figure}>
        <figcaption className={styles.header}>
          <div className={styles.headerMeta}>
            <span className={styles.badge}>Mermaid</span>
            <span className={styles.label}>Diagram</span>
          </div>
          <span className={styles.hint}>Rendering</span>
        </figcaption>
        <div className={styles.canvas} aria-label="Rendering Mermaid diagram">
          <div className={styles.loadingState}>Rendering diagram...</div>
        </div>
      </figure>
    );
  }

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.header}>
        <div className={styles.headerMeta}>
          <span className={styles.badge}>Mermaid</span>
          <span className={styles.label}>System diagram</span>
        </div>
        <span className={styles.hint}>Scroll to view wider diagrams on small screens</span>
      </figcaption>
      <div
        className={styles.canvas}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </figure>
  );
}
