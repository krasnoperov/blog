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

function createMermaidConfig(isCompact: boolean) {
  return {
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    look: 'classic',
    htmlLabels: true,
    fontFamily: 'Avenir Next, Segoe UI, Helvetica Neue, sans-serif',
    fontSize: isCompact ? 14 : 16,
    useMaxWidth: !isCompact,
    markdownAutoWrap: true,
    themeVariables: {
      background: '#f6f0e6',
      fontFamily: 'Avenir Next, Segoe UI, Helvetica Neue, sans-serif',
      primaryColor: '#f6ede0',
      primaryTextColor: '#17211b',
      primaryBorderColor: '#24594f',
      secondaryColor: '#d8c4a5',
      secondaryTextColor: '#17211b',
      secondaryBorderColor: '#7a6345',
      tertiaryColor: '#e6efe8',
      tertiaryBorderColor: '#6e8d83',
      tertiaryTextColor: '#17211b',
      noteBkgColor: '#fff6d8',
      noteBorderColor: '#b89248',
      noteTextColor: '#3e3424',
      lineColor: '#496257',
      textColor: '#22302a',
      mainBkg: '#f8f3ea',
      clusterBkg: '#eef3ee',
      clusterBorder: '#88a096',
      edgeLabelBackground: '#fffaf3',
      nodeBorder: '#24594f',
      nodeTextColor: '#17211b',
    },
    flowchart: {
      curve: 'basis',
      wrappingWidth: isCompact ? 120 : 180,
      nodeSpacing: isCompact ? 26 : 34,
      rankSpacing: isCompact ? 36 : 52,
      padding: isCompact ? 10 : 16,
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

  useEffect(() => {
    let isMounted = true;
    const isCompact = typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches;

    getMermaid()
      .then((mermaid) => {
        mermaid.initialize(createMermaidConfig(isCompact));
        return mermaid.render(`mermaid-${diagramId}`, chart);
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
  }, [chart, diagramId]);

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
