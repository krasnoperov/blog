---
title: 'After the merge queue, traffic control'
summary: review-quill made review strict and merge-steward made landing deterministic. The next problem moved earlier: keep the few conflicting agent branches from racing, invalidating each other, and turning integration into fake work.
publishedAt: 2026-05-18
readingTime: 4 min read
tags: software-factory, patchrelay, review-quill, merge-steward
featured: false
---

The first round of the factory was about gates. `review-quill` made review strict. `merge-steward` made landing deterministic. Once those two were running, the next problem moved earlier in the lifecycle.

Starting many coding agents is easy. Keeping their pull requests from clashing is the hard part.

The naive version looks productive for a while. Ten issues go out, ten branches come back, CI is mostly green, and then the mess arrives at the end: two PRs touched the same migration, one branch was green against yesterday's `main`, a harmless rebase dismissed an approval, and the merge queue becomes the place where all planning mistakes are finally visible.

Most of the time, nothing dramatic happens. Most agent PRs do not conflict. The traffic-control work is for the minority of cases where conflict is predictable, expensive, or capable of creating fake work.

## Runtime Shape

The current data has that shape:

| Question | Local signal |
|-|-|
| Is there enough parallel work for this to matter? | PatchRelay has recorded 2,709 runs across 729 issues. |
| Do most PRs need stacking? | No. I found 51 clear `sequence-check` recommendations to open against `main`. |
| Does stacking ever matter? | Yes. I found 3 clear cases where `sequence-check` found a stack parent before PR creation. |
| Does the merge queue still catch misses? | Yes. Local merge-steward databases show 1,469 queue entries, 1,298 merged, 166 evicted. |
| Is patch-id a big throughput win? | Not yet. It carried 42 approvals forward, but only 42 attempts were actual same-approved-diff candidates. |

That is the system I want: most work flows normally, a few branches are sequenced before they race, and the merge queue remains the safety net instead of becoming the first place coordination happens.

## Dependencies

If two tasks are obviously dependent, they should not run at the same time. PatchRelay already respects Linear dependencies, so `B blockedBy A` means B does not start until A is done. That is the cheapest conflict: the one that never enters GitHub.

## Sequence Check

Some conflicts are only visible after the agent has a real diff. Right before PR creation, the workflow asks the agent to run `patchrelay sequence-check`. The command compares the finished branch against in-flight PRs with `git merge-tree`. If another PR is likely to land first and the two branches conflict, the new branch stacks on that PR instead of racing it.

The 51-to-3 split is healthy. If half the branches needed stacking, planning would be broken. If no branches ever needed stacking, the check would be ornamental. Rare intervention is the point.

## Speculative Landing

`merge-steward` still owns the safety net. It does not trust branch CI alone. It builds a speculative integration branch, runs CI on that integrated tree, and only fast-forwards `main` when that tested SHA is still valid. Across the local steward databases I checked, it has seen 1,469 queue entries and merged 1,298 of them.

## Change Identity

The last piece sits between `review-quill` and `merge-steward`: GitHub review state is tied to a commit SHA, but a commit SHA is not the same thing as a change. A rebase can produce a new SHA with the same diff. That should not require another full review.

That is where `patch-id` fits. `review-quill` computes `git patch-id --stable` for the PR diff. If a new head has the same patch-id as a previously approved attempt, it can carry the approval forward onto the new head.

The rollout is still young. In my current database, `review-quill` has computed patch-id for 1,552 attempts. Only 42 of those attempts had a prior approval for the same PR and same patch-id. All 42 were carried forward. Patch-id is not a giant throughput win by itself. It is a correctness rule: do not make the factory review the same approved diff twice.

Once strict review and deterministic landing exist, the work shifts to traffic control. Dependencies prevent the obvious races. Sequence-check catches finished diffs that should become stacks. The merge queue tests the integrated tree instead of trusting isolated branch CI. Patch-id keeps rebases from becoming fake work.

None of these rules proves the product is right. They only keep the factory from manufacturing its own chaos while the real validation problem remains open.
