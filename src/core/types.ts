// ============================================================================
// BARE FRAMEWORK FOUNDATION - Environment Types
// ============================================================================
// Define your Cloudflare Workers bindings here

export interface Env {
  // D1 Database
  DB: D1Database;

  // KV Storage
  OAUTH_KV: KVNamespace;

  // Static assets (served via Cloudflare Workers Assets)
  ASSETS: Fetcher;

  // Authentication environment variables
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI?: string;
  OIDC_PRIVATE_KEY_BASE64: string;
  OIDC_PRIVATE_KEY?: string; // Alternative to _BASE64
  OIDC_PUBLIC_KEY?: string;  // Public key for JWT verification
  OIDC_KEY_ID: string;
  OIDC_ISSUER: string;
  OIDC_AUDIENCE: string;
  OIDC_ALLOWED_CLIENT_IDS?: string;

  // AI services (for NanoBananaService and future use)
  GOOGLE_AI_API_KEY?: string;
  AI?: Ai;
  AI_GATEWAY_URL?: string;

  // Optional: OpenAI for future use
  OPENAI_API_KEY?: string;

  // Environment
  ENVIRONMENT?: 'development' | 'stage' | 'staging' | 'production';

  // --- FUTURE: Add your domain-specific bindings here ---
  // Example for queues:
  // MY_QUEUE?: Queue<any>;
  //
  // Example for R2 storage:
  // MY_STORAGE?: R2Bucket;
  //
  // Example for workflows:
  // MY_WORKFLOW?: {
  //   create(options: { id?: string; params: MyWorkflowInput }): Promise<{
  //     id: string;
  //     status(): Promise<any>;
  //   }>;
  //   get(id: string): Promise<{
  //     id: string;
  //     status(): Promise<any>;
  //   }>;
  // };
}
