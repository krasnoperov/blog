import { Container } from 'inversify';
import { TYPES } from './di-types';
import type { Env } from './types';
import type { Kysely } from 'kysely';
import type { Database } from '../db/types';
import { createDb } from '../db';

// Import DAOs
import { UserDAO } from '../dao/user-dao';

// Import Auth Services
import { AuthService } from '../backend/features/auth/auth-service';
import { AuthController } from '../backend/features/auth/auth-controller';
import { AuthHandler } from '../backend/features/auth/auth-handler';

/**
 * Create and configure the dependency injection container
 * This is the heart of the bare framework - add your services here
 */
export function createContainer(env: Env): Container {
  const container = new Container();

  // Bind environment
  container.bind<Env>(TYPES.Env).toConstantValue(env);

  // Bind database
  container.bind<Kysely<Database>>(TYPES.Database).toDynamicValue(() => {
    return createDb(env.DB);
  }).inSingletonScope();

  // Bind DAOs
  container.bind(UserDAO).toSelf().inSingletonScope();
  container.bind(TYPES.UserDAO).toService(UserDAO);

  // Bind Auth Services
  container.bind(AuthService).toSelf().inSingletonScope();
  container.bind(AuthController).toSelf().inSingletonScope();
  container.bind(AuthHandler).toSelf().inSingletonScope();

  // --- FUTURE: Bind your domain services here ---
  // Example:
  // import { AssetDAO } from '../dao/asset-dao';
  // import { AssetService } from '../backend/services/assetService';
  //
  // container.bind(AssetDAO).toSelf().inSingletonScope();
  // container.bind(TYPES.AssetDAO).toService(AssetDAO);
  //
  // container.bind(AssetService).toDynamicValue(() => (
  //   new AssetService(env.SOME_API_KEY)
  // )).inSingletonScope();

  return container;
}
