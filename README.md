# Krasnoperov Blog

A personal tech blog reshaped from an internal starter foundation into a markdown-first publishing surface.

## Current Focus

The first wave of posts is about building a software factory: the systems, automations, control planes, and feedback loops that convert ideas into delivered software.

## Structure

- Posts live as static markdown files in `src/shared/content/posts/`
- Frontmatter stores title, summary, date, reading time, tags, and featured state
- Markdown supports fenced code blocks and Mermaid diagrams
- Routes are just `/`, `/posts`, and `/posts/:slug`
- A single Cloudflare Worker serves SSR HTML and a tiny `/api/health` endpoint

## Quick Start

```bash
npm install
npm run dev
```

`npm run dev` prepares the SSR bundle for the worker, then starts the frontend and worker dev servers.
The local frontend opens at `http://localhost:3001`.
