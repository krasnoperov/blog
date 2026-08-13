---
title: 'Durable Objects for agentic work'
summary: 'Writing Practice explores why Durable Objects fit agentic work that combines persistent state, ordered decisions, and background jobs.'
publishedAt: 2026-08-12
updatedAt: 2026-08-13
readingTime: 2 min read
tags: durable-objects, celld, writing-tools, ai-agents
featured: true
---

Agentic work rarely fits inside one HTTP request. A model call may take time, fail, need a retry, or finish after the browser closes. The application has to remember what the agent was doing, which version of the work it saw, and whether a result has already been applied.

[Writing Practice](https://writing.krasnoperov.me) uses one named Durable Object for each piece. Its brief, draft, notes, snapshots, and small job queue live together. All state-changing requests for a piece run through the same object, and an alarm wakes it when work is due. The process serving the object may disappear; `celld` can restore it and continue elsewhere. This deployment runs on a Hetzner server.

In a conventional stateless Node.js application, the same system would usually be assembled from a web process, a database, a job queue, a scheduler, and workers. Application code would then coordinate them with locks or conditional writes, job leases, retry rules, and recovery for abandoned work. That approach is familiar and can work well. The Durable Object changes the unit of coordination: one piece already has an identity, private durable state, ordered decisions, and a durable wake-up.

This does not make model calls exactly-once. Writing Practice still gives jobs stable identities, leases each attempt, stores returned output before applying it, and defines its own retry policy. The advantage is that these rules have one serialized, durable home instead of being spread across several services. The model API and billing remain external services; the Durable Object owns the local workflow around those calls.

The walkthrough shows this boundary in use: research begins with a piece, continues after the browser closes, and returns as questions and notes beside the draft.

```video
/media/celld/writing-practice-on-celld.mp4
/media/celld/writing-practice-on-celld-poster.jpg
Writing Practice — a persistent writing coach on celld
```

The pattern is not specific to writing. It fits agentic tasks with a natural identity, local memory, ordered decisions, and work that must resume after a process ends.

[Source code](https://github.com/krasnoperov/celld-writing-practice)
