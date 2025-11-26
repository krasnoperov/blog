/**
 * API Contract Types
 *
 * This module defines the public API contract for all HTTP endpoints.
 * These types represent what the API returns to clients (frontend, CLI, etc.)
 *
 * Guidelines:
 * - These types define the PUBLIC API surface
 * - Clients (frontend, CLI) should ONLY import from this file
 * - Backend can use these for type-safe responses
 * - Built on top of database types but may add/transform fields
 */

// ============================================================================
// BARE FRAMEWORK FOUNDATION
// Add your domain-specific API types here
// ============================================================================

// Example: User profile response
// export type UserProfileResponse = {
//   id: string;
//   name: string;
//   email: string;
// };

// Example: Asset list response (for future implementation)
// export type AssetsListResponse = {
//   assets: Array<{
//     id: string;
//     title: string;
//     imageUrl?: string;
//   }>;
//   total: number;
// };

// Example: Chat response
// export type ChatResponse = {
//   message: string;
//   timestamp: number;
// };
