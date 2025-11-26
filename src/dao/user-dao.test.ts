import { test, beforeEach, afterEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import type { Kysely } from 'kysely';
import type { Database, User } from '../db/types';
import { UserDAO, type CreateUserData, type UpdateUserData } from './user-dao';
import { createTestDatabase, cleanupTestDatabase } from '../test-utils/database';
import { TestUserBuilder } from '../test-utils/test-data-builders';

describe('UserDAO', () => {
  let db: Kysely<Database>;
  let dao: UserDAO;
  let testUser: User;

  beforeEach(async () => {
    db = await createTestDatabase();
    dao = new UserDAO(db);
    // Create a default test user
    const userData = await new TestUserBuilder()
      .withEmail('default@example.com')
      .withName('Test User')
      .create(db);
    testUser = userData;
  });

  afterEach(async () => {
    await cleanupTestDatabase(db);
  });

  describe('findById', () => {
    test('returns user when exists', async () => {
      const user = await dao.findById(testUser.id);
      assert(user);
      assert.strictEqual(user.id, testUser.id);
      assert.strictEqual(user.email, 'default@example.com');
      assert.strictEqual(user.name, 'Test User');
    });

    test('returns undefined when user does not exist', async () => {
      const user = await dao.findById(99999);
      assert.strictEqual(user, undefined);
    });
  });

  describe('findByEmail', () => {
    test('returns user when exists', async () => {
      const user = await dao.findByEmail('default@example.com');
      assert(user);
      assert.strictEqual(user.id, testUser.id);
      assert.strictEqual(user.email, 'default@example.com');
    });

    test('returns undefined when email does not exist', async () => {
      const user = await dao.findByEmail('nonexistent@example.com');
      assert.strictEqual(user, undefined);
    });
  });

  describe('findByGoogleId', () => {
    test('returns user when exists', async () => {
      const googleId = 'google-id-123';
      const userData = await new TestUserBuilder()
        .withGoogleId(googleId)
        .withEmail('google-user@example.com')
        .create(db);

      const user = await dao.findByGoogleId(googleId);
      assert(user);
      assert.strictEqual(user.google_id, googleId);
      assert.strictEqual(user.email, 'google-user@example.com');
    });

    test('returns undefined when google_id does not exist', async () => {
      const user = await dao.findByGoogleId('non-existent-id');
      assert.strictEqual(user, undefined);
    });
  });

  describe('create', () => {
    test('creates new user with required fields', async () => {
      const createData: CreateUserData = {
        email: 'new@example.com',
        name: 'New User'
      };

      const userId = await dao.create(createData);
      assert(typeof userId === 'number');

      const user = await dao.findById(userId);
      assert(user);
      assert.strictEqual(user.email, 'new@example.com');
      assert.strictEqual(user.name, 'New User');
      assert(user.created_at);
      assert(user.updated_at);
    });

    test('creates user with optional google_id', async () => {
      const createData: CreateUserData = {
        email: 'google@example.com',
        name: 'Google User',
        google_id: 'google-456',
      };

      const userId = await dao.create(createData);
      const user = await dao.findById(userId);
      assert(user);
      assert.strictEqual(user.google_id, 'google-456');
    });
  });

  describe('update', () => {
    test('updates user name', async () => {
      const updateData: UpdateUserData = {
        name: 'Updated Name'
      };

      await dao.update(testUser.id, updateData);
      const user = await dao.findById(testUser.id);
      assert(user);
      assert.strictEqual(user.name, 'Updated Name');
      assert.strictEqual(user.email, 'default@example.com');
    });

    test('updates google_id', async () => {
      const updateData: UpdateUserData = {
        google_id: 'new-google-id'
      };

      await dao.update(testUser.id, updateData);
      const user = await dao.findById(testUser.id);
      assert(user);
      assert.strictEqual(user.google_id, 'new-google-id');
    });

    test('updates updated_at timestamp', async () => {
      const originalUpdatedAt = testUser.updated_at;
      await new Promise(resolve => setTimeout(resolve, 10));

      await dao.update(testUser.id, { name: 'Changed' });
      const user = await dao.findById(testUser.id);
      assert(user);
      assert(user.updated_at > originalUpdatedAt);
    });
  });

  describe('updateSettings', () => {
    test('updates user name', async () => {
      const settings = {
        name: 'Settings Updated',
      };

      await dao.updateSettings(testUser.id, settings);
      const user = await dao.findById(testUser.id);
      assert(user);
      assert.strictEqual(user.name, 'Settings Updated');
    });
  });

  describe('toSessionUser', () => {
    test('converts user to session user format', async () => {
      const userData = await new TestUserBuilder()
        .withEmail('session@example.com')
        .withName('Session User')
        .withGoogleId('google-123')
        .create(db);

      const sessionUser = dao.toSessionUser(userData);

      assert.strictEqual(sessionUser.id, userData.id);
      assert.strictEqual(sessionUser.email, 'session@example.com');
      assert.strictEqual(sessionUser.name, 'Session User');
      assert.strictEqual(sessionUser.google_id, 'google-123');
    });

    test('handles null values', async () => {
      const userData = await new TestUserBuilder()
        .withEmail('null-test@example.com')
        .withName('Null Test User')
        .create(db);

      const sessionUser = dao.toSessionUser(userData);

      assert.strictEqual(sessionUser.google_id, null);
    });
  });

  describe('getSessionUser', () => {
    test('returns session user when exists', async () => {
      const userData = await new TestUserBuilder()
        .withEmail('session@example.com')
        .withName('Session Test User')
        .create(db);

      const sessionUser = await dao.getSessionUser(userData.id);
      assert(sessionUser);
      assert.strictEqual(sessionUser.email, 'session@example.com');
      assert.strictEqual(sessionUser.name, 'Session Test User');
    });

    test('returns null when user does not exist', async () => {
      const sessionUser = await dao.getSessionUser(99999);
      assert.strictEqual(sessionUser, null);
    });
  });
});