---
title: 'Durable Objects beyond Cloudflare with celld'
summary: 'celld brings the Durable Objects model to compatible infrastructure beyond Cloudflare. Two short videos explain the model and the runtime beneath it.'
publishedAt: 2026-08-11
updatedAt: 2026-08-13
readingTime: 1 min read
tags: durable-objects, celld, distributed-systems, gpt-5.6, remotion
featured: true
---

Ryan Dahl released [`celld`](https://github.com/denoland/celld), built with Yusuke Tanaka and William Perron. It brings Workers and Durable Objects to compatible infrastructure beyond Cloudflare, making the model useful in custom systems and easier to adopt without fear of vendor lock-in.

A Durable Object starts with a simple boundary: one named entity, its state, and the decisions that change it. The process serving the object can disappear; the object remains.

What does that change when designing a system? Start with this boundary and follow it far enough to see where it helps—and where it should end.

```video
/media/celld/durable-objects-explained.mp4
/media/celld/durable-objects-explained-poster.jpg
Durable Objects, explained
```

## Keeping the promise

The runtime has a harder job: preserve that abstraction across replaceable processes and machines. `celld` is one answer. Follow a Durable Object through a failure and see how it continues elsewhere.

```video
/media/celld/durable-objects-under-the-hood.mp4
/media/celld/durable-objects-under-the-hood-poster.jpg
Durable Objects, under the hood
```

GPT-5.6 made both videos as animated Remotion slide shows under my direction.

I also used `celld` to build [Writing Practice](/posts/writing-practice-on-celld), a writing agent running on Hetzner.
