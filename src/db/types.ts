import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

// ============================================================================
// BARE FRAMEWORK FOUNDATION - Database Types
// ============================================================================
// This file contains only the core user management types.
// Add your domain-specific tables and types here when building your application.

export interface UsersTable {
  id: Generated<number>;
  email: string;
  name: string;
  google_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  users: UsersTable;
  // --- FUTURE: Add your domain tables here ---
  // Example:
  // assets: AssetsTable;
  // jobs: JobsTable;
}

// User types
export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

// Session user (non-sensitive fields for JWT/client)
export interface SessionUser {
  id: number;
  email: string;
  name: string;
  google_id: string | null;
}
