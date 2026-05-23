---
title: 'review-quill: real-checkout review, stateless attempts, carry-forward approvals'
summary: Coding agents focus on the task and forget the surroundings. review-quill checks out the head SHA in a real worktree, runs each attempt as a fresh stateless Codex thread, and re-publishes prior approvals when a rebase doesn't change the diff.
publishedAt: 2026-04-29
readingTime: 5 min read
tags: software-factory, patchrelay, review-quill, code-review
featured: false
---

The failure mode I see most often with coding agents on real work isn't bugs. It's misalignment. An agentic session focuses on the task in front of it — the function I asked for, the bug I asked it to fix — and forgets the surroundings. The function gets implemented; the docs that describe it don't get updated. The schema changes; the changelog says nothing. A new behavior lands; the test fixture three files over keeps the old assumption. The PR ships green and the project quietly drifts.

I lived with that pattern for maybe a month before I had to do something about it. By that point I was hand-reviewing every PR for "is anything else in the repo stale because of this change," which was exactly the bottleneck I'd been running an agent to avoid.

Anthropic ships an official Claude reviewer GitHub Action that catches some of this. It's fine for "review every head, comment on what you find." Anything more conditional — review only when CI is green, only on certain paths, only after the linked issue is in a particular state — and the policy has to live in GitHub Actions YAML, which is a path that ends in tears. (I tried.)

**review-quill** is what I built instead, and its design comes down to three decisions:

1. **Review on a real checkout, not on diff text.** Each attempt materializes an ephemeral worktree at the exact head SHA from a persistent bare cache. The reviewer can grep, read sibling tests, and check whether docs that mention a function still match the implementation.
2. **Every attempt is stateless and head-SHA-keyed.** A fresh Codex thread per attempt; a new push supersedes the in-flight one and dismisses any decisive review already published against the old SHA. No accumulating fatigue, no "remembering" earlier rounds.
3. **Approval carries forward when the patch isn't really new.** A clean rebase that produces the same `patch_id` re-publishes the cached approval against the new SHA. Trivial rebases don't burn a fresh review.

The visible output is the same as any other PR reviewer: ordinary GitHub `APPROVE` / `REQUEST_CHANGES` reviews. The strictness comes from running review against real code with up-to-date repo guidance, and the loop is affordable because each attempt is cheap and independent.

## Decision 1 — Real checkout, not diff text

Most LLM PR reviewers I've used or read about feed the diff text into the model and ask it to comment. That works for surface-level things — naming, obvious bugs, missing types. It misses anything that depends on knowing what the rest of the codebase looks like.

review-quill keeps a persistent bare clone of each attached repo. Each attempt is `git worktree add` off that cache plus a `git fetch` for new refs — cheap, doesn't fight the cache for the working directory. The reviewer runs against the materialized tree at the exact head SHA, so it can grep, can read tests in adjacent files, can check whether the function being modified is called from somewhere with assumptions the diff would violate.

The review policy itself isn't in TypeScript; it's in repo markdown — `REVIEW_WORKFLOW.md` and `AGENTS.md`, loaded into a prompt envelope and run through Codex App Server. The TypeScript surface is the harness around it: when to attempt, how to materialize the worktree, how to handle stale attempts, how to publish.

## Decision 2 — Stateless attempts keyed by head SHA

Every review attempt is a fresh Codex thread keyed to the PR's current head SHA. The harness doesn't carry conversation state across attempts. When a new push lands, the in-flight attempt is marked `superseded`, any already-published decisive review on the old SHA is dismissed, and the new SHA gets a fresh attempt.

The agent reading the result blocks on `review-quill pr status --wait`, which has stable exit codes scoped to the review attempt itself:

- `0` — approved (or intentionally skipped)
- `2` — `REQUEST_CHANGES` published, or the attempt errored / was cancelled
- `3` — still in flight
- `4` — wait timed out

The implementing agent reacts to `2` by reading the inline comments and review body, applying the fix, pushing. The new SHA triggers a new attempt. The old review never re-enters the conversation. No reviewer drift, no "I said this last time," no compounding context the new attempt has to fight. (Required-check status is `merge-steward`'s domain in the next phase, not review-quill's.)

This is what makes strict review affordable. A human reviewer carrying state across ten rounds would burn out; a stateless service keyed by SHA has no rounds to carry — each attempt sees the current head and reasons from scratch.

## Decision 3 — Carry-forward on stable `patch_id`

Some pushes change the head SHA but not the diff: a clean rebase onto fresh `main` is the common case. review-quill computes the `patch_id` of the new head and compares against the cached `patch_id` of the prior approved attempt. If they match — same diff, different parent — the prior approval is re-published against the new SHA without spending a fresh Codex review.

In `integration_tree` review mode — where review-quill builds a synthetic merge commit locally from the PR head and its merge-base against the base branch, then reviews that tree instead of the PR head — the comparison key is `(patch_id, integration_tree_id)` rather than just `patch_id`. Same idea, more conservative: the cached approval only carries forward when both the diff *and* the merged tree are unchanged.

The result: shuffling against a moving `main` doesn't cost review cycles. Real code changes do.

## GitHub is the bus

review-quill, merge-steward, and patchrelay live in the same monorepo and share zero runtime knowledge of each other.

Patchrelay doesn't call review-quill. review-quill doesn't call merge-steward. None of them know the others exist as services. The only thing they share is the GitHub state that PRs already publish: review state, check status, head SHA. New PR opens, GitHub webhook fires, review-quill picks it up. review-quill posts an approving review, GitHub webhook fires, merge-steward picks it up if checks are also green. merge-steward fast-forwards `main`, GitHub webhook fires, patchrelay marks the issue closed.

This wasn't a clever architectural decision. It's what happened when I extracted services one at a time and refused to add direct coupling between them. It's also why each piece is independently usable — review-quill runs alone against any repo, no patchrelay required, no merge-steward required, and it doesn't know or care whether the PR was written by a human or an agent.

The structural takeaway of the whole stack: GitHub state is the bus. Services are reconcilers. Every effect is a public artifact on the PR timeline. Debugging a stuck PR is "open the timeline and follow the events," not "find which of three services has the wrong opinion about this thing."

## The surprise — the reviewer is mostly right

The first weeks of running review-quill against patchrelay-produced PRs looked broken. Agent pushes a branch, review-quill rejects, agent pushes a fix, review-quill rejects, agent pushes again, review-quill finally approves. Three to five rounds was normal. Sometimes more. In my logs there are issues that ran more than ten review-fix rounds before converging.

What I expected to find when I dug in was that review-quill was being unreasonable — reviewer hallucination, bikeshedding, latching onto an early objection it couldn't let go of. There's some of that. I have one case in my notes where review-quill flipped its own stance across three consecutive rounds, which is the failure mode in its purest form.

What I mostly found was that the reviewer was right. Codex was glossing things — invariants the rest of the file enforced, contracts the test suite assumed, edge cases the recent commits had introduced and the implementation had quietly ignored. The review wasn't bikeshedding; it was catching the kind of thing a careful human reviewer catches. The agent's first attempt was wrong. The second was less wrong. The third addressed the underlying class of issue rather than the surface complaint, and that's why the third one passed.

That sounds obvious after the fact. Sitting in front of it the first time, watching two AI services go back and forth six times on the same PR, my reflex was that the system was broken. It wasn't. The iteration was the work. The value of review-quill is that it forces the iteration to happen *before* the PR lands rather than three weeks later when someone hits the bug in production.

## When iteration becomes churn

The same fast hand-off that makes the loop affordable also makes it fail in a particular way. Sometimes the two services settle into churn — review-quill names a symptom, the implementer fixes that symptom, review-quill finds the next symptom of the same underlying issue, the implementer patches that, and neither side ever steps back to ask what's actually wrong. The PR converges in the small and stays broken in the large.

The current mitigation is crude. Patchrelay caps `review_fix` rounds at a configurable limit (default 10), after which the issue escalates for human attention instead of letting the loop spend my budget on surface fixes. The cap stops the bleeding. It doesn't address the cause.

The real fix is something neither service can do on its own: noticing that the iteration shape itself has gone wrong — same files touched five times, same class of comment from the reviewer five times, no progress on the underlying issue — and breaking out of "address the comment" mode into "step back, identify the root cause, address that." I don't know how to make that happen reliably yet.

These cases are rare, and they aren't invisible. Every churn loop leaves a complete trail in the logs — every review, every diff, every commit, every elapsed second. I can open one after the fact, name the pattern, and tune prompts or review heuristics so the next case of the same shape is less likely to repeat.

## What this opens up

If the reviewer is mostly right and the implementation is mostly close-but-wrong, the question shifts. It's no longer "how do I tune the reviewer." It's "how do I get the implementer to land closer to right on the first attempt, and to address feedback meaningfully when it doesn't."

I have data on the iteration patterns in my own logs: dozens of issues with `review_fix` runs, a clear mode around two or three rounds, and a long tail of issues that took ten-plus rounds to converge. The shape of that tail is where the next round of work goes. I want to know what makes a long-tail issue different from a short one — size, ambiguity, repo, time of day, prompt cold-start, something I haven't measured yet.

## Try it

review-quill is independently usable — no patchrelay required, no merge-steward required:

```
pnpm add -g review-quill
review-quill init https://review.example.com
review-quill repo attach owner/repo
```

If you drive your own coding agent, the [`ship-pr`](https://github.com/krasnoperov/patchrelay-agents) skill teaches it to block on `review-quill pr status --wait`, read the structured review on exit `2`, fix the code, push, and re-enter the wait.

Source and docs: [github.com/krasnoperov/patchrelay/tree/main/packages/review-quill](https://github.com/krasnoperov/patchrelay/tree/main/packages/review-quill).

## Related

- [patchrelay: a Linear-driven harness for Codex](/posts/patchrelay)
- [merge-steward: speculative integration, parallel validation, fast-forward landing](/posts/merge-steward)
- [From YOLO to patchrelay](/posts/from-yolo-to-patchrelay)
