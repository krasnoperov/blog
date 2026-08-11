---
title: 'I asked GPT-5.6 to explain Durable Objects'
summary: 'Ryan Dahl published celld, a self-hosted Durable Objects runtime. I wanted to understand how the model and the implementation fit together, so I asked GPT-5.6 to make two films — and kept sending the first versions back.'
publishedAt: 2026-08-11
readingTime: 4 min read
tags: durable-objects, celld, distributed-systems, gpt-5.6, remotion
featured: true
---

At the beginning of August I saw Ryan Dahl publish [`celld`](https://github.com/denoland/celld) under the Deno organization. The [initial commit](https://github.com/denoland/celld/commit/44cec221c6d40eaa2c7cf064ff4b22bb58f7cc8b) also credits Yusuke Tanaka and William Perron. I opened the repository because the design looked small enough to understand in one sitting, which is usually how I lose the rest of a day.

`celld` is an open-source daemon that runs Cloudflare Workers and Durable Objects on machines I control. Each object has a name and its own SQLite database. The process serving it is replaceable; its state is replicated to an S3-compatible bucket, and nodes use records in that bucket to decide which one currently owns the object. There is no separate membership controller or consensus service in a standalone fleet.

The part that caught me was the separation between the programming model and the machinery beneath it. Application code gets a stable object boundary: one address, local state, one place where state-changing decisions are ordered. The runtime has to preserve that boundary while processes stop, nodes disappear, connections move, and alarms wake an object that is no longer resident anywhere.

I asked GPT-5.6 to turn that into a video.

The first result was not close. Labels sat on borders, captions covered diagrams, and one slide tried to show a lost update and its fix at the same time. I asked the model to inspect every frame; it declared frames clean that were visibly broken. I rolled back, simplified the visual system, split the explanation into two films, and kept the model on one level of detail at a time.

That took several passes. These are the two that survived.

## The programming model

The first film stays outside the implementation. It starts with a named entity, then works through identity, process lifetime, ordered decisions, local SQLite storage, alarms, and the boundary where a Durable Object stops being the right tool.

```video
/media/celld/durable-objects-explained.mp4
/media/celld/durable-objects-explained-poster.jpg
Film 1 — Durable Objects, explained
```

The useful constraint was to keep one question on screen at a time. A Durable Object is already an unusual bundle of ideas; adding leases, epochs, WAL replication, and object-storage semantics before the object itself is clear only makes the explanation sound complete while making it harder to follow.

## The implementation underneath

The second film starts from the three properties the first one leaves behind: a stable address, durable state across processes, and a single authoritative writer. It then follows the current `celld` implementation through SQLite replication, conditional ownership updates, node records, fencing, routing, and recovery after a node disappears.

```video
/media/celld/durable-objects-under-the-hood.mp4
/media/celld/durable-objects-under-the-hood-poster.jpg
Film 2 — Durable Objects, under the hood
```

This was also where the fact-checking mattered. A diagram can be tidy and still tell the wrong story. In one version a dead node kept an active arrow to the bucket. In another, a successful connection appeared before the runtime had found the current owner. Both looked plausible at normal playback speed. Neither described the code.

GPT-5.6 wrote and revised the scripts and Remotion source under my direction. The English narration is synthetic. I decided what needed a source, which explanation was too detailed, which slide needed to be removed, and when the safest move was to return to an earlier version. It was closer to editing a technical article than asking for a finished film.

These films are not documentation. The first is about the Durable Object model and should age slowly. The second is a visual reading of `celld` v0.1.0 at commit [`553ae73`](https://github.com/denoland/celld/commit/553ae73f83c87c3f7c7a5f73c32c2211d9d7341f); the repository says its runtime and compatibility surface are still evolving.

I want to see whether the design stays this easy to explain as the implementation grows. If the next version needs twice as many boxes to preserve the same three properties, that will be useful evidence too.
