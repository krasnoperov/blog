import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { StoredConfig, MultiEnvConfig } from './types';

export const DEFAULT_ENVIRONMENT = 'production';
const CONFIG_DIR_NAME = 'npm run cli';
const CONFIG_FILE_NAME = 'config.json';

async function loadMultiEnvConfig(): Promise<MultiEnvConfig | null> {
  const configPath = await getConfigPath();
  try {
    const raw = await readFile(configPath, 'utf8');
    const data = JSON.parse(raw);

    // Handle legacy single config format
    if (data.environment && data.token && !data.configs) {
      const legacyConfig = data as StoredConfig;
      return {
        configs: {
          [legacyConfig.environment]: legacyConfig
        }
      };
    }

    return data as MultiEnvConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function saveMultiEnvConfig(multiConfig: MultiEnvConfig): Promise<void> {
  const configPath = await getConfigPath();
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, JSON.stringify(multiConfig, null, 2), 'utf8');
}

export async function saveConfig(config: StoredConfig): Promise<void> {
  const multiConfig = await loadMultiEnvConfig() || { configs: {} };
  multiConfig.configs[config.environment] = config;
  await saveMultiEnvConfig(multiConfig);
}

export async function loadStoredConfig(environment?: string): Promise<StoredConfig | null> {
  const multiConfig = await loadMultiEnvConfig();
  if (!multiConfig) return null;

  // Always use the provided environment, never fall back to a stored default
  const env = environment || DEFAULT_ENVIRONMENT;
  return multiConfig.configs[env] || null;
}

export async function removeConfig(environment?: string): Promise<void> {
  if (!environment) {
    // Remove all configs
    const configPath = await getConfigPath();
    await rm(configPath);
    return;
  }

  // Remove specific environment config
  const multiConfig = await loadMultiEnvConfig();
  if (multiConfig) {
    delete multiConfig.configs[environment];

    if (Object.keys(multiConfig.configs).length === 0) {
      // If no configs left, remove the file
      const configPath = await getConfigPath();
      await rm(configPath);
    } else {
      await saveMultiEnvConfig(multiConfig);
    }
  }
}

export async function getConfigPath(): Promise<string> {
  const baseDir = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(baseDir, CONFIG_DIR_NAME, CONFIG_FILE_NAME);
}

export function resolveBaseUrl(env: string): string {
  switch (env) {
    case 'production':
      return 'https://whitelabel.krasnoperov.me';
    case 'stage':
    case 'staging':
      return 'https://whitelabel-stage.krasnoperov.me';
    case 'local':
      return 'https://local.krasnoperov.me:3001';
    default:
      throw new Error(`Unknown environment "${env}". Valid options: production, stage, local`);
  }
}
