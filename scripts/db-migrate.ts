#!/usr/bin/env node
/**
 * Database Migration Script
 *
 * Usage:
 *   npm run db:migrate              # Local (default)
 *   npm run db:migrate:stage        # Stage environment (remote)
 *   npm run db:migrate:production   # Production environment (remote)
 */

import { execSync } from 'child_process';

const ENVIRONMENTS = {
  local: 'whitelabel-local',
  stage: 'whitelabel-stage',
  production: 'whitelabel-production'
} as const;

type Environment = keyof typeof ENVIRONMENTS;

function migrate(env: Environment, remote: boolean = false) {
  const dbName = ENVIRONMENTS[env];
  const configFile = env === 'local' ? 'wrangler.dev.toml' : 'wrangler.toml';
  const envFlag = env === 'local' ? '' : `--env ${env}`;
  const localFlag = remote ? '' : '--local';

  const command = `npx wrangler d1 migrations apply ${dbName} ${envFlag} ${localFlag} --config ${configFile}`.replace(/\s+/g, ' ').trim();

  console.log(`\n🗄️  Running migrations for ${env} environment...`);
  console.log(`   Database: ${dbName}`);
  console.log(`   Command: ${command}\n`);

  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`\n✅ Migrations applied successfully to ${dbName}`);
  } catch (error) {
    console.error(`\n❌ Migration failed for ${dbName}`);
    process.exit(1);
  }
}

// Parse arguments
const args = process.argv.slice(2);
const env = (args[0] || 'local') as Environment;
const remote = args[1] === 'remote';

if (!ENVIRONMENTS[env]) {
  console.error(`Unknown environment: ${env}`);
  console.error(`Valid environments: ${Object.keys(ENVIRONMENTS).join(', ')}`);
  process.exit(1);
}

migrate(env, remote);
