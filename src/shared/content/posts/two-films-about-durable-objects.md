---
title: 'Running Durable Objects on your own infrastructure with celld'
summary: 'Ryan Dahl published celld, an open-source Durable Objects runtime that can be embedded in custom systems. I made two short films about the model and the implementation.'
publishedAt: 2026-08-11
readingTime: 1 min read
tags: durable-objects, celld, distributed-systems, gpt-5.6, remotion
featured: true
---

Earlier this month, Ryan Dahl released [`celld`](https://github.com/denoland/celld), with work by Yusuke Tanaka and William Perron.

I use Durable Objects actively, so an independent implementation is good news. `celld` runs Workers and Durable Objects on infrastructure I control, making the model usable in custom systems without locking them to one vendor. That portability may help Cloudflare too: it removes a reasonable objection to adopting the model.

Durable Objects give each named entity a stable place for state and decisions.

I asked GPT-5.6 to make two videos about the model and `celld`'s implementation, then directed the scripts, diagrams, and pacing until they were ready to publish.

## The programming model

The first film covers the programming model: identity, process lifetime, ordered decisions, local storage, alarms, and the boundary where a Durable Object stops being the right tool.

```video
/media/celld/durable-objects-explained.mp4
/media/celld/durable-objects-explained-poster.jpg
Film 1 — Durable Objects, explained
```

## The implementation underneath

The second film follows `celld` v0.1.0 at commit [`553ae73`](https://github.com/denoland/celld/commit/553ae73f83c87c3f7c7a5f73c32c2211d9d7341f): SQLite replication, conditional ownership updates, fencing, routing, and recovery after a node disappears.

```video
/media/celld/durable-objects-under-the-hood.mp4
/media/celld/durable-objects-under-the-hood-poster.jpg
Film 2 — Durable Objects, under the hood
```
