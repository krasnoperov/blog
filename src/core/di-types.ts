export const TYPES = {
  // Environment binding
  Env: Symbol.for('Env'),

  // Database binding
  Database: Symbol.for('Database'),

  // DAO symbols
  UserDAO: Symbol.for('UserDAO'),

  // --- FUTURE: Add your DAO symbols here ---
  // Example:
  // AssetDAO: Symbol.for('AssetDAO'),
  // JobDAO: Symbol.for('JobDAO'),

  // For classes, we use the class constructor directly
  // This file only contains symbols for non-class bindings
} as const;
