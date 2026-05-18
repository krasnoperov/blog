---
title: 'After the merge queue, traffic control'
summary: Strict review and deterministic landing solve the gate. The next problem is traffic control: keeping independent agent work independent, and sequencing the few branches that would otherwise collide.
publishedAt: 2026-05-18
readingTime: 4 min read
tags: software-factory, patchrelay, review-quill, merge-steward
featured: false
---

The first round of the factory was about gates. `review-quill` made review strict. `merge-steward` made landing deterministic. Once those pieces were working, the next problem moved earlier in the lifecycle.

Starting many coding agents is easy. Keeping their branches from creating fake work is harder.

The naive version looks productive for a while. Ten issues go out, ten branches come back, and CI is mostly green. Then the cost appears at the end. Two PRs touched the same migration. One branch was green against yesterday's `main`. A clean rebase dismissed an approval. The merge queue becomes the first place where planning mistakes are visible.

Most of the time, nothing dramatic happens. Most agent PRs do not conflict. That matters for the design: traffic control should not turn every branch into a stack. It should keep normal work flowing normally, and intervene only when a conflict is predictable, expensive, or likely to create churn.

## The Shape

The current data points in that direction. PatchRelay has recorded 2,709 runs across 729 issues. Local `merge-steward` databases have seen 1,469 queue entries: 1,298 merged, 166 evicted, and 5 dequeued.

The interesting part is not the absolute volume. It is the ratio. I found 51 clear `sequence-check` recommendations to open a finished branch against `main`, and 3 clear cases where it found a stack parent before PR creation. That is the shape I want: most work remains independent, while the few branches with visible dependencies are sequenced before they race.

If half of the branches needed stacking, planning would be broken. If none of them ever needed stacking, the check would be ornamental. Rare intervention is the point.

## The Rules

The first rule is ordinary planning. If two tasks are obviously dependent, they should not run at the same time. PatchRelay respects Linear dependencies, so `B blockedBy A` means B does not start until A is done. The cheapest conflict is the one that never enters GitHub.

The second rule happens after an agent has produced a real diff. Right before PR creation, the workflow runs `patchrelay sequence-check`. It compares the finished branch against in-flight PRs with `git merge-tree`. If another PR is likely to land first and the two branches conflict, the new branch stacks on that PR instead of racing it.

The third rule belongs to the merge queue. `merge-steward` does not trust branch CI alone. It builds a speculative integration branch, runs CI on that integrated tree, and only fast-forwards `main` when the tested SHA is still valid. Branch CI says "this PR works by itself." Speculative CI says "this PR works in the world it is about to enter."

## Change Identity

The last rule is about identity. GitHub review state is tied to a commit SHA, but a commit SHA is not the same thing as a change. A clean rebase can produce a new SHA with the same diff. That should not require another full review.

That is where `patch-id` fits. `review-quill` computes `git patch-id --stable` for the PR diff. If a new head has the same patch-id as a previously approved attempt, it can carry the approval forward onto the new head.

This is only part of the problem. Patch-id does not prevent bad planning, prove that two branches compose, or validate the product. It only prevents one specific kind of fake work: reviewing the same approved diff twice.

The rollout is still young. In my current database, `review-quill` has computed patch-id for 1,552 attempts. Only 42 attempts had a prior approval for the same PR and the same patch-id. All 42 were carried forward. That is not a giant throughput number. It is a correctness rule: same approved patch, no repeat review.

The broader pattern is traffic control. Dependencies prevent obvious races. Sequence-check catches finished branches that should become stacks. The merge queue tests the integrated tree instead of trusting isolated branch CI. Patch-id keeps rebases from becoming review churn.

None of these rules proves the product is right. They only keep the factory from manufacturing its own chaos while the real validation problem remains open.
