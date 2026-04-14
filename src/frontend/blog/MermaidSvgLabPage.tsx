import { MermaidBlock } from '../components/MermaidBlock';
import { Link } from '../components/Link';
import { BlogShell } from './BlogShell';
import styles from './MermaidSvgLabPage.module.css';

const FLOW_DIAGRAM = `flowchart LR
  A[Idea] --> B[Markdown note]
  B --> C[Rendered post]
  C --> D[Shared understanding]
`;

export default function MermaidSvgLabPage() {
  return (
    <BlogShell statusText="Experiment · Runtime vs static SVG">
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Experimental page</span>
        <h1 className={styles.title}>Mermaid SVG lab.</h1>
        <p className={styles.summary}>
          This page compares the current runtime Mermaid path with a prerendered SVG version of the
          same diagram. The goal is simple: make the tradeoff visible before we decide whether to move
          diagram rendering into the build pipeline.
        </p>
        <div className={styles.links}>
          <Link to="/posts/hello-world-formatting-the-factory-notes" className={styles.link}>
            Back to the starter post
          </Link>
          <a href="/experiments/mermaid/flow-runtime-source.mmd" className={styles.link}>
            View sample Mermaid source
          </a>
          <a href="/experiments/mermaid/flow-static.svg" className={styles.link}>
            Open generated SVG
          </a>
        </div>
      </section>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <div className={styles.panelMeta}>Current approach</div>
              <h2 className={styles.panelTitle}>Runtime Mermaid block</h2>
            </div>
          </header>
          <p className={styles.panelText}>
            This is what the blog does today. The markdown fence reaches the browser, Mermaid parses it,
            and the diagram is drawn on the client.
          </p>
          <div className={styles.artboard}>
            <MermaidBlock chart={FLOW_DIAGRAM} />
          </div>
          <p className={styles.scrollHint}>On mobile: swipe sideways to inspect the full diagram.</p>
          <div className={styles.list}>
            <div className={styles.item}>
              <strong>Strength:</strong> flexible and easy to author because no extra build step is needed.
            </div>
            <div className={styles.item}>
              <strong>Cost:</strong> more client JavaScript, a render step in the browser, and potential layout
              shift before the SVG appears.
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <div className={styles.panelMeta}>Experimental path</div>
              <h2 className={styles.panelTitle}>Static SVG output</h2>
            </div>
          </header>
          <p className={styles.panelText}>
            This version is already rendered ahead of time. The page only has to load an SVG asset, so
            there is no diagram parsing work left for the reader’s browser.
          </p>
          <div className={styles.artboard}>
            <div className={styles.staticViewport}>
              <img
                src="/experiments/mermaid/flow-static.svg"
                alt="Static SVG rendering of the flow from idea to markdown note to rendered post to shared understanding."
                className={styles.staticDiagram}
              />
            </div>
          </div>
          <p className={styles.scrollHint}>On mobile: swipe sideways to inspect the full diagram.</p>
          <div className={styles.list}>
            <div className={styles.item}>
              <strong>Strength:</strong> zero client-side diagram rendering, more predictable layout, and easier
              indexing outside JS-heavy contexts.
            </div>
            <div className={styles.item}>
              <strong>Cost:</strong> we need a preprocessing step that extracts Mermaid fences and regenerates SVGs
              during build.
            </div>
          </div>
        </article>
      </section>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <div className={styles.panelMeta}>Advanced demo</div>
              <h2 className={styles.panelTitle}>Static architecture diagram</h2>
            </div>
          </header>
          <p className={styles.panelText}>
            The bigger win shows up on heavier diagrams. This architecture example is the kind of chart
            that benefits most from being rendered before the page reaches the browser.
          </p>
          <div className={styles.artboard}>
            <div className={styles.staticViewport}>
              <img
                src="/experiments/mermaid/architecture-static.svg"
                alt="Static SVG architecture diagram showing authoring, content, edge delivery, and the flow between writer workstation, git repo, build pipeline, worker, and reader browser."
                className={`${styles.staticDiagram} ${styles.staticDiagramWide}`}
              />
            </div>
          </div>
          <p className={styles.scrollHint}>On mobile: swipe sideways to inspect the full diagram.</p>
          <div className={styles.list}>
            <div className={styles.item}>
              <strong>Why this matters:</strong> advanced Mermaid types pull in more code and do more layout work,
              so prerendering becomes more attractive as diagrams get richer.
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <div className={styles.panelMeta}>What this proves</div>
              <h2 className={styles.panelTitle}>A practical migration shape</h2>
            </div>
          </header>
          <div className={styles.list}>
            <div className={styles.item}>
              <strong>Authoring can stay the same:</strong> write Mermaid fences in markdown exactly as now.
            </div>
            <div className={styles.item}>
              <strong>Build can do the hard part:</strong> convert fences to SVG assets with Mermaid CLI or its
              Node API, then inject figure markup into rendered posts.
            </div>
            <div className={styles.item}>
              <strong>UX gets simpler:</strong> the reader downloads a finished graphic instead of a renderer.
            </div>
          </div>
        </article>
      </section>

      <section className={styles.callout}>
        <h2 className={styles.calloutTitle}>Recommendation</h2>
        <p className={styles.calloutText}>
          Keep runtime Mermaid for fast iteration while we experiment, but move posts toward build-time SVG
          output once the authoring format feels stable. This page is the proof-of-concept surface for that
          transition.
        </p>
      </section>
    </BlogShell>
  );
}
