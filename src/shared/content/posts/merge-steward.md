---
title: 'merge-steward: speculative integration, parallel validation, fast-forward landing'
summary: merge-steward is a self-hosted merge queue with three decisions — test every PR on `main + diff`, validate cumulative speculative chains in parallel, and fast-forward `main` to the exact tree CI ran against.
publishedAt: 2026-04-29
readingTime: 6 min read
tags: software-factory, patchrelay, merge-steward, merge-queue
featured: false
---

The first time I had four agents running in parallel against the same repo, I lost an afternoon to merge collisions. Three branches were each green on their own and `main` wouldn't compile after I merged them. The fourth had been rebasing against a `main` that moved twice while it was rebasing. Each branch had passed CI on its own diff; nothing had tested the combined state.

The fix is well-understood: a merge queue. Land each PR after a fresh CI run on the *integrated* SHA — `main` plus the PR's diff — not on the branch in isolation. GitHub ships a native one, but for private repos it requires GitHub Enterprise Cloud, which was out of reach for a one-person setup.

So I built one. **merge-steward** is a self-hosted merge queue, and its design comes down to three decisions:

1. **Test the integrated tree, not the branch.** CI runs on `main + PR diff`, never on the PR branch alone. A green review on the branch is necessary but not sufficient.
2. **Validate in parallel through a cumulative spec chain.** Landing is serial; validation isn't. The head's spec is `main + A`, the next is `main + A + B`, the next is `main + A + B + C`. All of them run CI concurrently. When A lands, B's spec is already the tested tree.
3. **Fast-forward `main` to the spec.** The "merge" is `git push origin <spec-sha>:main`. What lands on `main` is byte-for-byte the tree CI validated, and `main`'s history stays linear.

## Decision 1 — Test the integrated tree

When a PR is approved and its required checks are green, merge-steward admits it to the queue. Once it reaches the head, the steward builds a *speculative branch* — `main` plus the PR's diff, on a new SHA, pushed up. CI runs on that integrated SHA. Only if the tested SHA is still valid — `main` hasn't moved out from under it, the integrated build is green — does the steward fast-forward `main` to it.

Two PRs that both pass CI individually can still break each other on integration. Speculative integration asks "what would the world look like if this PR landed right now?" and lands the PR only if the answer is green.

Going to a real merge queue paid off bigger than I expected. Most of the day-to-day failures I used to handle by hand — rebases, speculative re-fetches, "flake or real fail?" branching — are now handled by the steward as a side effect of being a queue at all.

## Decision 2 — Validate in parallel

The queue is serial, but validation isn't. Each entry is tested on a **cumulative speculative branch** that stacks every entry ahead of it in the queue: the head's spec is `main + A`, the next is `main + A + B`, the next is `main + A + B + C`. CI runs on each spec independently and concurrently.

That gives the queue two properties that matter:

- **Throughput.** A strictly serial validate-then-land queue tops out at one CI cycle per merge. The cumulative chain lets a five-deep queue have five CI runs in flight simultaneously, with the next merge ready the moment the head's spec finishes.
- **No re-validation when the queue advances.** When A lands, B's spec is already `main + A + B`, which is now `current main + B`. That's the tree that just finished CI. The steward fast-forwards through it without rebuilding.

When A *fails* mid-queue, B and C invalidate and rebuild without it (**cascade invalidation**). The cost of that is one CI cycle per downstream entry — paid only when the head fails, not on every merge.

One refinement worth naming: when a queue entry's PR head is force-pushed to a SHA that produces the same `patch_id` and the same integration tree as the prior head — most often, a clean rebase onto fresh `main` with no real change — the steward skips the spec-rebuild path and reuses the cached spec content on a new commit. CI itself still runs (check runs are anchored to SHAs), but the merge-and-conflict-check work is short-circuited.

## Decision 3 — Fast-forward is the merge

When CI is green on the spec, the steward revalidates: the PR isn't already merged externally, the reviewer approval still holds on the original PR head, the spec SHA is still a fast-forward from current `main`, and `main`'s required checks are still passing. If all four hold, the merge is a single command:

```
git push origin mq-spec-<entry-id>:main
```

That is the actual merge. No `gh pr merge` button is ever pressed. What lands on `main` is byte-for-byte the tree CI validated, and `main`'s history is linear — no merge commits introduced by the queue itself, no "Merge branch 'feature' into 'main'" noise. Bisecting `main` later means walking a chain of tested commits with no synthetic vertices in the way.

This is also why the steward needs `Contents: Read and write` on the GitHub App and must be allowed to push to protected branches.

## Why this had to be its own service

Patchrelay's first version managed PR merges itself. The agent would push a branch, wait for CI, fix what came back, rebase against `main`, retry on conflicts, and eventually merge. That was the design until I sat down and counted what the agent was actually doing.

In late March I went through a window of work — Linear issues `USE-84` through `USE-101`, 232 recorded patchrelay runs across that batch — and classified each run by what it was trying to accomplish. 173 of them were infrastructure churn: rebasing against a moving `main`, retrying after a flake, re-fetching after a missed webhook, shuffling the queue because two PRs both wanted to land first.

That's 74.6% of my Codex runs doing work an LLM has no business doing. The model is bad at deterministic queue control — it works one run at a time, from whatever context I hand it, and "what's queued behind this PR and what should happen next" is the kind of global-state question it gets wrong in ways I can't reliably catch. A merge queue is the opposite shape: the state of the world matters more than any single decision. I was burning tokens, my time, and my attention on something that wanted to be a finite-state machine.

Merge-queue logic is a deterministic control problem. It belongs in a service that does nothing else.

## The merge queues people have already built

The merge queue is one of the most-rebuilt pieces of infrastructure in our industry, and there's a deep public archive of how to do it. I spent a few days reading. The shortlist:

- [bors-ng](https://github.com/bors-ng/bors-ng) — the open-source ancestor of most modern merge queues. Builds a staging branch on top of `main`, runs CI against it, fast-forwards on green. Batches PRs together by default and bisects when CI fails on a batch. Simple, durable, well-understood; the closest existing fit to what I wanted.
- **GitLab merge trains.** Up to 20 parallel pipelines per train, evict-and-restart on failure (when one MR fails, every later pipeline restarts against the new train head). Wasteful but works at GitLab's scale, where trains are typically short.
- [**Shopify's internal merge queue**](https://shopify.engineering/successfully-merging-work-1000-developers). Reconciliation-loop architecture borrowed from React's Virtual DOM: declare the desired state, let the loop drive the world toward it, tolerate flakies with a configurable threshold. Shopify's own write-up uses the React analogy. This is the architectural model I ended up adopting.
- **Uber's SubmitQueue / [BLRD](https://www.uber.com/blog/bypassing-large-diffs-in-submitqueue/).** Speculation engine with probabilistic models and a target-hash conflict analyzer. After enabling BLRD in late May 2023, Uber's June P95 was 74% lower than April's. Heavyweight and inspirational; not what I'd build first.
- **Mergify, Aviator, Trunk Merge Queue, Graphite.** Various commercial takes — speculative checks, batch bisection, affected-targets parallel mode, stack-aware queues. Each has at least one idea worth stealing. ([Kodiak](https://github.com/chdsbd/kodiak) is the closest open-source contender to bors-ng in this lane.)

The decision collapsed quickly. I needed self-hosted, restart-safe, and structured failure reasons an agent can read and react to. None of the SaaS options fit the self-hosting requirement. bors-ng was the closest existing fit, but I wanted cumulative speculative integration, and bolting that onto the bors-ng staging-branch model felt worse than building from scratch with the right shape from the start.

## What's inside merge-steward

The shape I committed to: separate service, one binary, SQLite for state, GitHub statuses as the only coupling to anything else.

### Reconciliation, not orchestration

The steward isn't an orchestrator that walks a state machine. It's a reconciler. There's a desired state — this set of approved PRs, in this order, on this base SHA — and an observed state — what's actually on GitHub right now — and the loop's job is to push observed toward desired without losing its place if it crashes mid-step.

This is the Shopify-style design and it has one important consequence: every operation has to be safe to retry from any partial state. Pushing a speculative branch, triggering CI, fast-forwarding `main`, evicting a PR — each is idempotent or it's a bug. SQLite is the source of truth for the queue itself; GitHub is the source of truth for everything I don't own.

The reconciliation model makes restarts cheap. The steward can be killed mid-merge, restarted, and figure out from observed state where it left off. That property mattered more than I thought it would; in the first month of running merge-steward I redeployed it eight or nine times, and each time it picked up the queue exactly where it had been.

### Structured eviction

When a PR can't make it through the queue — speculative CI fails, retry budget exhausted, conflict that can't be auto-resolved — the steward evicts it and writes a structured incident: a GitHub check run on the PR with a stable failure reason in a known schema. An agent reading the check sees `queue eviction, reason: ci_red on speculative SHA, last green: <hash>` rather than "queue said no, good luck."

The agent decides what to do with that. A flake gets a retry. A real failure gets a code change. A conflict gets a rebase. The steward doesn't care; it just publishes facts an agent can act on.

## Known gaps

The queue supports cumulative speculative validation, cascade invalidation, bounded retry, durable incidents, eviction check runs, and re-admission from fresh GitHub truth. What it doesn't do yet:

- no binary bisection when a long speculative chain fails — the steward rebuilds the chain entry-by-entry instead of finding the bad entry by halving
- no independent queue lanes by path or target — one queue per repo
- flake handling is retry-budget based, not historical learning — the steward doesn't know that a given test has been flaky for a month

None of these have hit hard enough on my own repos to warrant building yet.

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
- [review-quill: real-checkout review, stateless attempts, carry-forward approvals](/posts/review-quill)
- [From YOLO to patchrelay](/posts/from-yolo-to-patchrelay)
