# design/

Machine-readable mirror of the blog's design system. Intended as a handoff surface for Claude Design, Figma, and any other tool that speaks W3C [DTCG](https://www.designtokens.org/tr/2025.10/format/) tokens.

## Source of truth

The CSS is canonical:

- `src/frontend/styles/tokens.css` — paper / ink / accent foundation, type scale, spacing, chrome heights, geometry, motion, and the `--blog-*` component-scale tokens
- `src/frontend/styles/theme.css` — semantic surfaces, status colours, code, overlay, scroll (uses `light-dark(...)` for dual-theme values)
- `src/frontend/styles/global.css` — resets and base body styles that consume the tokens

Narrative reference: [`docs/design-system.md`](../docs/design-system.md).

## What's in this folder

- `tokens/core.tokens.json` — type/font/spacing/radius/layout primitives
- `tokens/semantic.tokens.json` — surfaces, text, borders, status, code, overlay, scroll, gradient compat
- `tokens/component.tokens.json` — `--blog-*` component-scale tokens with the prefix stripped
- `tokens/_excluded.json` — sidecar listing canonical CSS tokens that are deliberately omitted from the DTCG snapshot, with a `reason` and (where relevant) a `recommendation` for graduating them in

All four files are **generated** from the canonical CSS by `scripts/snapshot-design-tokens.mjs`. Do not edit by hand.

## Why a token gets excluded

DTCG 2025.10 requires every token's `$value` to match the structural shape of its `$type`. Some CSS values use constructs with no DTCG analog and cannot be cleanly structured: `color-mix(...)`, `clamp(...)`, `calc(...)`, the `transparent` keyword, gradients with explicit non-uniform stop positions, multi-layer shadow stacks combined with `none`, and CSS shorthand like `var(--a) var(--b)` for compound padding. Such tokens stay authoritative in canonical CSS and surface in `tokens/_excluded.json`.

## Round-trip

```bash
pnpm run tokens:snapshot         # regenerate after editing the canonical CSS
pnpm run tokens:snapshot:check   # CI guard — fails on drift
pnpm run tokens:roundtrip        # CI guard — re-emit CSS from DTCG, re-snapshot, diff
```

The pipeline is **CSS → DTCG → CSS → DTCG**, and the second DTCG must equal the first. That contract is what `tokens:roundtrip` enforces — it proves the snapshot + sidecar pair is a complete, lossless mirror of the canonical `:root` block.

Each token entry carries vendor extensions that make this work:

- `me.krasnoperov.blog.cssVar` — the original CSS custom-property name
- `me.krasnoperov.blog.sourceFile` — which canonical file the token lives in (`global.css` / `theme.css` / `tokens.css`)
- `me.krasnoperov.blog.cssValue` — the original whitespace-collapsed CSS expression, used by the inverse generator
- `me.krasnoperov.blog.lightDark` — `[light, dark]` pair for tokens declared via `light-dark(a, b)`. DTCG consumers that ignore extensions render the light branch (which is also the `$value`); tools that understand the extension round-trip both.

## Visual surface for handoff

Static gallery: `pnpm exec playwright test -c playwright.style-reference.config.ts` writes `audit-out/style-reference/index.html` — a per-route gallery of every public surface (home, archive, post detail) at four breakpoints in light + dark. Output is gitignored.
