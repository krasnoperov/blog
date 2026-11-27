---
title: 'The orchestrator moved into the session'
summary: "Claude Code now plans and delegates much of the work I previously split into Linear issues. review-quill and merge-steward still check and land the resulting PRs."
publishedAt: 2026-10-08
readingTime: 3 min read
tags: software-factory, patchrelay, agentic-development, claude-code, review-quill, merge-steward
featured: true
---

In [the last factory post](/posts/gates-not-autonomy), I wrote that I delegated well-specified tasks and kept exploratory work interactive. Since Opus 5.5, I mostly describe the work to a Claude Code session and let it plan the tasks too.

```image
/media/posts/orchestrator-moved-into-the-session.webp
Many threads gather into one loop; a single line leaves it through two gates.
```

## Planning inside the session

patchrelay delivered a couple of thousand PRs for me. I could write a Linear issue, delegate it, and come back to an implemented change. Before that could happen, though, I had to turn the idea into issues and decide their order so dependent branches wouldn't race into the queue.

The main Claude Code session now does that breakdown. It starts subagents for work that can run in parallel, calls Codex for an independent review, and runs evals where needed. Adjacent work becomes a separate task chip that the main session can continue talking to.

Planning and execution share the conversation. When a requirement has two plausible interpretations, I can answer while the work is being planned, instead of discovering the choice in a finished diff.

I had expected Codex desktop, where I keep my chats, to become the place I did this. In my work, Claude Code got there first: its main session was handling planning and review as part of delivering a change. That reduced how often I needed patchrelay's separate orchestration.

## Independent review

Every PR still goes through `review-quill`, including work the main session has already asked Codex to review.

Since the last post, I built the reviewer eval suites I'd been putting off. They exposed a recurring problem: the reviewer raised scaling concerns about features still looking for product-market fit. I wanted it to weigh the finding against the product's current needs, rather than demand capacity for traffic it didn't have.

That tuning reduced noise. The reviewer still finds assumptions and interactions the implementing session missed. A separate process with its own prompt remains useful even when the author has already reviewed the diff.

## Landing and CI

`merge-steward` still tests approved changes as they would exist on `main` and lands the tested result. Moving planning into the agent session hasn't required changing the queue.

GitHub Actions is the part I'd still consider replacing. My server has room to run several pipelines, but getting that capacity used concurrently requires managing enough runners. In my setup, jobs spend more time queued than I want. I haven't yet found the gain large enough to justify replacing Actions.

I now spend less time decomposing issues and more time discussing the work with the main session. The reviewer and merge queue serve both that workflow and the remaining delegated jobs. The next infrastructure question for me is whether fixing CI scheduling is worth taking on another service.

## Related

- [The gates, not the autonomy](/posts/gates-not-autonomy)
- [From YOLO to patchrelay](/posts/from-yolo-to-patchrelay)
- [patchrelay: Linear issues in, pull requests out](/posts/patchrelay)
- [review-quill: a strict reviewer for your coding agent](/posts/review-quill)
- [merge-steward: speculative integration, parallel validation, fast-forward landing](/posts/merge-steward)
