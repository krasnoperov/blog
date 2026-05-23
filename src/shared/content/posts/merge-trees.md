---
title: 'Merge trees: a clean mental model'
summary: A PatchRelay model for changes, reviews, and landings, built from primitives Git already gives you: commit trees, patch-id, merge-tree, and fast-forward landing.
publishedAt: 2026-05-06
readingTime: 4 min read
tags: software-factory, patchrelay, merge-steward, review-quill, mental-model
featured: false
---

Once `patchrelay`, `review-quill`, and `merge-steward` were all running together, a weird kind of waste showed up. Nothing was obviously broken. Each service was doing what it was built to do. They were just using the same word — "PR" — to mean four different things, and the disagreements weren't visible until I watched the same change get re-reviewed for no reason.

An already-approved PR could get rebased onto fresh `main`, pick up a new head SHA, lose its approval, and go back through review even though the diff hadn't changed. A branch could be red on its own CI while the merge queue was already testing a speculative SHA that didn't hit the same flake. A cosmetic push could nuke a fresh approval. Two parallel PRs could touch the same lock file and only find out about each other at the queue.

The model that helped was simple: review, CI, branch protection, and the merge queue each care about a different Git object. When I said "the PR," I might have meant:

- the branch ref GitHub currently calls the PR head
- the logical change represented by the diff
- the tree that would exist if the PR landed on `main`
- the reviewed-or-approved state attached to a particular commit SHA

The fix wasn't a new workflow theory. I needed a smaller vocabulary, built out of Git primitives that already exist.

## The pattern

Gerrit treats patch identity as the unit of review. Bors-style merge queues, GitHub merge queues, and GitLab merge trains all share the same instinct: don't trust branch CI alone, test the thing that will actually land. Stacked-PR tools like Graphite show that a stack doesn't need to be a mysterious object — a PR's base ref can express the chain. Patchrelay didn't need a new theory; it needed these ideas applied consistently across the author, reviewer, and lander.

## Commit tree

Git stores snapshots. A commit points to a tree (the full repo state at that commit) and to one or more parents. A PR diff is computed from those objects:

```text
tree(child) - tree(parent)
```

Those views are related but not interchangeable. A reviewer cares whether the change changed. A merge queue cares whether `main + change` works. GitHub branch protection cares about the exact commit SHA. Treating all of that as "the PR" is where the waste came from.

## Patch-id

`patch-id` is Git's stable identity for a patch. The useful form here is:

```bash
git diff "$(git merge-base main HEAD)"..HEAD | git patch-id --stable
```

The first field of the output is the patch id. Same `patch-id` means the diff is the same, even if the branch was rebased, amended, cherry-picked, or rebuilt into a different commit graph. Commit messages, dates, authors, parent SHAs — none of them matter. The diff does.

That's the identity review needs. If `review-quill` approved a patch and a later head has the same patch-id, it carries the approval forward instead of reviewing the same change again. If resolving a conflict changes the diff, the patch-id changes too — and that's exactly what I want, because the change really is different.

## Merge-tree

`git merge-tree` asks Git what the merge would produce without checking anything out:

```bash
git merge-tree --write-tree main HEAD
```

On success it prints a tree object id. On conflict it fails. No working directory, no merge commit, no side effects.

That tree is the integration truth — the state the repo would be in if the PR landed on the current `main`. `merge-steward` builds a speculative commit representing that result, runs CI on it, and only lands the PR if the tested commit is still valid. Branch CI says "this PR works by itself." Speculative CI says "this PR works in the world it's about to enter."

## Fast-forward

Once a speculative commit has been tested, landing should be boring. If current `main` is an ancestor of the tested commit, the merge is just a pointer move:

```bash
git push origin <tested-commit>:main
```

No new merge commit, no squash, no GitHub merge button semantics. The integration work happened before the pointer moved; `main` advances to a state CI already saw. This is why squash is the wrong default for this factory — squash creates a new commit after review and queue validation, while fast-forward landing preserves the tested object.

## Rules

With those primitives named, the service rules collapse:

| Problem | Rule |
|-|-|
| Re-review after trivial rebase | Carry review verdicts by `patch-id`. |
| Cosmetic push dismisses approval | Don't originate a patch-id-equivalent push. |
| Branch CI flakes while queued | Treat branch CI as metadata once the lander owns the PR. |
| Green PR breaks after merge | Test the integration tree, not only the PR head. |
| Predictable conflicts reach the queue | Sequence dependent work before PRs race. |

This is the mental model behind the later agent-PR sequencing work. Most PRs need none of it. The value is making the rare expensive cases explicit: same patch, no repeat review; changed patch, fresh review; same integration tree, no queue churn; conflicting integration tree, repair before landing.

The factory got simpler when I stopped inventing workflow concepts and started agreeing on the Git objects that were already there.

## Related

- [patchrelay: a Linear-driven harness for Codex](/posts/patchrelay)
- [merge-steward: speculative integration, parallel validation, fast-forward landing](/posts/merge-steward)
- [review-quill: real-checkout review, stateless attempts, carry-forward approvals](/posts/review-quill)
