import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { Hono } from 'hono';
import type { User } from '../../db/types';
import type { Env } from '../../core/types';
import { UserDAO } from '../../dao/user-dao';
import { AuthService } from '../features/auth/auth-service';
import { TEST_SESSION_HEADER } from '../features/auth/test-session';
import { createAuthMiddleware } from './auth-middleware';
import type { AppContext } from '../routes/types';

type TestContainer = {
  get(token: unknown): unknown;
};

type TestAuthService = Pick<AuthService, 'verifyJWT'>;
type TestUserDAO = Pick<UserDAO, 'findById'>;

function createContainer(authService: TestAuthService, userDAO: TestUserDAO): TestContainer {
  return {
    get(token) {
      if (token === AuthService) {
        return authService;
      }

      if (token === UserDAO) {
        return userDAO;
      }

      throw new Error(`Unexpected token request: ${String(token)}`);
    },
  };
}

function createApp(authService: TestAuthService, userDAO: TestUserDAO) {
  const app = new Hono<AppContext>();

  app.use('*', async (c, next) => {
    c.set('container', createContainer(authService, userDAO) as never);
    await next();
  });

  app.use('/protected', createAuthMiddleware());
  app.get('/protected', (c) => c.json({
    isTestSession: c.get('authIsTestSession') ?? false,
    user: c.get('authUser') ?? null,
    userId: c.get('userId') ?? null,
  }));

  return app;
}

function createUser(overrides: Partial<User> = {}): User {
  return {
    created_at: '2026-03-15T10:00:00.000Z',
    email: 'tester@example.com',
    google_id: 'google-123',
    id: 42,
    name: 'Tester',
    updated_at: '2026-03-15T10:00:00.000Z',
    ...overrides,
  };
}

describe('createAuthMiddleware', () => {
  test('hydrates auth context from a verified cookie session', async () => {
    const app = createApp(
      {
        verifyJWT: async (token) => token === 'valid-token' ? { userId: 42 } : null,
      },
      {
        findById: async (userId) => userId === 42 ? createUser() : undefined,
      },
    );

    const response = await app.fetch(new Request('http://localhost/protected', {
      headers: {
        Cookie: 'auth_token=valid-token',
      },
    }), { ENVIRONMENT: 'local' } as Env, {} as ExecutionContext);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      isTestSession: false,
      user: createUser(),
      userId: 42,
    });
  });

  test('accepts local test-session overrides without touching JWT auth', async () => {
    const app = createApp(
      {
        verifyJWT: async () => {
          throw new Error('verifyJWT should not be called for test-session auth');
        },
      },
      {
        findById: async () => {
          throw new Error('findById should not be called for test-session auth');
        },
      },
    );

    const response = await app.fetch(new Request('http://localhost/protected', {
      headers: {
        [TEST_SESSION_HEADER]: encodeURIComponent(JSON.stringify({
          email: 'local@example.com',
          id: 7,
          name: 'Local Tester',
        })),
      },
    }), { ENVIRONMENT: 'local' } as Env, {} as ExecutionContext);

    assert.equal(response.status, 200);
    const body = await response.json() as {
      isTestSession: boolean;
      user: User;
      userId: number;
    };
    assert.equal(body.userId, 7);
    assert.equal(body.isTestSession, true);
    assert.equal(body.user.email, 'local@example.com');
  });

  test('rejects anonymous requests with 401', async () => {
    const app = createApp(
      {
        verifyJWT: async () => null,
      },
      {
        findById: async () => undefined,
      },
    );

    const response = await app.fetch(
      new Request('http://localhost/protected'),
      { ENVIRONMENT: 'local' } as Env,
      {} as ExecutionContext,
    );

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'Not authenticated' });
  });

  test('returns 404 when the token is valid but the user record no longer exists', async () => {
    const app = createApp(
      {
        verifyJWT: async () => ({ userId: 999 }),
      },
      {
        findById: async () => undefined,
      },
    );

    const response = await app.fetch(new Request('http://localhost/protected', {
      headers: {
        Cookie: 'auth_token=valid-token',
      },
    }), { ENVIRONMENT: 'local' } as Env, {} as ExecutionContext);

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'User not found' });
  });
});
