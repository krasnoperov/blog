import { register } from 'node:module';

// Node's test workers re-run --import flags. Resolve the loader through this
// local file so it remains reachable from pnpm's isolated node_modules layout.
register(new URL('../node_modules/@swc-node/register/esm/esm.mjs', import.meta.url), import.meta.url);
