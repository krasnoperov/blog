-- Bare Framework Foundation - Initial Schema
-- Creates the minimal tables needed for authentication and user management

-- Users table - core authentication and profile data
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  google_id TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- --- FUTURE: Add your domain-specific tables here ---
-- Example:
-- CREATE TABLE IF NOT EXISTS assets (
--   id TEXT PRIMARY KEY,
--   title TEXT NOT NULL,
--   user_id INTEGER NOT NULL,
--   image_key TEXT,
--   status TEXT DEFAULT 'draft',
--   created_at INTEGER NOT NULL,
--   updated_at INTEGER NOT NULL,
--   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
-- );
