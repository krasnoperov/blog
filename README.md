# Whitelabel Framework

A production-ready foundation for building authenticated web applications on Cloudflare Workers.

## Features

- **Authentication**: Google OAuth with JWT tokens, OIDC-compliant
- **Dual-Worker Architecture**: Separate workers for HTTP/frontend and background processing
- **React 19 Frontend**: Vite, Zustand, CSS Modules, custom SPA router
- **D1 Database**: SQLite with migrations and Kysely query builder
- **Dependency Injection**: InversifyJS for clean architecture
- **CLI Tool**: Foundation for command-line access to your platform
- **TypeScript**: End-to-end type safety

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your Google OAuth credentials

# Initialize local database
npm run db:migrate

# Start development
npm run dev
```

Access at https://localhost:3002/

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development (frontend + worker) |
| `npm run db:migrate` | Apply database migrations locally |
| `npm test` | Run tests |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | ESLint |
| `npm run deploy:stage` | Deploy to stage environment |
| `npm run deploy:production` | Deploy to production |

## Project Structure

```
src/
├── backend/       # API routes, services, middleware
├── frontend/      # React application
├── dao/           # Data access layer
├── db/migrations/ # SQL migrations
├── cli/           # CLI tool
└── worker/        # Cloudflare Worker entry points
```

## Customization

See [WHITELABEL.md](./WHITELABEL.md) for branding and customization instructions.

## Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed architecture and development guide.

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: React 19, Vite, Zustand
- **Backend**: Hono, InversifyJS, Kysely
- **Auth**: Google OAuth, JWT (jose)
- **Testing**: Node.js test runner

## License

MIT
