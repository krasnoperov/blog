# CLAUDE.md

This repository is a markdown-driven personal tech blog.

## What Matters

- Public routes are:
  - `/`
  - `/posts`
  - `/posts/:slug`
- Blog post source files live in `src/shared/content/posts/`
- Post metadata is parsed in `src/shared/content/blog-posts.ts`
- The Cloudflare Worker serves SSR HTML plus `/api/health`

## Development

```bash
pnpm run dev
pnpm run build
pnpm run typecheck
pnpm test
```

Frontend dev runs on `http://localhost:3001`.
Worker dev runs on `http://localhost:8788`.

## Editing Guidance

- Keep the public surface lightweight and editorial.
- Prefer static markdown content over database-backed publishing.
- Avoid reintroducing login, profile, app-shell, queue, or processor-worker scaffolding unless the product explicitly needs it again.
