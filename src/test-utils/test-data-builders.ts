import type { Kysely } from 'kysely';
import type { Database, NewUser } from '../db/types';

export class TestUserBuilder {
  private data: Partial<NewUser> = {};

  withId(id: number): this {
    this.data.id = id;
    return this;
  }

  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }

  withGoogleId(googleId: string): this {
    this.data.google_id = googleId;
    return this;
  }

  withName(name: string): this {
    this.data.name = name;
    return this;
  }

  build(): NewUser {
    const now = new Date().toISOString();
    const uniqueNum = Math.floor(Math.random() * 1000000);
    return {
      email: this.data.email || `test-${uniqueNum}@example.com`,
      name: this.data.name || 'Test User',
      google_id: this.data.google_id || null,
      created_at: now,
      updated_at: now
    };
  }

  async create(db: Kysely<Database>) {
    const userData = this.build();
    const result = await db.insertInto('users').values(userData).returningAll().executeTakeFirstOrThrow();
    return result;
  }
}

// --- FUTURE: Add your domain-specific test data builders here ---
// Example:
// export class TestAssetBuilder {
//   private data: Partial<NewAsset> = {};
//
//   withTitle(title: string): this {
//     this.data.title = title;
//     return this;
//   }
//
//   build(): NewAsset {
//     return {
//       id: this.data.id || crypto.randomUUID(),
//       title: this.data.title || 'Test Asset',
//       created_at: Date.now()
//     };
//   }
//
//   async create(db: Kysely<Database>) {
//     const assetData = this.build();
//     const result = await db.insertInto('assets').values(assetData).returningAll().executeTakeFirstOrThrow();
//     return result;
//   }
// }

export const createTestUser = (overrides?: Partial<NewUser>) =>
  new TestUserBuilder().build();