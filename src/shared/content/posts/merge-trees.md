---
title: 'Merge trees: a mental model for the factory'
summary: review-quill, merge-steward, and patchrelay stopped fighting once they shared a small Git vocabulary: commit trees, patch-id, merge-tree, and fast-forward landing. None of it is new. The useful part was applying established primitives consistently.
publishedAt: 2026-05-06
readingTime: 4 min read
tags: software-factory, patchrelay, merge-steward, review-quill, mental-model
featured: false
---

After `patchrelay`, `review-quill`, and `merge-steward` were all running, a strange kind of waste appeared.

An already-approved PR could be rebased onto fresh `main`, get a new head SHA, lose its approval, and go back through review even though the diff had not changed. A branch could have red CI while the merge queue was already testing a speculative SHA that did not hit the same flake. A cosmetic push could dismiss a fresh approval. Two parallel PRs could touch the same lock file and only discover the problem when one reached the queue.

None of that was a failure of any single service. Each service was doing its job. The problem was that they did not share a precise enough idea of what they were operating on.

We were saying "the PR" when we meant several different things:

- the branch ref GitHub currently calls the PR head
- the logical change represented by the diff
- the tree that would exist if the PR landed on `main`
- the reviewed or approved state attached to a particular commit SHA

The fix was not more orchestration glue. It was a smaller vocabulary.

## Established Pieces

The useful surprise was that most of this is old territory.

Gerrit has long treated patch identity as the unit of review. A trivial rebase can preserve votes because the change is the same even when the commit SHA is new.

Bors-style merge queues, GitHub merge queues, and GitLab merge trains all share the same basic instinct: do not trust branch CI alone; test the thing that will actually land.

Stacked-PR tools like Graphite show that a stack does not need to be a mysterious new object. A PR's base ref can express the chain.

PatchRelay did not need a new theory. It needed these established ideas applied consistently across the author, reviewer, and lander.

## Commit Tree

Git stores snapshots. A commit points to a tree, which is the full repository state at that commit, and to one or more parents.

The diff in a PR is not the primary object. It is computed:

```text
tree(child) - tree(parent)
```

That matters because different actors care about different derived views. A reviewer cares whether the change changed. A merge queue cares whether `main + change` works. GitHub branch protection cares about the exact commit SHA.

Those are related, but they are not the same thing.

## Patch-id

`patch-id` is Git's stable identity for a patch. In this stack, the useful form is:

```bash
git diff "$(git merge-base main HEAD)"..HEAD | git patch-id --stable
```

The first field of the output is the patch id.

Same `patch-id` means the diff is the same, even if the branch was rebased, amended, cherry-picked, or rebuilt into a different commit graph. Commit messages, dates, authors, and parent SHAs do not matter. The diff does.

That is exactly the identity review needs. If `review-quill` approved a patch and a later head has the same patch-id, it can carry the approval forward instead of reviewing the same change again.

It is not magic. If resolving a conflict changes the resulting diff, the patch-id changes. That is good; the change really is different.

## Merge-tree

`git merge-tree` lets you ask Git what the merge result would be without checking anything out:

```bash
git merge-tree --write-tree main HEAD
```

On success, it prints a tree object id. On conflict, it fails. No working directory, no merge commit, no side effects.

That tree is the integration truth: the repository state that would exist if the PR landed on the current `main`.

`merge-steward` turns that tree into a speculative commit, runs CI on it, and only lands the PR if that tested commit is still valid. Branch CI says "this PR works by itself." Speculative CI says "this PR works in the world it is about to enter."

## Fast-forward

Once a speculative commit has been tested, landing should be boring.

If current `main` is an ancestor of the tested commit, the merge is just a pointer move:

```bash
git push origin <tested-commit>:main
```

No new merge commit, no squash, no GitHub merge button semantics. The integration work happened before the pointer moved. `main` advances to a state that CI already saw.

This is why squash is the wrong default for this factory. Squash creates a new commit after review and queue validation. Fast-forward landing preserves the tested object.

## Rules

Once those primitives are named, the service rules get simpler:

| Problem | Rule |
|-|-|
| Re-review after trivial rebase | Carry review verdicts by `patch-id`. |
| Cosmetic push dismisses approval | Do not originate a patch-id-equivalent push. |
| Branch CI flakes while queued | Treat branch CI as metadata once the lander owns the PR. |
| Green PR breaks after merge | Test the integration tree, not only the PR head. |
| Predictable conflicts reach the queue | Sequence dependent work before PRs race. |

This is the mental model behind the later traffic-control work. Most PRs do not need anything special. The value is in making the rare expensive cases explicit: same patch, no re-review; changed patch, fresh review; same integration tree, no queue churn; conflicting integration tree, repair before landing.

None of these primitives are mine. That is the point. The factory got simpler when it stopped inventing workflow concepts and started agreeing on the Git objects that were already there.

## Related

- [patchrelay: a Linear-driven harness for Codex](/posts/patchrelay)
- [merge-steward: a self-hosted merge queue without the Enterprise gate](/posts/merge-steward)
- [review-quill: a strict reviewer for your coding agent](/posts/review-quill)
