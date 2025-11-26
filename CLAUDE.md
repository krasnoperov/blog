# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Whitelabel Framework Foundation** - a production-ready starting point for building authenticated web applications on Cloudflare Workers. It provides:

- Multi-user authentication (Google OAuth + JWT)
- Dual-worker architecture (HTTP + background processing)
- Frontend (React 19 + Vite) with landing page, login, and profile
- Database (D1/SQLite) with migrations
- Testing infrastructure
- CLI tool with login/logout

The framework is intentionally minimal - all domain-specific logic has been removed, leaving only the infrastructure needed to build on top of.

## Essential Commands

### Development
```bash
npm run dev                  # Start both frontend (Vite:3002) and worker (Wrangler:8788)
npm run dev:frontend         # Vite dev server only
npm run dev:worker           # Wrangler worker only
```

Access local dev at: https://localhost:3002/

### Testing & Quality
```bash
npm test                     # Run all tests with Node.js test runner
npm run typecheck            # TypeScript type checking
npm run lint                 # ESLint on src/ and scripts/
```

### Database
```bash
npm run db:migrate                # Apply migrations locally
npm run db:migrate:stage          # Apply migrations to stage environment
npm run db:migrate:production     # Apply migrations to production environment
```

Database persists in `.wrangler/state/v3/d1/` for local development.

### Deployment
```bash
npm run deploy:stage              # Deploy main worker to stage
npm run deploy:production         # Deploy main worker to production

# Processing worker (separate deployments)
wrangler deploy --config wrangler.processing.toml                    # Stage
wrangler deploy --config wrangler.processing.toml --env production   # Production
```

### CLI Tool
```bash
npm run cli login                 # Authenticate with the platform
npm run cli logout                # Remove stored credentials
```

## Architecture

### Dual-Worker Architecture (Production/Stage)

**Main Worker** (`src/worker/unified.ts` → `wrangler.toml`)
- Handles HTTP API endpoints (`/api/*`)
- Serves React frontend via Cloudflare Workers Assets
- Queue producer (when queues are added)
- Routes: All paths

**Processing Worker** (`src/worker/processing.ts` → `wrangler.processing.toml`)
- Handles queue consumption (when configured)
- Runs Workflows (when implemented)
- Workflow status endpoint (`/api/workflow/*` when configured)
- Routes: `/api/workflow/*` only

**Why dual workers?** Deploying frontend/API changes won't interrupt long-running background workflows. The separation prevents "Durable Object reset" errors during deployments.

### Local Development (Unified Worker)

In local dev (`wrangler.dev.toml`), everything runs in one worker (`src/worker/unified.ts`):
- HTTP API + Frontend
- Queue consumer (when configured)
- Workflows (when implemented)
- All bindings (D1, KV, Queue, R2, Workflows - as needed)

**Why two servers in dev?** Running Vite (port 3002) and Wrangler (port 8788) separately with Vite proxying API requests ensures proper routing.

### Directory Structure

```
src/
├── api/              # API shared types
├── backend/          # Hono routes, middleware, features
│   ├── features/     # Feature modules (auth, etc.)
│   ├── routes/       # API route handlers
│   ├── services/     # Business logic services
│   ├── utils/        # Backend utilities
│   └── workflows/    # Cloudflare Workflows (with README template)
├── cli/              # CLI tool for platform access
├── core/             # DI container, types, shared config
├── dao/              # Data access objects (Kysely)
├── db/               # Database types and setup
│   └── migrations/   # SQL migrations
├── frontend/         # React app
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── hooks/        # Custom React hooks
│   └── stores/       # Zustand stores
├── shared/           # Shared utilities
│   └── api/          # API client utilities
├── test-utils/       # Testing utilities
└── worker/           # Worker entry points
    ├── unified.ts    # Main worker (local: all, prod: HTTP only)
    └── processing.ts # Processing worker (prod: queue+workflow)
```

### Dependency Injection

Uses InversifyJS with decorators. Container setup in `src/core/container.ts`.

**Key symbols** (`src/core/di-types.ts`):
- `TYPES.Env` - Cloudflare environment bindings
- `TYPES.Database` - Kysely database instance
- `TYPES.UserDAO` - User data access object

**Adding a new service:**
1. Create service class with `@injectable()` decorator
2. Inject dependencies via constructor with `@inject(TYPES.Foo)`
3. Bind in `createContainer()`: `container.bind(ServiceName).toSelf().inSingletonScope()`

### Data Model (D1)

**Tables:**
- `users` - User accounts (Google OAuth)

See commented examples in `db/migrations/0001_initial_schema.sql` for adding domain tables.

### Environment Variables

Required in `.env` (local) and Wrangler secrets (production):
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth
- `OIDC_*` - OIDC/JWT configuration for authentication

Optional (for AI services):
- `GOOGLE_AI_API_KEY` - Google AI/Gemini
- `OPENAI_API_KEY` - OpenAI
- `AI_GATEWAY_URL` - Cloudflare AI Gateway

Set production secrets: `wrangler secret put SECRET_NAME`

### Testing

Tests use Node.js built-in test runner (`node:test`) with `node:assert`.

**Run tests:**
```bash
npm test        # Runs with @swc-node/register for TypeScript support
```

**Test file pattern:** `*.test.ts` files throughout the codebase

### Important Notes

- **Path aliases:** TypeScript path resolution configured in `tsconfig.json`
- **Secrets:** Never commit `.env` files. Use `.env.example` as template
- **Migrations:** Always test migrations locally before deploying to stage/production
- **Custom domains:** Configure in wrangler.toml for your project

### Common Patterns

**Adding a new API endpoint:**
1. Create route handler in `src/backend/routes/`
2. Register in `registerRoutes()` (`src/backend/routes/index.ts`)
3. Add authentication middleware if needed
4. Create corresponding DAO methods if database access required

**Adding a new DAO:**
1. Create class in `src/dao/` with `@injectable()`
2. Inject database: `@inject(TYPES.Database) private db: Kysely<Database>`
3. Bind in container: `container.bind(FooDAO).toSelf().inSingletonScope()`

**Adding database migrations:**
1. Create SQL file in `db/migrations/` with incremental number prefix
2. Test locally: `npm run db:migrate`
3. Deploy to stage: `npm run db:migrate:stage`
4. Deploy to production: `npm run db:migrate:production`

**Adding queues/workflows/R2:**
See commented examples in:
- `wrangler.toml`, `wrangler.processing.toml`, `wrangler.dev.toml`
- `src/core/types.ts` (Env interface)
- `src/backend/workflows/README.md` (workflow template)

## Getting Started

1. **Clone and install:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Fill in your Google OAuth credentials and other secrets
   ```

3. **Initialize database:**
   ```bash
   npm run db:migrate
   ```

4. **Start development:**
   ```bash
   npm run dev
   ```

5. **Add your domain logic:**
   - Create new database tables in a migration
   - Add DAOs for data access
   - Create API routes
   - Build frontend pages
   - Implement workflows/queues as needed

## What's Included

✅ Google OAuth authentication with JWT
✅ User management (profile, sessions)
✅ Dual-worker architecture for scalability
✅ React 19 frontend with Vite
✅ D1 database with migrations
✅ InversifyJS dependency injection
✅ Testing infrastructure
✅ CLI tool foundation
✅ TypeScript throughout

## What's NOT Included (Add as Needed)

- Domain-specific database tables
- Business logic and services
- Queue processing
- Cloudflare Workflows
- R2 file storage
- Additional API endpoints
- Domain-specific frontend pages

This is intentionally a **bare foundation** - start building your application on top of this infrastructure.
