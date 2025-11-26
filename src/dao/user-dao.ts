import { injectable, inject } from 'inversify';
import type { Kysely } from 'kysely';
import type { Database, User, SessionUser } from '../db/types';
import { TYPES } from '../core/di-types';

export interface CreateUserData {
  email: string;
  name: string;
  google_id?: string;
}

export interface UpdateUserData {
  name?: string;
  google_id?: string;
}

@injectable()
export class UserDAO {
  constructor(@inject(TYPES.Database) private db: Kysely<Database>) {}

  async findById(id: number) {
    return await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  async findByEmail(email: string) {
    return await this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();
  }

  async findByGoogleId(googleId: string) {
    return await this.db
      .selectFrom('users')
      .selectAll()
      .where('google_id', '=', googleId)
      .executeTakeFirst();
  }

  async create(data: CreateUserData) {
    const result = await this.db
      .insertInto('users')
      .values({
        email: data.email,
        name: data.name,
        google_id: data.google_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .returning(['id'])
      .executeTakeFirst();

    if (!result) {
      throw new Error('Failed to create user');
    }

    return result.id;
  }

  async update(id: number, data: UpdateUserData) {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.google_id !== undefined) updateData.google_id = data.google_id;

    await this.db
      .updateTable('users')
      .set(updateData)
      .where('id', '=', id)
      .execute();
  }

  async updateSettings(id: number, settings: {
    name?: string;
  }) {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (settings.name !== undefined) updateData.name = settings.name;

    await this.db
      .updateTable('users')
      .set(updateData)
      .where('id', '=', id)
      .execute();
  }

  async getSessionUser(id: number): Promise<SessionUser | null> {
    const user = await this.findById(id);
    if (!user) return null;
    return this.toSessionUser(user);
  }

  toSessionUser(user: User): SessionUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      google_id: user.google_id,
    };
  }
}