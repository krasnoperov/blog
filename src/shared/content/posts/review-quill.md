---
title: 'review-quill: a strict reviewer for your coding agent'
summary: Coding agents focus on the task and forget the surroundings: docs drift, tests go stale, sibling files keep old assumptions. review-quill is the strict reviewer that keeps sending the PR back until the repo is aligned again.
publishedAt: 2026-04-29
readingTime: 5 min read
tags: software-factory, patchrelay, review-quill, code-review
featured: false
---

The failure mode I see most often with coding agents on real work isn't bugs. It's misalignment. An agentic session focuses on the task in front of it — the function I asked for, the bug I asked it to fix — and forgets the surroundings. The function gets implemented; the docs that describe it don't get updated. The schema changes; the changelog says nothing. A new behavior lands; the test fixture three files over keeps the old assumption. The PR ships green and the project quietly drifts.

I lived with that pattern for maybe a month before I had to do something about it. By that point I was hand-reviewing every PR for "is anything else in the repo stale because of this change," which was exactly the bottleneck I'd been running an agent to avoid.

Anthropic ships an official Claude reviewer GitHub Action that catches some of this. It's fine for "review every head, comment on what you find." Anything more conditional — review only when CI is green, only on certain paths, only after the linked issue is in a particular state — and the policy has to live in GitHub Actions YAML, which is a path that ends in tears. (I tried.)

**review-quill** is what I built instead. It checks out the real head SHA in a local worktree, runs the review policy in TypeScript where it reads like normal code, and posts ordinary GitHub `APPROVE` / `REQUEST_CHANGES` reviews. Because it works against real code rather than diff text, it can grep, read tests in sibling files, and check whether the docs page that mentions a function still matches the implementation. It's strict on purpose: it doesn't rubber-stamp, and it keeps pointing at what's misaligned until the agent has actually aligned it.

What makes that strictness affordable is that two AI agents have a really fast hand-off. A review-and-fix loop that would burn out a human reviewer in three rounds runs cheerfully for ten or fifteen at agent pace. The agent doesn't get to ship the PR until the surroundings are checked.

## Reviewing on real code

What I didn't expect to matter as much as it does: review-quill checks out the head SHA in a real worktree before reviewing. Most LLM PR reviewers I've used or read about feed the diff text into the model and ask it to comment. That works for surface-level things — naming, obvious bugs, missing types. It misses anything that depends on knowing what the rest of the codebase looks like.

A real checkout means the reviewer can grep, can read tests in adjacent files, can check whether the function being modified is called from somewhere with assumptions the diff would violate. The cost is a few seconds of clone-and-checkout per review. The benefit is catches the diff alone wouldn't have surfaced.

Real checkouts also fix stale-review noise. review-quill keys every review by head SHA. If a push lands while a review is in flight, the in-flight review is invalidated and the new SHA gets a fresh one. The old SHA's review never ships.

## GitHub is the bus

review-quill, merge-steward, and patchrelay live in the same monorepo and share zero runtime knowledge of each other.

Patchrelay doesn't call review-quill. review-quill doesn't call merge-steward. None of them know the others exist as services. The only thing they share is the GitHub state that PRs already publish: review state, check status, head SHA. New PR opens, GitHub webhook fires, review-quill picks it up. review-quill posts an approving review, GitHub webhook fires, merge-steward picks it up if checks are also green. merge-steward fast-forwards `main`, GitHub webhook fires, patchrelay marks the issue closed.

This wasn't a clever architectural decision. It's what happened when I extracted services one at a time and refused to add direct coupling between them. It's also why each piece is independently usable — review-quill runs alone against any repo, no patchrelay required, no merge-steward required, and it doesn't know or care whether the PR was written by a human or an agent.

The structural takeaway of the whole stack: GitHub state is the bus. Services are reconcilers. Every effect is a public artifact on the PR timeline. Debugging a stuck PR is "open the timeline and follow the events," not "find which of three services has the wrong opinion about this thing."

## The surprise — the reviewer is mostly right

The first weeks of running review-quill against patchrelay-produced PRs looked broken. Agent pushes a branch, review-quill rejects, agent pushes a fix, review-quill rejects, agent pushes again, review-quill finally approves. Three to five rounds was normal. Sometimes more. I have issues in the database where review-fix ran twelve, fourteen, twenty-five times before the PR finally got through. The shape looked like a stuck loop — two LLMs talking past each other.

What I expected to find when I dug in was that review-quill was being unreasonable — reviewer hallucination, bikeshedding, latching onto an early objection it couldn't let go of. There's some of that. I have a documented incident on a subtitles PR where review-quill flipped its own stance across three consecutive rounds, which is the failure mode in its purest form.

What I mostly found was that the reviewer was right. Codex was glossing things — invariants the rest of the file enforced, contracts the test suite assumed, edge cases the recent commits had introduced and the implementation had quietly ignored. The review wasn't bikeshedding; it was catching the kind of thing a careful human reviewer catches. The agent's first attempt was wrong. The second was less wrong. The third addressed the underlying class of issue rather than the surface complaint, and that's why the third one passed.

That sounds obvious after the fact. Sitting in front of it the first time, watching two AI services go back and forth six times on the same PR, my reflex was that the system was broken. It wasn't. The iteration was the work. The value of review-quill is that it forces the iteration to happen *before* the PR lands rather than three weeks later when someone hits the bug in production.

## Why strict review works with agents in particular

If a human reviewer sat on the other end of this loop, "twenty-five rounds before approval" would be a process failure, not a feature. The reviewer would burn out, the implementer would burn out, the team would water the review down to keep it survivable, and standards would slide. That's not a hypothetical — it's how most code review erodes.

A coding agent doesn't burn out, and neither does the reviewer when the reviewer is also a service. The hand-off between review and fix takes seconds, not days. No Slack DM, no "can we sync about this," no waiting for somebody to swap context back in. The agent reads the structured review on a `REQUEST_CHANGES` exit, opens the worktree it's been working in, addresses the comments, pushes, and the loop runs again.

That property — fast hand-off, no fatigue — is what lets review-quill afford to be strict: it points at what's wrong, the implementer takes another swing, the cycle takes seconds, and convergence is cheap. The PR that finally lands has been through enough rounds that the obvious wrong answers are already gone.

## When iteration becomes churn

The same fast hand-off that makes the loop affordable also makes it fail in a particular way. Sometimes the two agents settle into churn — review-quill names a symptom, the implementer fixes that symptom, review-quill finds the next symptom of the same underlying issue, the implementer patches that, and neither side ever steps back to ask what's actually wrong. The PR converges in the small and stays broken in the large.

The current mitigation is crude. Patchrelay caps `review_fix` rounds at a hard limit, after which the issue escalates for human attention instead of letting the loop spend my budget on surface fixes. The cap stops the bleeding. It doesn't address the cause.

The real fix is something neither service can do on its own: noticing that the iteration shape itself has gone wrong — same files touched five times, same class of comment from the reviewer five times, no progress on the underlying issue — and breaking out of "address the comment" mode into "step back, identify the root cause, address that." I don't know how to make that happen reliably yet.

These cases are rare, and they aren't invisible. Every churn loop leaves a complete trail in the logs — every review, every diff, every commit, every elapsed second. I can open one after the fact, name the pattern, and tune prompts or review heuristics so the next case of the same shape is less likely to repeat.

## What this opens up

If the reviewer is mostly right and the implementation is mostly close-but-wrong, the question shifts. It's no longer "how do I tune the reviewer." It's "how do I get the implementer to land closer to right on the first attempt, and to address feedback meaningfully when it doesn't."

I have data on the iteration patterns now: 63 issues with `review_fix` runs, mean 3.67 rounds, median around 2, and a long tail of issues that took 12 or 14 or 25 rounds to converge. The shape of that tail is where the next round of work goes. I want to know what makes a long-tail issue different from a short one — size, ambiguity, repo, time of day, prompt cold-start, something I haven't measured yet.

## Try it

review-quill is independently usable — no patchrelay required, no merge-steward required:

```
npm install -g review-quill
review-quill init https://review.example.com
review-quill repo attach owner/repo
```

If you drive your own coding agent, the [`ship-pr`](https://github.com/krasnoperov/patchrelay-agents) skill teaches it to block on `review-quill pr status --wait`, read the structured review on `REQUEST_CHANGES`, fix the code, push, and re-enter the wait.

Source and docs: [github.com/krasnoperov/patchrelay/tree/main/packages/review-quill](https://github.com/krasnoperov/patchrelay/tree/main/packages/review-quill).

## Related

- [patchrelay: a Linear-driven harness for Codex](/posts/patchrelay)
- [merge-steward: a self-hosted merge queue without the Enterprise gate](/posts/merge-steward)
- [From YOLO to patchrelay](/posts/from-yolo-to-patchrelay)
