---
title: 'I do not want to scale code review'
summary: Manual review is the wrong loop to scale when agents are producing the code. The useful question is how to scale verification: product checks, review automation, and enough captured intent that agents keep moving in the right direction.
publishedAt: 2026-05-18
readingTime: 3 min read
tags: software-factory, patchrelay, review-quill, code-review
featured: false
---

Once a few agent runs are in flight, code review volume looks like the next bottleneck.

Honest answer: I am trying not to deal with it. The goal is for me to not be in that loop at all. Reviewing every PR by hand does not scale, so the faster I can deliver code reliably without me on the critical path, the better.

The auto review/repair cycle gets me most of the way there. `review-quill` catches the mechanical stuff, then PatchRelay, or plain Codex/Claude, fixes it. What lands is at least operational, and usually already through a few rounds of adversarial review.

Since early April, my local `review-quill` database has 3,913 review attempts across 1,309 PRs. It approved 1,579 attempts and requested changes 2,131 times. PatchRelay has recorded 2,709 runs across 729 issues; `review_fix` is the single biggest non-implementation category, with 987 runs.

That sounds like a lot of review. The important part is that most of it did not require me.

The harder constraint now is not agent throughput. It is direction and validation. It is easy to run a lot of agents in parallel, but they can also confidently steer a project somewhere subtly wrong, and that is not something I can reliably catch by looking at the code alone.

So I am trying to shift attention from "how do I review all this code?" to "how do I test that the product still looks, feels, and behaves right?"

That part is still open. With `usertold.ai` still in beta, I am not quite there yet. The missing piece is product-level verification: flows, screenshots, behavior checks, and enough explicit taste and intent that agents optimize in the right direction instead of merely producing plausible diffs.

In the meantime, better PR review tooling would still help. Not another file-by-file diff viewer, but something that makes the important change visible quickly. GitHub is very good at showing what changed. At agent scale, I mostly want help seeing what matters.
