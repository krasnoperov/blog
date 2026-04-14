# AGENTS.md — Krasnoperov Blog

Canonical entrypoint for coding agents in this repository.

## What This Repo Is

This is a markdown-first personal tech blog.

The public surface is intentionally small:

- `/`
- `/posts`
- `/posts/:slug`

Post source files live in `src/shared/content/posts/`.

## Source Of Truth

- Review Quill may review this repo, but issue scope and working notes should still live outside the repo.
- This repo owns stable implementation policy, routes, content layout, and verification commands.
- Do not turn repo docs into a backlog or scratchpad.

## Read In This Order

1. `README.md`
2. `REVIEW_WORKFLOW.md`
3. `IMPLEMENTATION_WORKFLOW.md`

## Core Commands

```bash
npm run dev
npm run build
npm test
npm run typecheck
npm run lint
npm run test:ui:local
```

## Hard Rules

- Keep the blog markdown-first and editorial.
- Avoid reintroducing login, profile, app-shell, queue, or processor-worker scaffolding unless a task clearly requires it.
- Keep route behavior, metadata, and content rendering simple and verifiable.
