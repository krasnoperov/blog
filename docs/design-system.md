# Blog design system — narrative reference

This is the narrative companion to the DTCG snapshot under [`design/tokens/`](../design/tokens). The CSS in `src/frontend/styles/` is canonical; this document explains the *intent* behind those tokens — which decisions are load-bearing and which are decoration that can drift.

The system is adapted from the UserTold.ai console design system (mono-first, hairlines, single terracotta accent) for a long-form personal blog.

## Mood

A small reading terminal. Warm paper, mono UI, hairline rules between blocks, one terracotta accent for signal. Body type is sans-serif (Inter) for sustained reading; UI chrome is mono (JetBrains Mono); the article H1 is the only Fraunces gesture per page.

The blog supports both light and dark themes via CSS `light-dark()` — the same warm-paper feel inverts cleanly to a "warm carbon terminal" mood. Both branches are authored in OKLCH so the perceptual contrast holds on either side.

## The eleven decisions

1. **Mood — paper terminal.** Hairlines, segments, mono UI, quiet uppercase labels. The blog reads like a reading-terminal that does its job.
2. **Type pairing — Inter for prose, JetBrains Mono for UI, Fraunces sparingly.** Inter at `--t-prose` (17px) carries the article body. Mono runs the chrome — page-head segments, post-row metadata, code, tags. Fraunces appears at most once per page: the article H1.
3. **Single accent — terracotta `oklch(56% 0.142 39)`** plus three quiet derivatives (`accent-deep`, `accent-soft`, `accent-line`, `accent-warm`). Reserved for the prompt glyph, link-underline-on-hover, and inline-code colour. Color is data, not decoration.
4. **Background — warm paper `oklch(98% 0.005 95)`** (light) / warm carbon `oklch(14% 0.006 60)` (dark). Pure white would feel clinical against the mono chrome.
5. **Segments, not buttons.** The page-head, archive controls, and post foot bar all compose hairline-divided segment cells. Plain `<button>` is reserved for forms (which the public blog has none of).
6. **No event bands.** Unlike the UserTold app, the blog has no signal/voice/action types — so the band tokens are intentionally absent. If callouts ever appear in markdown, they reuse `--color-info-*` / `--color-warning-*` from `theme.css`.
7. **Density — long-form.** Page padding `--blog-page-padding` (48px desktop). Reading column `--col-text` (640px). Section gap `--blog-section-gap` (64px). Top bar `--bar-top` (40px), foot bar `--bar-foot` (36px).
8. **Iconography — almost none.** The prompt `$` glyph, hairlines, status dots. No icon library. Mermaid diagrams are the only embedded graphic.
9. **Imagery — none in chrome.** The post body may include images. The home, archive, and page-heads carry only type and rules.
10. **Light + dark.** Authored as `light-dark(L, D)` pairs. The browser's `prefers-color-scheme` controls which branch resolves; no `data-theme` toggle today.
11. **Voice — plain, declarative, evidence-first.** Sentence case for body. UI verbs lowercase. Quiet uppercase only on micro-labels.

## Type rules

- **Prose body.** `--font-prose` (Inter) at `--t-prose` (17px) `--leading-relaxed` (1.65). The article column is `--col-text` (640px) wide.
- **UI body.** `--font-mono` at `--t-body` (13px) `--leading-mono` (1.55). Page-head, post-row metadata, foot bar.
- **Article H1.** `--font-serif` (Fraunces, optical-size 144) at `--t-display-lg` (32px) → `--t-display-xl` (56px) at desktop, with `--track-tight` (-0.02em).
- **In-body H2/H3.** `--font-mono` 600 at `--t-md` / `--t-lg`, with a quiet uppercase kicker line above. Each H2 opens with `border-top: var(--rule)`.
- **Quiet labels.** `--font-mono` at `--blog-quiet-label-size` (11px), uppercase, `--blog-quiet-label-tracking` (0.14em), `--ink-quiet`. Used for date · read-time · tag · format meta.
- **Italic accent word.** Optional, at most one italicised word in the article H1, in `--accent`. Once per page only.

## Control rules

The blog has very few controls — it's a read surface, not a workspace. The set is:

| Control | Rest | Hover | Notes |
|-|-|-|-|
| Page-head segment | hairline divider, no fill | `--paper-deep` wash | Nav links, archive button |
| Post row | no chrome | `--paper-deep` row wash | The archive item |
| Tag list item | no chrome | underline on hover | Comma-separated mono text |
| Link in body | inherits text colour | `--accent` underline | `text-decoration: none` rest, hairline underline `--accent` on hover |

No filled backgrounds at rest. No shadows. No rounded corners except `--radius-soft` (2px) on inputs (none today) and `--radius-pill` on status dots only.

## Layout rules

- **Page padding.** Desktop `--blog-page-padding` (48px), mobile `--blog-page-padding-mobile` (24px).
- **Reading column.** `--col-text` (640px) for prose body. The article centres in this column; sidebars and panels don't shrink it.
- **Section gap.** `--blog-section-gap` (64px) between major page sections (hero → archive list, body → foot bar).
- **Chrome heights — fixed.** Page-head 40px, post page-head 46px, foot bar 36px. Every chrome runs on the same heights so the page reads like a single document.
- **Section openers.** H2 inside the article opens with `border-top: 1px solid var(--paper-rule); padding-top: var(--s-6)`.

## What's deliberately missing

- No drop shadows.
- No gradient surfaces.
- No backdrop-filter blurs.
- No glass cards.
- No filled badges or chips.
- No icon library.
- No "powered by" / "made with" footer chrome.

## Tokens at a glance

The DTCG snapshot under `design/tokens/` is the authoritative listing. The narrative groupings are:

- **Foundation** (`tokens.css`): paper / ink / accent palette, type scale, spacing, chrome heights, geometry, motion, layout columns, `--blog-*` component scale.
- **Semantic** (`theme.css`): code, status colors, overlay, scroll, plus a legacy compat alias block.
- **Resets + base** (`global.css`): box-sizing and body styles.

The legacy compat block at the bottom of `theme.css` is scaffolding so the existing public-route CSS keeps resolving while pages opt into the new tokens incrementally.
