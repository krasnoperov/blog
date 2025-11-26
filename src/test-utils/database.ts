import { Kysely, sql } from 'kysely';
import { SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import type { Database as DatabaseSchema } from '../db/types';

export async function createTestDatabase(): Promise<Kysely<DatabaseSchema>> {
  const sqlite = new Database(':memory:');

  const db = new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: sqlite,
    }),
  });

  await sql`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      google_id TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `.execute(db);

  // --- FUTURE: Add your domain-specific test tables here ---
  // Example:
  // await sql`
  //   CREATE TABLE assets (
  //     id TEXT PRIMARY KEY,
  //     title TEXT NOT NULL,
  //     user_id INTEGER NOT NULL,
  //     created_at INTEGER NOT NULL,
  //     FOREIGN KEY (user_id) REFERENCES users(id)
  //   )
  // `.execute(db);

  return db;
}

export async function cleanupTestDatabase(db: Kysely<DatabaseSchema>) {
  await db.deleteFrom('users').execute();
  // --- FUTURE: Add cleanup for your domain tables here ---
  // Example:
  // await db.deleteFrom('assets').execute();

  await db.destroy();
}
