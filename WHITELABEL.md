# Whitelabel Customization Guide

This is a whitelabel framework foundation. Follow these steps to brand it for your project.

## Quick Start

### 1. Replace Project Name

Search and replace across the entire project:

| Find | Replace with |
|------|--------------|
| `whitelabel` | `your-project-name` |
| `Whitelabel` | `Your Project Name` |
| `WHITELABEL` | `YOUR_PROJECT_NAME` |

Key files to update:
- `package.json` - project name
- `wrangler.toml`, `wrangler.processing.toml`, `wrangler.dev.toml` - worker names, database names
- `src/frontend/index.html` - page title
- `src/frontend/pages/ProfilePage.tsx` - brand name
- `src/frontend/pages/LoginPage.tsx` - welcome text
- `CLAUDE.md` - project documentation

### 2. Update Domain

Replace `whitelabel.krasnoperov.me` with your domain:
- `wrangler.toml` - production routes
- `wrangler.processing.toml` - processing worker routes
- `src/cli/lib/config.ts` - CLI base URLs
- `src/backend/features/auth/auth-service.ts` - JWT issuer
- `scripts/auth/import-oidc-keys.sh` - OIDC issuer defaults

### 3. Configure Cloudflare Resources

Create your D1 databases:
```bash
wrangler d1 create your-project-stage
wrangler d1 create your-project-production
```

Update database IDs in `wrangler.toml` and `wrangler.processing.toml`.

### 4. Set Up Authentication

1. Create Google OAuth credentials at https://console.cloud.google.com/
2. Generate OIDC keys:
   ```bash
   openssl ecparam -genkey -name prime256v1 -noout -out private.pem
   openssl pkcs8 -topk8 -nocrypt -in private.pem -out private-pkcs8.pem
   openssl ec -in private.pem -pubout -out public.pem
   ```
3. Update `.env` with your credentials
4. Import secrets to Cloudflare:
   ```bash
   ./scripts/auth/import-oidc-keys.sh stage private-pkcs8.pem public.pem key-1
   ```

### 5. Add Navigation Links

Edit `src/frontend/components/HeaderNav.tsx` to add your app's navigation.

### 6. Clean Up

After customization, delete this file:
```bash
rm WHITELABEL.md
```

## Project Structure

```
src/
├── backend/       # API routes, services, middleware
├── frontend/      # React app
├── dao/           # Data access objects
├── db/            # Database types
│   └── migrations/# SQL migrations
└── worker/        # Cloudflare Worker entry points
```

## Adding Features

1. **Database tables**: Add migrations in `db/migrations/`
2. **API endpoints**: Create routes in `src/backend/routes/`
3. **Frontend pages**: Add to `src/frontend/pages/` and register in `routeStore.ts`
4. **Background jobs**: Uncomment queue/workflow bindings in wrangler configs

See `CLAUDE.md` for detailed development instructions.
