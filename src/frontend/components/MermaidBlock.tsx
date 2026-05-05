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
    fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
    fontSize: isCompact ? 12 : 13,
    useMaxWidth: !isCompact,
    markdownAutoWrap: true,
    themeVariables: {
      background: 'transparent',
      fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
      primaryColor: '#fafaf7',
      primaryTextColor: '#1f1d1a',
      primaryBorderColor: '#1f1d1a',
      secondaryColor: '#f3ece2',
      secondaryTextColor: '#1f1d1a',
      secondaryBorderColor: '#1f1d1a',
      tertiaryColor: '#fafaf7',
      tertiaryBorderColor: '#1f1d1a',
      tertiaryTextColor: '#1f1d1a',
      noteBkgColor: '#fff7ea',
      noteBorderColor: '#b85c38',
      noteTextColor: '#1f1d1a',
      lineColor: '#5a564f',
      textColor: '#1f1d1a',
      mainBkg: '#fafaf7',
      clusterBkg: 'transparent',
      clusterBorder: '#a39d8e',
      edgeLabelBackground: '#fafaf7',
      nodeBorder: '#1f1d1a',
      nodeTextColor: '#1f1d1a',
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
