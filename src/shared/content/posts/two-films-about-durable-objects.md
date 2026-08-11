---
title: 'I asked GPT-5.6 to explain Durable Objects'
summary: 'Ryan Dahl published celld, a self-hosted Durable Objects runtime. I already use the model; an implementation that can live inside custom systems was a good reason to explain the ideas behind it.'
publishedAt: 2026-08-11
readingTime: 3 min read
tags: durable-objects, celld, distributed-systems, gpt-5.6, remotion
featured: true
---

At the beginning of August I saw Ryan Dahl publish [`celld`](https://github.com/denoland/celld) under the Deno organization. The [initial commit](https://github.com/denoland/celld/commit/44cec221c6d40eaa2c7cf064ff4b22bb58f7cc8b) also credits Yusuke Tanaka and William Perron.

`celld` is an open-source daemon for running Cloudflare Workers and Durable Objects on machines I control. Each named object has its own SQLite database. The process serving it is replaceable; state is backed by an S3-compatible bucket, and records in that bucket determine the current owner. A standalone fleet needs no separate membership controller or consensus service.

I already use Durable Objects actively, so a separate implementation was good news. It makes the model available inside custom systems and provides a credible path away from depending on one vendor. I suspect that is good for Cloudflare too: it removes one reason not to adopt Durable Objects in the first place.

That made the release a good reason to talk about the ideas behind the model. Application code gets a stable object boundary: one address, local state, one place where state-changing decisions are ordered. The runtime has to preserve it while processes stop, nodes disappear, connections move, and alarms wake an object that is no longer resident anywhere.

I asked GPT-5.6 to turn that explanation into video, then kept directing it. Early versions had crowded diagrams, broken layouts, and too many ideas on screen at once, so I narrowed the brief and rolled back a few wrong turns. The result is not perfect, but it is not a disaster either. This is roughly where an agent video director was in August 2026: able to write scripts and Remotion scenes, still dependent on human direction and final judgement.

## The programming model

The first film stays outside the implementation. It starts with a named entity, then works through identity, process lifetime, ordered decisions, local SQLite storage, alarms, and the boundary where a Durable Object stops being the right tool.

```video
/media/celld/durable-objects-explained.mp4
/media/celld/durable-objects-explained-poster.jpg
Film 1 — Durable Objects, explained
```

## The implementation underneath

The second film starts from the three properties the first one leaves behind: a stable address, durable state across processes, and a single authoritative writer. It then follows the current `celld` implementation through SQLite replication, conditional ownership updates, node records, fencing, routing, and recovery after a node disappears.

```video
/media/celld/durable-objects-under-the-hood.mp4
/media/celld/durable-objects-under-the-hood-poster.jpg
Film 2 — Durable Objects, under the hood
```

This was also where the fact-checking mattered. One tidy version left an active arrow from a dead node to the bucket; another showed a successful connection before the runtime had found the current owner. Both looked plausible at normal playback speed. Neither described the code.

GPT-5.6 wrote and revised the scripts and Remotion source under my direction; the English narration is synthetic. I chose the level of detail, what needed a source, and what to remove.

These films are not documentation. The first covers the Durable Object model. The second is a visual reading of `celld` v0.1.0 at commit [`553ae73`](https://github.com/denoland/celld/commit/553ae73f83c87c3f7c7a5f73c32c2211d9d7341f), while its runtime and compatibility surface are still evolving.

The useful test now is whether `celld` can grow into something teams embed in custom systems without turning the Durable Object boundary into a compatibility matrix. That will decide whether it becomes a real portability layer rather than an interesting second implementation.
