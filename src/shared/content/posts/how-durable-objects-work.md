---
title: 'How Durable Objects work'
summary: 'celld brings the Durable Objects model to compatible infrastructure beyond Cloudflare. Two short videos explain the model and the runtime beneath it.'
publishedAt: 2026-08-11
updatedAt: 2026-08-13
readingTime: 1 min read
tags: durable-objects, celld, distributed-systems, gpt-5.6, remotion
featured: true
---

I made two videos about Durable Objects after Ryan Dahl released [`celld`](https://github.com/denoland/celld), which brings the Workers and Durable Objects model to compatible infrastructure beyond Cloudflare.

The first explains the model: a named entity keeps its state even when the process serving it is replaced.

```video
/media/celld/durable-objects-explained.mp4
/media/celld/durable-objects-explained-poster.jpg
Durable Objects, explained
```

## The runtime

The second follows an object through a failure and shows how `celld` continues serving it elsewhere.

```video
/media/celld/durable-objects-under-the-hood.mp4
/media/celld/durable-objects-under-the-hood-poster.jpg
Durable Objects, under the hood
```

GPT-5.6 made both videos as animated Remotion slide shows under my direction.

[Writing Practice](/posts/a-writing-agent-with-durable-objects) applies the model to agentic work, with one Durable Object per long-lived writing task.
