#!/usr/bin/env node
// Inverse of scripts/snapshot-design-tokens.mjs. Reads the DTCG snapshot under
// design/tokens/ (plus the _excluded.json sidecar) and rebuilds, in memory,
// the `:root { --token: value; ... }` blocks that originated each token. Used
// by the round-trip CI guard to verify that the snapshot is a lossless mirror
// of the canonical CSS.
//
// Usage:
//   node scripts/generate-css-from-tokens.mjs --check     # round-trip CI guard
//
// IMPORTANT: this script does NOT produce a drop-in replacement for the
// canonical CSS files. It emits only token declarations — none of the resets,
// body styles, or focus rules that those files also carry. There is no
// `--out-dir` mode for that reason. Programmatic consumers can import
// { generateCss } and own the file layout themselves.
//
// Round-trip contract: snapshotFromCss(generateCss(snapshot)) === snapshot.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { snapshotFromCss } from './snapshot-design-tokens.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tokensDir = join(repoRoot, 'design/tokens');
const NS = 'me.krasnoperov.blog';

function* walkTokens(node) {
  if (!node || typeof node !== 'object') return;
  for (const key of Object.keys(node)) {
    if (key.startsWith('$')) continue;
    const v = node[key];
    if (!v || typeof v !== 'object') continue;
    if ('$value' in v) yield v;
    else yield* walkTokens(v);
  }
}

export function generateCss({ core, semantic, component, excluded }) {
  const buckets = new Map([
    ['global.css', []],
    ['theme.css', []],
    ['tokens.css', []],
  ]);

  for (const root of [core, semantic, component]) {
    for (const entry of walkTokens(root)) {
      const ext = entry.$extensions || {};
      const cssVar = ext[`${NS}.cssVar`];
      const sourceFile = ext[`${NS}.sourceFile`];
      const cssValue = ext[`${NS}.cssValue`];
      if (!cssVar || !sourceFile || cssValue == null) {
        throw new Error(`generator: token missing cssVar/sourceFile/cssValue extension (path=${cssVar ?? '?'})`);
      }
      buckets.get(sourceFile).push({ cssVar, value: cssValue });
    }
  }

  for (const tok of excluded.tokens || []) {
    if (!buckets.has(tok.sourceFile)) {
      throw new Error(`generator: excluded token ${tok.cssVar} has unknown sourceFile ${tok.sourceFile}`);
    }
    buckets.get(tok.sourceFile).push({ cssVar: tok.cssVar, value: tok.rawValue });
  }

  const out = {};
  for (const [file, decls] of buckets) {
    out[file] = renderCss(decls);
  }
  return out;
}

function renderCss(decls) {
  const lines = [':root {'];
  for (const { cssVar, value } of decls) {
    lines.push(`  ${escapeCssIdent(cssVar)}: ${value};`);
  }
  lines.push('}', '');
  return lines.join('\n');
}

function escapeCssIdent(name) {
  return name.replace(/\./g, '\\.');
}

function readSnapshot() {
  const core = JSON.parse(readFileSync(join(tokensDir, 'core.tokens.json'), 'utf8'));
  const semantic = JSON.parse(readFileSync(join(tokensDir, 'semantic.tokens.json'), 'utf8'));
  const component = JSON.parse(readFileSync(join(tokensDir, 'component.tokens.json'), 'utf8'));
  const excluded = JSON.parse(readFileSync(join(tokensDir, '_excluded.json'), 'utf8'));
  return { core, semantic, component, excluded };
}

function checkRoundTrip() {
  const original = readSnapshot();
  const css = generateCss(original);

  const reSnapshot = snapshotFromCss({
    globalCss: css['global.css'],
    themeCss: css['theme.css'],
    componentCss: css['tokens.css'],
  });

  if (reSnapshot.uncaptured.length > 0) {
    console.error('round-trip: re-snapshot reported uncaptured CSS variables:');
    for (const name of reSnapshot.uncaptured) console.error(`  ${name}`);
    process.exit(1);
  }

  const wrap = (root, source, description) => ({
    $description: description,
    $extensions: {
      [`${NS}.source`]: source,
      [`${NS}.generatedBy`]: 'scripts/snapshot-design-tokens.mjs',
      [`${NS}.note`]: 'Generated from CSS. Do not edit by hand. Run `npm run tokens:snapshot` after changing the canonical CSS.',
    },
    ...root,
  });

  const expected = {
    'core.tokens.json': original.core,
    'semantic.tokens.json': original.semantic,
    'component.tokens.json': original.component,
    '_excluded.json': {
      description: original.excluded.description,
      generatedBy: original.excluded.generatedBy,
      tokens: original.excluded.tokens,
    },
  };

  const actual = {
    'core.tokens.json': wrap(reSnapshot.core.root, 'global.css and the structural slice of theme.css', original.core.$description),
    'semantic.tokens.json': wrap(reSnapshot.semantic.root, 'theme.css', original.semantic.$description),
    'component.tokens.json': wrap(reSnapshot.component.root, 'tokens.css', original.component.$description),
    '_excluded.json': {
      description: original.excluded.description,
      generatedBy: original.excluded.generatedBy,
      tokens: reSnapshot.excludedAll,
    },
  };

  let mismatched = 0;
  for (const fname of Object.keys(expected)) {
    const e = JSON.stringify(expected[fname], null, 2);
    const a = JSON.stringify(actual[fname], null, 2);
    if (e !== a) {
      mismatched++;
      console.error(`round-trip: ${fname} differs after CSS → DTCG → CSS → DTCG.`);
      const eLines = e.split('\n');
      const aLines = a.split('\n');
      for (let i = 0; i < Math.max(eLines.length, aLines.length); i++) {
        if (eLines[i] !== aLines[i]) {
          console.error(`  line ${i + 1}:`);
          console.error(`    expected: ${eLines[i] ?? '(eof)'}`);
          console.error(`    actual:   ${aLines[i] ?? '(eof)'}`);
          break;
        }
      }
    }
  }

  if (mismatched > 0) {
    console.error(`\nround-trip failed: ${mismatched} file(s) diverged.`);
    process.exit(1);
  }
  console.log('round-trip OK: snapshotFromCss(generateCss(snapshot)) === snapshot');
}

function main() {
  const args = process.argv.slice(2);
  if (!args.includes('--check')) {
    console.error('usage: generate-css-from-tokens.mjs --check');
    console.error('(no --out-dir — see header comment for why; import { generateCss } to consume programmatically.)');
    process.exit(2);
  }
  checkRoundTrip();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
