---
title: 'A writing coach on celld'
summary: 'Writing Practice puts each piece in its own Durable Object and lets research and feedback continue after the browser closes.'
publishedAt: 2026-08-12
readingTime: 1 min read
tags: durable-objects, celld, writing-tools, ai-agents
featured: true
---

I built [Writing Practice](https://writing.krasnoperov.me) on `celld` and run it on a Hetzner server. Each piece is a Durable Object with its own SQLite database. Research and feedback run as durable jobs, so they can finish after the browser closes.

```video
/media/celld/writing-practice-on-celld.mp4
/media/celld/writing-practice-on-celld-poster.jpg
Writing Practice — a persistent writing coach on celld
```

The coach brings sources, questions, and margin notes, but never writes into the draft.

[Source code](https://github.com/krasnoperov/celld-writing-practice)
