import type { ParsedArgs } from '../lib/types';
import { removeConfig, DEFAULT_ENVIRONMENT } from '../lib/config';

export async function handleLogout(parsed: ParsedArgs) {
  // Determine environment from flags
  const isLocal = parsed.options.local === 'true';
  const environment = isLocal ? 'local' : (parsed.options.env || undefined);

  try {
    if (environment) {
      await removeConfig(environment);
      console.log(`Removed stored credentials for environment "${environment}".`);
    } else {
      await removeConfig(); // Remove all environments
      console.log('Removed all stored credentials.');
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log('No stored credentials were found.');
      return;
    }
    throw error;
  }
}
