#!/usr/bin/env node
import process from 'node:process';
import { parseArgs } from './lib/utils';
import { handleLogin } from './commands/login';
import { handleLogout } from './commands/logout';

async function main() {
  const [, , command, ...args] = process.argv;

  if (!command || command === 'help' || command === '--help') {
    printHelp();
    return;
  }

  try {
    const parsed = parseArgs(args);
    await dispatchCommand(command, parsed);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('Unexpected error occurred');
    }
    process.exitCode = 1;
  }
}

function printHelp() {
  console.log(`
CLI Tool - Bare Framework Foundation

Authentication:
  login                        Authenticate with the API and store access token
  logout                       Remove stored credentials

Options:
  --env <environment>          Target environment (production|stage|local), default: stage
  --local                      Shortcut for local development

Examples:
  npm run cli login            Authenticate with stage environment
  npm run cli login --env production
  npm run cli logout

--- FUTURE: Add your domain-specific commands here ---
Example:
  assets list                  List all assets
  assets get <id>              Get detailed info about a specific asset
  assets create                Create a new asset
`);
}

async function dispatchCommand(command: string, parsed: Parameters<typeof parseArgs>[0] extends string[] ? ReturnType<typeof parseArgs> : never) {
  switch (command) {
    case 'login':
      await handleLogin(parsed);
      break;
    case 'logout':
      await handleLogout(parsed);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exitCode = 1;
  }
}

void main();
