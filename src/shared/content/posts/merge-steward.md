---
title: 'merge-steward: a self-hosted merge queue without the Enterprise gate'
summary: Parallel agents produce parallel pull requests that break each other on integration. merge-steward is a self-hosted serial speculative merge queue — every merge tested against the live tip of main, no Enterprise gate, structured failure reasons an agent can read.
publishedAt: 2026-04-29
readingTime: 6 min read
tags: software-factory, patchrelay, merge-steward, merge-queue
featured: false
---

The first time I had four agents running in parallel against the same repo, I lost an afternoon to merge collisions. Three branches were each green on their own and `main` would not compile after I merged them. The fourth had been rebasing against a `main` that moved twice while it was rebasing. "Green yesterday, broken today" stopped being a saying and became Tuesday.

The fix is well-understood: a merge queue. Land each PR after a fresh CI run on the *integrated* SHA — `main` plus the PR's diff — not on the PR's branch in isolation. GitHub ships a native one. For private repos it requires GitHub Enterprise Cloud, and "buy GitHub Enterprise Cloud so my one-person micro-corporation can land merges cleanly" was not a sentence I was going to say.

So I built one. **merge-steward** is a serial, self-hosted speculative merge queue. It puts chaotic parallel work into an order, tests every merge against the live tip of `main`, and only fast-forwards when that tested SHA is still valid. The rest of this post is why and how — including the measurement that finally pushed me to extract it from patchrelay in the first place.

## What merge-steward does for you

When a PR is approved and its required checks are green, merge-steward admits it to the queue. Once it reaches the head of the queue, the steward builds a *speculative branch* — `main` plus the PR's diff, on a new SHA, pushed up. CI runs on that integrated SHA. Only if that tested SHA is still valid — `main` hasn't moved out from under it, the integrated build is green — does the steward fast-forward `main` to the speculative SHA.

That single property fixes "green yesterday, broken today." Two PRs that both pass CI individually can still break each other on integration. Speculative integration asks the question "what would the world look like if this PR landed right now?" and only lands it if the answer is green.

The win from going to a real merge queue, even a simple one, is bigger than I expected. Most of the day-to-day failures I used to handle by hand — the rebases, the speculative re-fetches, the "is this a flake or a real fail" branching — are now handled by the steward as a side effect of being a queue at all.

## Why this had to be its own service

Patchrelay's first version managed PR merges itself. The agent would push a branch, wait for CI, fix what came back, rebase against `main`, retry on conflicts, and eventually merge. That was the design until I actually counted what the agent was doing all day.

In late March I went through a window of work — Linear issues `USE-84` through `USE-101`, 232 recorded patchrelay runs across that batch — and classified each run by what it was actually trying to accomplish. 173 of them were infrastructure churn. Rebases against a moving `main`. Retries after a flake. Re-fetches after a webhook missed. Queue-shuffling because two PRs both wanted to land first.

74.6% of my Codex runs were doing work an LLM should not be doing.

The model is bad at deterministic queue control. It doesn't have a stable mental picture of "what just changed and what should happen next" across a batch of PRs. It works one run at a time, from whatever context I hand it, and a merge queue is exactly the kind of process where the global state — what's being validated right now, what's queued behind it, what just landed — matters more than any single decision. Asking the model to make these decisions one at a time was burning tokens, time, and my own attention on something that wanted to be a small finite-state machine.

Merge-queue logic is a deterministic control problem. It belongs in a service that does nothing else.

## The merge queues people have already built

The merge queue is one of the most-rebuilt pieces of infrastructure in our industry, and there's a deep public archive of how to do it. I spent a few days reading. The shortlist:

- [bors-ng](https://github.com/bors-ng/bors-ng) — the open-source ancestor of most modern merge queues. Builds a staging branch on top of `main`, runs CI against it, fast-forwards on green. Batches PRs together by default and bisects when CI fails on a batch. Simple, durable, well-understood; the closest existing fit to what I wanted.
- **GitLab merge trains.** Up to 20 parallel pipelines per train, evict-and-restart on failure (when one MR fails, every later pipeline restarts against the new train head). Wasteful but works at GitLab's scale, where trains are typically short.
- **Shopify's internal merge queue.** Reconciliation-loop architecture borrowed from React's Virtual DOM: declare the desired state, let the loop drive the world toward it, tolerate flakies with a configurable threshold. This is the architectural model I ended up adopting.
- **Uber's SubmitQueue / BLRD.** Speculation engine with probabilistic models and a target-hash conflict analyzer. After enabling BLRD in mid-2023, Uber reported a 74% reduction in P95 wait time. Heavyweight and inspirational; not what I would build first.
- **Mergify, Aviator, Trunk Merge Queue, Graphite.** Various commercial takes — speculative checks, batch bisection, affected-targets parallel mode, stack-aware queues. Each has at least one idea worth stealing. (Kodiak was the open-source contender in this lane; it's effectively unmaintained as of 2026.)

The decision matrix collapsed quickly. I needed self-hosted, restart-safe, and structured failure reasons an agent can read and react to. None of the SaaS options fit the self-hosting requirement. bors-ng was the closest existing fit, but I wanted speculative integration eventually, and bolting that onto the bors-ng staging-branch model felt worse than building from scratch with the right shape from the start.

## What's inside merge-steward

The shape I committed to: separate service, one binary, SQLite for state, GitHub statuses as the only coupling to anything else.

### Reconciliation, not orchestration

The steward isn't an orchestrator that walks a state machine. It is a reconciler. There's a desired state — this set of approved PRs, in this order, on this base SHA — and an observed state — what's actually on GitHub right now — and the loop's job is to push observed toward desired without losing its place if it crashes mid-step.

This is the Shopify-style design and it has one important consequence: every operation has to be safe to retry from any partial state. Pushing a speculative branch, triggering CI, fast-forwarding `main`, evicting a PR — each of those is idempotent or it's a bug. SQLite is the source of truth for the queue itself; GitHub is the source of truth for everything I don't own.

The reconciliation model makes restarts cheap. The steward can be killed mid-merge, restarted, and figure out from observed state where it left off. That property mattered more than I thought it would; in the first month of running merge-steward I redeployed it eight or nine times, and each time it picked up the queue exactly where it had been.

### Structured eviction

When a PR can't make it through the queue — speculative CI fails, retry budget exhausted, conflict that can't be auto-resolved — the steward evicts it and writes a structured incident: a GitHub check run on the PR with a stable failure reason in a known schema. An agent reading the check sees `queue eviction, reason: ci_red on speculative SHA, last green: <hash>` rather than "queue said no, good luck."

The agent can decide what to do with that. A flake gets a retry. A real failure gets a code change. A conflict gets a rebase. The steward doesn't care; it just publishes facts an agent can act on.

## What it doesn't try to be

The thing that has kept merge-steward stable is that it doesn't attempt anything I don't already know how to debug at 11pm. It is serial, not parallel. The only speculation is one PR at a time. There's no batch bisection, no affected-targets analysis, no probabilistic conflict prediction. Those are good ideas in the survey above. They are not in v1, and most of them won't be in v2 either.

The cost of going serial is throughput. A strictly serial queue with 15-minute CI completes about 32 merges in an 8-hour window. That's fine for me today and would be fine for a small team; the day a repo on this queue starts pushing past that ceiling is the day to revisit batching.

I'll build my own merge queue. With worktrees, and webhooks. (There. Now it's in writing.)

## Try it

merge-steward is independently usable — no patchrelay required, no review-quill required. Install on the box you want it to run on:

```
npm install -g merge-steward
merge-steward init https://queue.example.com
merge-steward attach owner/repo --base-branch main
```

If you drive your own coding agent (Claude Code, Cursor, Codex CLI), the [`ship-pr`](https://github.com/krasnoperov/patchrelay-agents) skill teaches the agent to block on `merge-steward pr status --wait`, read structured failure reasons, fix the code, push, and re-enter the wait — no polling loop, no LLM-judged "is it done yet?".

Source and docs: [github.com/krasnoperov/patchrelay/tree/main/packages/merge-steward](https://github.com/krasnoperov/patchrelay/tree/main/packages/merge-steward).

## Related

- [patchrelay: a Linear-driven harness for Codex](/posts/patchrelay)
- [review-quill: a strict reviewer for your coding agent](/posts/review-quill)
- [From YOLO to patchrelay](/posts/from-yolo-to-patchrelay)
