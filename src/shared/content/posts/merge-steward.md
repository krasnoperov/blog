---
title: 'merge-steward: speculative integration, parallel validation, fast-forward landing'
summary: "merge-steward tests cumulative speculative branches in parallel, then advances main to the exact commit that passed CI. Queue state survives restarts, and failures give agents a specific repair job."
publishedAt: 2026-04-29
readingTime: 4 min read
tags: software-factory, patchrelay, merge-steward, merge-queue
featured: false
---

The first time I ran four agents against one repository, three branches passed CI individually and `main` wouldn't compile after I merged them. The fourth agent was rebasing against a `main` that had moved twice. Nothing had tested the combined result.

I needed a merge queue: test the proposed integration, then land the commit that passed. I built merge-steward to run that queue on my own server and report failures in a form an agent could act on.

## Test several possible landings at once

An approved PR with green required checks can enter the queue. For entries A, B, and C, the steward builds cumulative speculative branches:

```
main + A
main + A + B
main + A + B + C
```

CI runs on all three concurrently, while landing remains serial. When A lands, B's tested branch already contains the new `main` plus B. It doesn't need rebuilding just because the queue advanced.

If A fails and leaves the chain, B and C must be rebuilt without it. Parallel validation saves waiting when the order holds; a failure costs downstream CI runs.

A clean rebase has a cheaper path. If the PR's `patch_id` and integration tree still match, the steward can reuse the speculative content in a new commit. CI still runs on that new SHA because GitHub checks are tied to commits.

## Land the tested commit

Before landing, the steward checks that the PR hasn't already merged elsewhere, approval still applies to its head, the speculative commit is a fast-forward from current `main`, and required checks are green. Then it pushes:

```
git push origin mq-spec-<entry-id>:main
```

There is no fresh squash or merge commit after CI. `main` advances to the tested commit, and the queue introduces no merge commits of its own. The GitHub App therefore needs `Contents: Read and write` and permission to push to the protected branch.

## Why I took merging away from the agent

Early patchrelay runs managed their own merges. Each agent waited for CI, retried failures, rebased, and tried to land ahead of the other branches.

In late March I classified 232 runs from one batch of work. Of those, 173—74.6%—were coordination work: rebases, flake retries, missed-webhook recovery, and attempts to get branches landed in a workable order.

An individual agent saw its own task. It didn't have a reliable view of the queue behind it. I moved those decisions into a service with persistent state and explicit rules.

I spent a few days reading existing designs. [bors-ng](https://github.com/bors-ng/bors-ng) was the closest open-source fit, with a staging branch, CI, and fast-forward landing. I wanted cumulative speculative branches rather than its batching approach. [Shopify's merge queue](https://shopify.engineering/successfully-merging-work-1000-developers) supplied the reconciliation model I adopted: compare the desired queue with what is actually on GitHub, then take the next safe action.

## Recovering after a restart

SQLite holds the queue's state; GitHub holds the branches, reviews, and checks. On each reconciliation pass, the steward compares them before acting. Pushing a speculative branch or landing a commit has to be safe to retry after a partial failure.

That mattered quickly. I redeployed the service eight or nine times in its first month, and it picked up the queue each time. I didn't need to reconstruct which merges had finished while the process was stopping.

The original failure path was eviction. If speculative CI failed, a conflict couldn't be resolved, or the retry budget ran out, the steward removed the entry and published a structured GitHub check. patchrelay could read the reason and start a repair run. A check naming the failing speculative SHA gave the agent something more useful than a generic “merge failed.”

> **Update, September 2026.** Ordinary conflicts and red candidates no longer evict. The candidate stays in place in the queue and patchrelay repairs it on its own candidate ref (`integration_repair`, up to ten attempts); a narrow integration review then checks that the approved feature survived the merge. Eviction is now reserved for product ambiguity, policy failure, an exhausted repair budget, or a change to the feature itself.

## Gaps I haven't needed to close

There is one queue per repository, without separate lanes for independent paths or targets. When a speculative chain fails, the steward rebuilds entries rather than using binary bisection to find the culprit. Flake handling uses retry budgets; it doesn't learn from a test's history.

Those limits haven't cost enough in my repositories to justify the extra machinery yet.

## Try it

merge-steward can run without patchrelay or review-quill:

```
npm install -g merge-steward
merge-steward init https://queue.example.com
merge-steward attach owner/repo --base-branch main
```

The [`ship-pr`](https://github.com/krasnoperov/patchrelay-agents) skill teaches a coding agent to wait with `merge-steward pr status --wait`, inspect a failure, and repair the branch when needed.

Source and docs: [github.com/krasnoperov/patchrelay/tree/main/packages/merge-steward](https://github.com/krasnoperov/patchrelay/tree/main/packages/merge-steward).

## Related

- [patchrelay: Linear issues in, pull requests out](/posts/patchrelay)
- [review-quill: a strict reviewer for your coding agent](/posts/review-quill)
- [From YOLO to patchrelay](/posts/from-yolo-to-patchrelay)
