---
title: 'Two films about Durable Objects and celld'
summary: 'Ryan Dahl published celld, an open-source Durable Objects runtime that can be embedded in custom systems. I made two short films about the model and the implementation.'
publishedAt: 2026-08-11
readingTime: 2 min read
tags: durable-objects, celld, distributed-systems, gpt-5.6, remotion
featured: true
---

At the beginning of August I saw Ryan Dahl publish [`celld`](https://github.com/denoland/celld) under the Deno organization. The [initial commit](https://github.com/denoland/celld/commit/44cec221c6d40eaa2c7cf064ff4b22bb58f7cc8b) also credits Yusuke Tanaka and William Perron.

I use Durable Objects actively, so an independent implementation is good news. `celld` is an open-source daemon for running Workers and Durable Objects on machines I control, which means the model can become part of a custom system instead of remaining available from one vendor. That portability is likely good for Cloudflare too: it removes a reasonable objection from teams that like the programming model but do not want their architecture to depend on a single provider.

The model gives application code a durable boundary around a named object: one address, local state, and one place where state-changing decisions are ordered. In `celld`, each object has its own SQLite database. The process serving it is replaceable; state is backed by an S3-compatible bucket, and records in that bucket determine the current owner. A standalone fleet needs no separate membership controller or consensus service.

The release seemed like a good reason to explain both halves: the programming model I work with, and one implementation underneath it. I asked GPT-5.6 to make the videos and kept directing the scripts, diagrams, and pacing until they were ready to publish. The two films below are a small snapshot of agent video direction in August 2026.

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
