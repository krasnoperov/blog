#!/usr/bin/env node
// Snapshot the canonical CSS design tokens to W3C DTCG-formatted JSON files
// under design/tokens/. The CSS in src/frontend/styles/ remains the source of
// truth; this script only mirrors it so external tools (Claude Design, Figma,
// Style Dictionary consumers) have a machine-readable surface to read from.
//
// Usage:
//   pnpm run tokens:snapshot           # write design/tokens/*.tokens.json
//   pnpm run tokens:snapshot:check     # fail if files are out of date
//
// The light-dark() CSS function is preserved through a vendor extension:
//   { "$value": "<light-branch>", "$extensions": { "me.krasnoperov.blog.lightDark": ["<light>", "<dark>"] } }
// DTCG consumers that ignore extensions still get a renderable light value.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stylesDir = join(repoRoot, 'src/frontend/styles');
const outDir = join(repoRoot, 'design/tokens');

const NS = 'me.krasnoperov.blog';

// Tokens whose declarations live in theme.css but conceptually belong to "core"
// (typography-adjacent primitives that are not surface/color/semantic).
const THEME_CORE_PREFIXES = ['--max-width-', '--header-height', '--layout-gap', '--panel-spacing'];

// Per-token guidance for the excluded sidecar. Empty today — the snapshot is
// 100% DTCG-conformant. Add an entry when a new token is excluded so the
// sidecar surfaces a concrete graduation path.
const EXCLUSION_RECOMMENDATIONS = {};

// CSS declaration parser. Captures `--name: value;` inside `:root { ... }`.
// Handles multi-line values (light-dark(...) often spans 4 lines). Strips
// comments so they don't fold into a value.
function parseRoot(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const decls = [];

  // Find the first top-level `:root` selector and extract its body using a
  // brace-depth counter. Subsequent `:root` blocks (e.g. an `@media` override)
  // are intentionally ignored — a snapshot mirrors the desktop default.
  const rootIdx = stripped.search(/:root\s*\{/);
  if (rootIdx === -1) return decls;
  const openIdx = stripped.indexOf('{', rootIdx);
  let braceDepth = 1;
  let closeIdx = openIdx + 1;
  for (; closeIdx < stripped.length && braceDepth > 0; closeIdx++) {
    const c = stripped[closeIdx];
    if (c === '{') braceDepth++;
    else if (c === '}') braceDepth--;
  }
  const body = stripped.slice(openIdx + 1, closeIdx - 1);

  // Walk the body declaration-by-declaration. Split on top-level `;` (paren-
  // depth aware so `light-dark(a, b);` doesn't fragment), then for each
  // statement keep only the ones whose left side is a CSS custom property.
  const statements = splitTopLevel(body, ';');
  const declRe = /^\s*(--[a-zA-Z][a-zA-Z0-9_-]*)\s*:\s*([\s\S]+?)\s*$/;
  for (const stmt of statements) {
    const m = stmt.match(declRe);
    if (!m) continue;
    const cssVar = m[1];
    const value = m[2].replace(/\s+/g, ' ').trim();
    decls.push({ cssVar, value });
  }
  return decls;
}

function splitTopLevel(input, sep) {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === sep && depth === 0) {
      out.push(input.slice(start, i));
      start = i + 1;
    }
  }
  if (start < input.length) out.push(input.slice(start));
  return out;
}

function expandLightDark(value) {
  if (!value.includes('light-dark(')) return null;

  function walk(s, branch) {
    let out = '';
    let i = 0;
    while (i < s.length) {
      const idx = s.indexOf('light-dark(', i);
      if (idx === -1) {
        out += s.slice(i);
        break;
      }
      out += s.slice(i, idx);
      let depth = 1;
      let j = idx + 'light-dark('.length;
      for (; j < s.length && depth > 0; j++) {
        if (s[j] === '(') depth++;
        else if (s[j] === ')') depth--;
      }
      const inner = s.slice(idx + 'light-dark('.length, j - 1);
      const parts = splitTopLevel(inner, ',').map((p) => p.trim());
      const chosen = parts[branch === 'light' ? 0 : 1] ?? parts[0];
      out += walk(chosen, branch);
      i = j;
    }
    return out;
  }

  const light = walk(value, 'light').replace(/\s+/g, ' ').trim();
  const dark = walk(value, 'dark').replace(/\s+/g, ' ').trim();
  return [light, dark];
}

function pureVarRef(value) {
  const m = value.match(/^var\(\s*(--[a-z0-9-]+(?:\.\d+)?)\s*\)$/i);
  return m ? m[1] : null;
}

// The blog's component tokens live in tokens.css with a --blog- namespace;
// snapshotFromCss strips it so DTCG paths read `post.rowGap` rather than
// `blog.post.rowGap`. Other source files have no prefix.

const GROUPS = [
  // Typography primitives.
  { match: /^--font-size-(.+)$/, group: 'fontSize', leaf: ($1) => $1, type: 'dimension' },
  { match: /^--font-(.+)$/, group: 'font', leaf: ($1) => $1, type: 'fontFamily' },
  { match: /^--leading-(.+)$/, group: 'lineHeight', leaf: ($1) => $1, type: 'number' },

  // Console pixel scale.
  { match: /^--t-(.+)$/, group: 'fontSize.t', leaf: ($1) => kebabToCamel($1), type: 'dimension' },
  { match: /^--track-(.+)$/, group: 'tracking', leaf: ($1) => kebabToCamel($1), type: 'dimension' },

  // Spacing.
  { match: /^--s-(\d.*)$/, group: 'space.s', leaf: ($1) => $1, type: 'dimension' },

  // Chrome heights.
  { match: /^--bar-(.+)$/, group: 'bar', leaf: ($1) => $1, type: 'dimension' },
  { match: /^--row-(.+)$/, group: 'row', leaf: ($1) => $1, type: 'dimension' },
  { match: /^--ctl-(.+)$/, group: 'ctl', leaf: ($1) => $1, type: 'dimension' },

  // Geometry.
  { match: /^--radius-(.+)$/, group: 'radius', leaf: ($1) => $1, type: 'dimension' },
  { match: /^--rule$/, group: 'rule', leaf: () => 'default', type: 'border' },
  { match: /^--rule-(.+)$/, group: 'rule', leaf: ($1) => kebabToCamel($1), type: 'border' },

  // Layout.
  { match: /^--col-(.+)$/, group: 'layout.col', leaf: ($1) => kebabToCamel($1), type: 'dimension' },
  { match: /^--side-w$/, group: 'layout', leaf: () => 'sidebarWidth', type: 'dimension' },
  { match: /^--max-width-(.+)$/, group: 'layout.maxWidth', leaf: ($1) => $1, type: 'dimension' },
  { match: /^--header-height$/, group: 'layout', leaf: () => 'headerHeight', type: 'dimension' },
  { match: /^--layout-gap$/, group: 'layout', leaf: () => 'gap', type: 'dimension' },
  { match: /^--panel-spacing$/, group: 'layout', leaf: () => 'panelSpacing', type: 'dimension' },

  // Motion.
  { match: /^--ease$/, group: 'motion', leaf: () => 'ease', type: 'cubicBezier' },
  { match: /^--d-(.+)$/, group: 'motion.duration', leaf: ($1) => kebabToCamel($1), type: 'duration' },

  // Paper / ink / accent foundation.
  { match: /^--paper$/, group: 'paper', leaf: () => 'default', type: 'color' },
  { match: /^--paper-(.+)$/, group: 'paper', leaf: ($1) => kebabToCamel($1), type: 'color' },
  { match: /^--ink$/, group: 'ink', leaf: () => 'default', type: 'color' },
  { match: /^--ink-(.+)$/, group: 'ink', leaf: ($1) => kebabToCamel($1), type: 'color' },
  { match: /^--accent$/, group: 'accent', leaf: () => 'default', type: 'color' },
  { match: /^--accent-(.+)$/, group: 'accent', leaf: ($1) => kebabToCamel($1), type: 'color' },
  { match: /^--status-(.+)$/, group: 'status', leaf: ($1) => kebabToCamel($1), type: 'color' },

  // Semantic theme.
  { match: /^--surface-(.+)$/, group: 'surface', leaf: ($1) => kebabToCamel($1), type: 'color' },
  { match: /^--text-on-brand-(.+)$/, group: 'text.onBrand', leaf: ($1) => kebabToCamel($1), type: 'color' },
  { match: /^--text-(.+)$/, group: 'text', leaf: ($1) => kebabToCamel($1), type: 'color' },
  { match: /^--border-(.+)$/, group: 'border', leaf: ($1) => kebabToCamel($1), type: 'color' },
  { match: /^--focus-(.+)$/, group: 'focus', leaf: ($1) => kebabToCamel($1), type: 'color' },
  { match: /^--brand-gradient-(.+)$/, group: 'gradient', leaf: ($1) => `brand${capitalize(kebabToCamel($1))}`, type: 'color' },
  { match: /^--gradient-(.+)$/, group: 'gradient', leaf: ($1) => kebabToCamel($1), type: 'color' },
  { match: /^--button-(\w+)-(.+)$/, group: ($1) => `button.${$1}`, leaf: ($1, $2) => kebabToCamel($2), type: undefined },
  { match: /^--scroll-(.+)$/, group: 'scroll', leaf: ($1) => kebabToCamel($1), type: 'color' },
  { match: /^--color-(.+)$/, group: 'color', leaf: ($1) => kebabToCamel($1), type: 'color' },
  { match: /^--overlay-(.+)$/, group: 'overlay', leaf: ($1) => kebabToCamel($1), type: 'color' },
  { match: /^--diagram-(.+)$/, group: 'diagram', leaf: ($1) => kebabToCamel($1), type: 'color' },
  { match: /^--shadow-(.+)$/, group: 'shadow', leaf: ($1) => kebabToCamel($1), type: undefined },

  // Component scale (--blog- prefix already stripped). Order matters: more
  // specific patterns (--code-block-*, --code-inline-*) MUST come before the
  // catch-all --code-* rule, otherwise the broader rule misroutes them.
  { match: /^--code-block-(.+)$/, group: 'codeBlock', leaf: ($1) => kebabToCamel($1), type: undefined },
  { match: /^--code-inline-(.+)$/, group: 'codeInline', leaf: ($1) => kebabToCamel($1), type: undefined },
  { match: /^--code-(.+)$/, group: 'code', leaf: ($1) => kebabToCamel($1), type: 'color' },
  { match: /^--page-(.+)$/, group: 'page', leaf: ($1) => kebabToCamel($1), type: undefined },
  { match: /^--section-(.+)$/, group: 'section', leaf: ($1) => kebabToCamel($1), type: undefined },
  { match: /^--header-(.+)$/, group: 'header', leaf: ($1) => kebabToCamel($1), type: undefined },
  { match: /^--foot-bar-(.+)$/, group: 'footBar', leaf: ($1) => kebabToCamel($1), type: undefined },
  { match: /^--post-(.+)$/, group: 'post', leaf: ($1) => kebabToCamel($1), type: undefined },
  { match: /^--quiet-label-(.+)$/, group: 'quietLabel', leaf: ($1) => kebabToCamel($1), type: undefined },
];

function kebabToCamel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function inferTypeFromValue(value) {
  const trimmed = value.trim();
  if (/^(?:light-dark\(\s*)?(?:oklch|hsl|rgb|color|color-mix)\(/i.test(trimmed)) return 'color';
  if (/^[\d.]+(?:px|rem|em|%)$/.test(trimmed)) return 'dimension';
  if (/^[\d.]+$/.test(trimmed)) return 'number';
  if (/^[\d.]+(?:px|rem)\s+solid\s+/.test(trimmed)) return 'border';
  if (/^[-\d.]+(?:px|rem|em|%)\s+[-\d.]+(?:px|rem|em|%)/.test(trimmed) && /(?:oklch|rgb|hsl|color)/i.test(trimmed)) return 'shadow';
  return undefined;
}

function classify(cssVar, value) {
  for (const rule of GROUPS) {
    const m = cssVar.match(rule.match);
    if (!m) continue;
    const groupVal = typeof rule.group === 'function' ? rule.group(...m.slice(1)) : rule.group;
    const leaf = rule.leaf(...m.slice(1));
    let type = rule.type;
    if (type === undefined) type = inferTypeFromValue(value);
    if (type === undefined) type = inferTypeFromName(cssVar);
    return { groupPath: groupVal, leaf, type };
  }
  return null;
}

function inferTypeFromName(cssVar) {
  if (/(?:-padding|-margin|-gap|-size|-width|-height|-radius|-space|-spacing|-offset|-inset|-tracking)(?:-[a-z]+)?$/i.test(cssVar)) return 'dimension';
  if (/(?:-color|-bg|-foreground|-fg)(?:-[a-z]+)?$/i.test(cssVar)) return 'color';
  if (/-weight$/i.test(cssVar)) return 'fontWeight';
  if (/-family$/i.test(cssVar)) return 'fontFamily';
  return undefined;
}

function buildPathMap(decls) {
  const map = new Map();
  for (const d of decls) {
    const cls = classify(d.normalisedCssVar, d.value);
    if (!cls) continue;
    const path = cls.groupPath ? `${cls.groupPath}.${cls.leaf}` : cls.leaf;
    map.set(d.cssVar, path);
  }
  return map;
}

function valueToDtcg(value, pathMap) {
  const aliasTo = pureVarRef(value);
  if (aliasTo) {
    const path = pathMap.get(aliasTo);
    if (path) return { value: `{${path}}`, lightDark: null, isAlias: true };
  }
  const ld = expandLightDark(value);
  if (ld) {
    const [lightForm, darkForm] = ld;
    if (lightForm === darkForm) return { value: lightForm, lightDark: null };
    return { value: lightForm, lightDark: [lightForm, darkForm] };
  }
  return { value, lightDark: null };
}

function parseDimension(s) {
  const t = String(s).trim();
  if (/^-?0(?:\.0+)?$/.test(t)) return { value: 0, unit: 'px' };
  const m = t.match(/^(-?\d*\.?\d+)(px|rem|em|%)$/);
  if (!m) return null;
  return { value: Number(m[1]), unit: m[2] };
}

function parseNumber(s) {
  const t = String(s).trim();
  if (!/^-?\d*\.?\d+$/.test(t)) return null;
  return Number(t);
}

function parseFontFamily(s) {
  const parts = splitTopLevel(String(s), ',')
    .map((p) => p.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
  if (parts.length === 0) return null;
  return parts.length === 1 ? parts[0] : parts;
}

function parseOklchColor(s) {
  const m = String(s).trim().match(/^oklch\(\s*([0-9.]+)(%?)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\s*\)$/);
  if (!m) return null;
  const lRaw = Number(m[1]);
  const lPercent = m[2] === '%';
  const L = lPercent ? lRaw / 100 : lRaw;
  const C = Number(m[3]);
  const H = Number(m[4]);
  const alpha = m[5] !== undefined ? Number(m[5]) : 1;
  const out = { colorSpace: 'oklch', components: [L, C, H] };
  if (alpha !== 1) out.alpha = alpha;
  return out;
}

function parseColorOrAlias(s, pathMap) {
  const aliasTo = pureVarRef(s);
  if (aliasTo && pathMap?.has(aliasTo)) return `{${pathMap.get(aliasTo)}}`;
  return parseOklchColor(s);
}

function parseShadowLayer(s) {
  const trimmed = String(s).trim();
  const colorIdx = trimmed.search(/\b(?:oklch|rgb|hsl)\s*\(/i);
  if (colorIdx === -1) return null;
  const lengths = trimmed.slice(0, colorIdx).trim().split(/\s+/);
  if (lengths.length < 3 || lengths.length > 4) return null;
  const color = parseOklchColor(trimmed.slice(colorIdx).trim());
  if (!color) return null;
  const dims = lengths.map(parseDimension);
  if (dims.some((d) => d === null)) return null;
  return {
    offsetX: dims[0],
    offsetY: dims[1],
    blur: dims[2],
    spread: dims[3] ?? { value: 0, unit: 'px' },
    color,
  };
}

function parseDuration(s) {
  const t = String(s).trim();
  const m = t.match(/^(-?\d*\.?\d+)(ms|s)$/);
  if (!m) return null;
  return { value: Number(m[1]), unit: m[2] };
}

function parseCubicBezier(s) {
  const t = String(s).trim();
  const m = t.match(/^cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
}

function parseShadow(s) {
  if (String(s).trim() === 'none') return null;
  const layers = splitTopLevel(String(s), ',').map((l) => parseShadowLayer(l));
  if (layers.some((l) => l === null)) return null;
  return layers.length === 1 ? layers[0] : layers;
}

function parseBorder(s, pathMap) {
  const tokens = splitTopLevel(String(s).trim(), ' ').map((t) => t.trim()).filter(Boolean);
  if (tokens.length !== 3) return null;
  const width = parseDimension(tokens[0]);
  if (!width) return null;
  const style = tokens[1];
  if (!/^(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)$/.test(style)) return null;
  const color = parseColorOrAlias(tokens[2], pathMap);
  if (color === null) return null;
  return { width, style, color };
}

function liftValueByType(rawString, type, pathMap) {
  switch (type) {
    case 'dimension': {
      const v = parseDimension(rawString);
      return v ? { ok: true, value: v } : { ok: false };
    }
    case 'number': {
      const v = parseNumber(rawString);
      return v !== null ? { ok: true, value: v } : { ok: false };
    }
    case 'fontFamily': {
      const v = parseFontFamily(rawString);
      return v !== null ? { ok: true, value: v } : { ok: false };
    }
    case 'color': {
      const v = parseOklchColor(rawString);
      return v ? { ok: true, value: v } : { ok: false };
    }
    case 'shadow': {
      const v = parseShadow(rawString);
      return v ? { ok: true, value: v } : { ok: false };
    }
    case 'duration': {
      const v = parseDuration(rawString);
      return v ? { ok: true, value: v } : { ok: false };
    }
    case 'cubicBezier': {
      const v = parseCubicBezier(rawString);
      return v ? { ok: true, value: v } : { ok: false };
    }
    case 'border': {
      const v = parseBorder(rawString, pathMap);
      return v ? { ok: true, value: v } : { ok: false };
    }
    default:
      return { ok: false };
  }
}

function setNested(root, pathParts, leafKey, entry) {
  let node = root;
  for (const part of pathParts.filter(Boolean)) {
    if (!(part in node)) node[part] = {};
    node = node[part];
  }
  node[leafKey] = entry;
}

function buildJson(decls, pathMap) {
  const root = {};
  const excluded = [];
  for (const d of decls) {
    const cls = classify(d.normalisedCssVar, d.value);
    if (!cls) continue;
    const dtcg = valueToDtcg(d.value, pathMap);

    let finalValue = dtcg.value;
    let extrasFromLift;
    if (!dtcg.isAlias && cls.type) {
      const lifted = liftValueByType(dtcg.value, cls.type, pathMap);
      if (lifted.ok) {
        finalValue = lifted.value;
        extrasFromLift = lifted.extras;
      } else {
        excluded.push({
          cssVar: d.cssVar,
          sourceFile: d.sourceFile,
          inferredType: cls.type,
          rawValue: dtcg.value,
          reason: 'CSS construct has no DTCG-conformant shape (color-mix, clamp/calc, shorthand, multi-layer with `none`).',
          recommendation: EXCLUSION_RECOMMENDATIONS[d.cssVar],
        });
        continue;
      }
    }

    const entry = { $value: finalValue };
    if (!dtcg.isAlias && cls.type) entry.$type = cls.type;
    entry.$extensions = { [`${NS}.cssVar`]: d.cssVar };
    if (d.sourceFile) entry.$extensions[`${NS}.sourceFile`] = d.sourceFile;
    if (dtcg.lightDark) entry.$extensions[`${NS}.lightDark`] = dtcg.lightDark;
    if (extrasFromLift?.gradientDirection) {
      entry.$extensions[`${NS}.gradientDirection`] = extrasFromLift.gradientDirection;
    }
    entry.$extensions[`${NS}.cssValue`] = d.value;
    const groupParts = (cls.groupPath || '').split('.').filter(Boolean);
    setNested(root, groupParts, cls.leaf, entry);
  }
  return { root, excluded };
}

function parseDeclsFromCss(css, prefixStrip) {
  return parseRoot(css).map((d) => ({
    ...d,
    normalisedCssVar: prefixStrip ? d.cssVar.replace(prefixStrip, '--') : d.cssVar,
  }));
}

function pickThemeCoreSplit(decls) {
  const core = [];
  const semantic = [];
  for (const d of decls) {
    if (THEME_CORE_PREFIXES.some((p) => d.cssVar.startsWith(p))) core.push(d);
    else semantic.push(d);
  }
  return { core, semantic };
}

export function snapshotFromCss({ globalCss, themeCss, componentCss }) {
  const globalDecls = parseDeclsFromCss(globalCss, null);
  const themeDecls = parseDeclsFromCss(themeCss, null);
  const tokensDecls = parseDeclsFromCss(componentCss, '--blog-');

  // tokens.css carries two layers: the paper/ink/accent/typography/spacing/
  // chrome/geometry/motion/layout foundation (no prefix) AND the component
  // scale (`--blog-*`). Split them so the foundation lands in core.tokens.json
  // and the component scale lands in component.tokens.json — otherwise the
  // documented "core has palette + type + spacing primitives" contract is
  // violated.
  const tokensFoundation = tokensDecls.filter((d) => !d.cssVar.startsWith('--blog-'));
  const tokensComponent = tokensDecls.filter((d) => d.cssVar.startsWith('--blog-'));

  const seen = new Map();
  const checkUnique = (decls, sourceFile) => {
    for (const d of decls) {
      if (seen.has(d.cssVar)) {
        throw new Error(
          `snapshot: ${d.cssVar} declared in both ${seen.get(d.cssVar)} and ${sourceFile}. ` +
          `Each cssVar must live in one source file — remove the redundant declaration.`
        );
      }
      seen.set(d.cssVar, sourceFile);
    }
  };
  checkUnique(globalDecls, 'global.css');
  checkUnique(themeDecls, 'theme.css');
  checkUnique(tokensDecls, 'tokens.css');

  const { core: themeCore, semantic: themeSemantic } = pickThemeCoreSplit(themeDecls);

  const allDecls = [...globalDecls, ...themeDecls, ...tokensDecls];
  const pathMap = buildPathMap(allDecls);

  const tag = (decls, sourceFile) => decls.map((d) => ({ ...d, sourceFile }));
  const taggedCore = [
    ...tag(globalDecls, 'global.css'),
    ...tag(themeCore, 'theme.css'),
    ...tag(tokensFoundation, 'tokens.css'),
  ];
  const taggedSemantic = tag(themeSemantic, 'theme.css');
  const taggedComponent = tag(tokensComponent, 'tokens.css');

  const core = buildJson(taggedCore, pathMap);
  const semantic = buildJson(taggedSemantic, pathMap);
  const component = buildJson(taggedComponent, pathMap);

  pruneDanglingAliases([core, semantic, component]);

  const excludedAll = [...core.excluded, ...semantic.excluded, ...component.excluded];

  const captured = new Set();
  for (const r of [core.root, semantic.root, component.root]) collectCssVars(r, captured);
  for (const e of excludedAll) captured.add(e.cssVar);
  const declared = allDecls.map((d) => d.cssVar);
  const uncaptured = declared.filter((name) => !captured.has(name));

  return { core, semantic, component, excludedAll, uncaptured };
}

function main({ checkOnly }) {
  const globalCss = readFileSync(join(stylesDir, 'global.css'), 'utf8');
  const themeCss = readFileSync(join(stylesDir, 'theme.css'), 'utf8');
  const componentCss = readFileSync(join(stylesDir, 'tokens.css'), 'utf8');

  const { core, semantic, component, excludedAll, uncaptured } = snapshotFromCss({
    globalCss, themeCss, componentCss,
  });

  if (uncaptured.length > 0) {
    console.error('snapshot-design-tokens: the following CSS variables are not classified by any GROUPS rule:');
    for (const name of uncaptured) console.error(`  ${name}`);
    console.error('Add a rule to GROUPS in scripts/snapshot-design-tokens.mjs.');
    process.exit(2);
  }

  const outputs = [
    ['core.tokens.json', core.root, 'global.css and the structural slice of theme.css', 'Type, font, spacing, radius, layout primitives. Mirrors src/frontend/styles/global.css and the structural slice of theme.css.'],
    ['semantic.tokens.json', semantic.root, 'theme.css', 'Surfaces, text, borders, status, code, overlay, scroll. Mirrors the semantic slice of src/frontend/styles/theme.css.'],
    ['component.tokens.json', component.root, 'tokens.css', 'Component-scale tokens (page, section, header, post, codeBlock, quietLabel). Mirrors the --blog- namespace in src/frontend/styles/tokens.css with the prefix stripped.'],
  ];

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  let drift = 0;
  for (const [fname, json, source, description] of outputs) {
    const wrapped = {
      $description: description,
      $extensions: {
        [`${NS}.source`]: source,
        [`${NS}.generatedBy`]: 'scripts/snapshot-design-tokens.mjs',
        [`${NS}.note`]: 'Generated from CSS. Do not edit by hand. Run `pnpm run tokens:snapshot` after changing the canonical CSS.',
      },
      ...json,
    };
    const serialized = JSON.stringify(wrapped, null, 2) + '\n';
    const target = join(outDir, fname);
    if (checkOnly) {
      const existing = existsSync(target) ? readFileSync(target, 'utf8') : '';
      if (existing !== serialized) {
        console.error(`drift: ${relative(repoRoot, target)} is out of date.`);
        drift++;
      }
    } else {
      writeFileSync(target, serialized);
      console.log(`wrote ${relative(repoRoot, target)}`);
    }
  }

  const excludedJson = {
    description: 'Canonical CSS tokens whose source value uses CSS constructs with no DTCG-conformant shape (color-mix, clamp, calc, CSS shorthand). They remain authoritative in src/frontend/styles/ and are deliberately omitted from the DTCG snapshot.',
    generatedBy: 'scripts/snapshot-design-tokens.mjs',
    tokens: excludedAll,
  };
  const excludedSerialized = JSON.stringify(excludedJson, null, 2) + '\n';
  const excludedTarget = join(outDir, '_excluded.json');
  if (checkOnly) {
    const existing = existsSync(excludedTarget) ? readFileSync(excludedTarget, 'utf8') : '';
    if (existing !== excludedSerialized) {
      console.error(`drift: ${relative(repoRoot, excludedTarget)} is out of date.`);
      drift++;
    }
  } else {
    writeFileSync(excludedTarget, excludedSerialized);
    console.log(`wrote ${relative(repoRoot, excludedTarget)}`);
  }

  if (checkOnly && drift > 0) {
    console.error(`\n${drift} file(s) out of date. Run \`pnpm run tokens:snapshot\` to refresh.`);
    process.exit(1);
  }
}

function collectCssVars(node, out) {
  if (!node || typeof node !== 'object') return;
  for (const key of Object.keys(node)) {
    if (key.startsWith('$')) continue;
    const v = node[key];
    if (v && typeof v === 'object') {
      if ('$value' in v && v.$extensions && v.$extensions[`${NS}.cssVar`]) {
        out.add(v.$extensions[`${NS}.cssVar`]);
      } else {
        collectCssVars(v, out);
      }
    }
  }
}

function collectPaths(node, prefix, out) {
  if (!node || typeof node !== 'object') return;
  for (const key of Object.keys(node)) {
    if (key.startsWith('$')) continue;
    const v = node[key];
    const here = prefix ? `${prefix}.${key}` : key;
    if (v && typeof v === 'object') {
      if ('$value' in v) out.add(here);
      else collectPaths(v, here, out);
    }
  }
}

function pruneDanglingAliases(buckets) {
  let changed = true;
  while (changed) {
    changed = false;
    const validPaths = new Set();
    for (const b of buckets) collectPaths(b.root, '', validPaths);
    for (const bucket of buckets) {
      pruneOne(bucket.root, '', bucket, validPaths, () => { changed = true; });
    }
  }
}

function pruneOne(node, prefix, bucket, validPaths, onChange) {
  if (!node || typeof node !== 'object') return;
  for (const key of Object.keys(node)) {
    if (key.startsWith('$')) continue;
    const v = node[key];
    if (!v || typeof v !== 'object') continue;
    const here = prefix ? `${prefix}.${key}` : key;
    if ('$value' in v) {
      const val = v.$value;
      if (typeof val === 'string') {
        const m = val.match(/^\{([^}]+)\}$/);
        if (m && !validPaths.has(m[1])) {
          const cssVar = v.$extensions?.[`${NS}.cssVar`] ?? here;
          bucket.excluded.push({
            cssVar,
            sourceFile: v.$extensions?.[`${NS}.sourceFile`],
            inferredType: v.$type ?? '(alias)',
            rawValue: v.$extensions?.[`${NS}.cssValue`] ?? val,
            reason: `alias target {${m[1]}} was excluded (transitive exclusion).`,
            recommendation: EXCLUSION_RECOMMENDATIONS[cssVar],
          });
          delete node[key];
          onChange();
        }
      }
    } else {
      pruneOne(v, here, bucket, validPaths, onChange);
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const checkOnly = process.argv.includes('--check');
  main({ checkOnly });
}
