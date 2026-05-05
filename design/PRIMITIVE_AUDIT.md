# Blog primitive audit

Static categorisation of every class selector across the blog's CSS modules, mapped against the new design system foundation in `src/frontend/styles/`. Drives the page-by-page migration backlog: which classes correspond to a system primitive, which are layout utilities that can stay, and which are page-specific decoration that should be removed during migration.

To verify completeness against the source files:

```bash
grep -hoE '\.[a-zA-Z][a-zA-Z0-9_-]*' src/frontend/blog/*.module.css src/frontend/components/*.module.css src/frontend/styles/*.module.css | sort -u | wc -l
```

Re-run after substantial changes and reconcile this document.

## A. Reusable primitive candidates

| Family | Current classes | Likely target | Notes |
|-|-|-|-|
| Page head | `BlogShell.header`, `BlogShell.brand`, `BlogShell.brandMark`, `BlogShell.brandCopy`, `BlogShell.brandName`, `BlogShell.brandTag`, `BlogShell.nav`, `BlogShell.navLink`, `BlogShell.statusPill` | `components/ui/PageHead.module.css` (segment bar at `--bar-top`) | Replaces the multi-weight header with a single hairline bar. Drops gradient brand mark, tagline, and status pill. |
| Article hero | `BlogPostPage.intro`, `.title`, `.summary`, `.meta`, `.tagRow`, `.tag` | `components/ui/PostHero.module.css` | Currently a glass card. Becomes a paper-on-paper block: kicker meta, Fraunces H1 (or mono if H1 is a serif gesture), summary in `--font-prose`, tags as comma-separated `--ink-quiet` text. |
| Post body | `markdown.markdown`, `.markdown h1..h6`, `.markdown p`, `.markdown ul/ol/li`, `.markdown strong`, `.markdown em`, `.markdown a`, `.markdown hr`, `.markdown table`, `.markdown blockquote` | `styles/post-body.module.css` (rewritten) | Body switches to `--font-prose` (Inter) at `--t-prose`/`--leading-relaxed`. H1 uses `--font-serif`. H2/H3 use `--font-mono` 600 with a kicker. Hairlines on `<hr>` and section openers. |
| Code block | `markdown.codeFrame`, `markdown.inlineCode`, `markdown.codeFrame code` | `styles/post-code.module.css` | Drop gradient + radius + shadow. `pre` becomes hairline-top/bottom on `--code-bg` with `--font-mono`/`--t-body`. Inline code drops the chip; `--accent-deep` colour only. |
| Foot bar | `BlogPostPage.relatedList`, `.relatedLink`, `.relatedTitle`, `.relatedSummary`, `BlogShell.sidebarCard`, `.sidebarEyebrow`, `.sidebarTitle`, `.sidebarText` | `components/ui/FootBar.module.css` | Move "Related" + "Format" + "Source markdown" out of the desktop sidebar into a hairline foot bar at the article end. |
| Post row | `BlogHomePage.postCard`, `.postCardTitle`, `.postCardSummary`, `BlogArchivePage.*` | `components/ui/PostRow.module.css` | Archive becomes single-column hairline rows: date · dot · title · summary · tags. Drop card chrome. |
| Quiet label | `BlogShell.brandTag`, `BlogPostPage.meta`, `BlogPostPage.backLink`, `BlogHomePage.eyebrow`, `BlogHomePage.signalLabel`, `BlogHomePage.sectionEyebrow`, `BlogHomePage.postMeta` | `styles/quiet-label.module.css` | Mono 11px uppercase `--track-quiet` `--ink-quiet`. The system's only label style. |
| Tag list | `BlogPostPage.tag`, `BlogPostPage.tagRow`, `BlogHomePage.tag`, `BlogHomePage.tagRow` | `styles/tag-list.module.css` | Mono comma-separated text in `--ink-quiet`, no fill, no radius. |
| Mermaid frame | `MermaidBlock.*` | Stays (tool surface) | Reads `--diagram-*` legacy tokens. Migrate to `--paper-*` / `--ink-*` directly so the frame inherits the dark-mode palette. |

## B. Layout utilities that should disappear

These exist only to support glass-card chrome and ambient backgrounds. The new system replaces them with bare paper plus hairlines, so they can be deleted during migration.

| Group | Classes |
|-|-|
| Glass panels | `BlogShell.intro`, `.layout`, `.sidebarCard`, `BlogHomePage.heroPanel`, `.heroAside`, `.section`, `.featuredCard`, `.postCard` (all share `border + box-shadow + backdrop-filter` declarations) |
| Brand gradient mark | `BlogShell.brandMark`, `BlogHomePage.heroPanel::before` (radial gradient overlay) |
| Ambient blobs | `BlogShell.page::before`, `BlogShell.page::after` |
| Pill chrome | `BlogShell.statusPill`, `BlogPostPage.tag`, `BlogHomePage.eyebrow`, `BlogHomePage.tag`, `BlogHomePage.signalItem` (all pill-shaped backgrounds) |
| Action buttons | `BlogHomePage.primaryAction`, `.secondaryAction` (gradient + lift-on-hover) — replace with `.seg`-style segments |
| Signal grid | `BlogHomePage.signalGrid`, `.signalItem`, `.signalLabel`, `.signalValue` — three ornamental tiles on the home hero; not used elsewhere |

## C. Page-specific (stays in its module)

Truly page-bound layout that won't generalise. Keep in the page's `.module.css`.

- `BlogHomePage.hero`, `.grid`, `.archiveList`, `.featuredTitle`, `.featuredSummary` — home-only layout grid.
- `BlogPostPage.layout`, `.article`, `.sidebar` — post-page two-column rig (will become single-column during migration).
- `BlogArchivePage.*` — archive-only layout once it's converted to hairline rows.

## Migration order (driven by reading impact)

1. **`markdown.module.css`** — rewrite body type, headings, code blocks, inline code, tables, blockquote against the new tokens. Highest reading impact; everything else is chrome around this. Removes the largest chunk of decorative CSS.
2. **`BlogPostPage.module.css`** — drop intro card chrome, drop desktop sidebar, move "Related" + "Format" into a foot bar.
3. **`BlogShell.module.css`** — replace ambient blobs and the multi-weight header with a 40px hairline page-head segment bar.
4. **`BlogHomePage.module.css`** — convert hero panels and post cards to hairline rows.
5. **`BlogArchivePage.module.css`** — same row treatment as the home archive list.
6. **`AppHeader.module.css` + `MermaidBlock.module.css`** — sweep stragglers off legacy compat tokens; remove the legacy block from `theme.css`.

The legacy compat aliases at the bottom of `theme.css` exist solely to keep the page CSS resolving while migration runs. Each step above pulls one or more aliases off the back of the legacy block; when nothing greps for the old names, delete the block.
