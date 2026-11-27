---
title: 'Merge trees: a clean mental model'
summary: "Separating the patch, integrated tree, and tested commit helped me avoid repeated reviews and land the code CI actually checked."
publishedAt: 2026-05-06
readingTime: 3 min read
tags: software-factory, patchrelay, merge-steward, review-quill, mental-model
featured: false
---

I noticed review-quill reviewing an approved change again after a clean rebase. The PR had a new head SHA, but its diff hadn't changed. patchrelay, review-quill, and merge-steward were treating “the PR” as though it identified one thing.

I needed to distinguish the branch ref, the patch being reviewed, the proposed integrated tree, and the commit carrying GitHub's checks and approval.

## The patch

A commit points to a tree—a snapshot of repository contents—and its parents. The diff describes a change between trees. To identify a PR's patch independently of its commit metadata, I use:

```bash
git diff "$(git merge-base main HEAD)"..HEAD | git patch-id --stable
```

The first output field is the patch ID. It ignores line numbers, whitespace, and the ordering of file diffs, so matching IDs identify likely duplicate patches rather than byte-identical diffs. [Git's documentation](https://git-scm.com/docs/git-patch-id) describes this normalization.

review-quill uses that identity to carry approvals across equivalent pushes. It saves a review after a clean rebase, but it doesn't prove that changed surrounding code is harmless. Its `integration_tree` mode also requires a matching integrated tree before reusing the verdict.

## The integrated tree

Git can calculate the proposed merge without touching the checkout:

```bash
git merge-tree --write-tree main HEAD
```

A clean merge returns a tree object ID. Conflicts produce a nonzero exit status and additional output. The command writes Git objects, but leaves the index and working tree alone; it doesn't create a merge commit. See [git-merge-tree](https://git-scm.com/docs/git-merge-tree).

merge-steward builds a speculative commit for that result and runs CI on it. This tests the PR together with the code it would land on. Passing branch CI alone doesn't establish that the combination works.

## The tested commit

If current `main` is still an ancestor of the tested commit, landing can be a fast-forward:

```bash
git push origin <tested-commit>:main
```

The queue checks that approval and required checks still hold before pushing. It doesn't create a new squash commit after validation; `main` advances to the commit CI saw.

These distinctions changed how I handle a few recurring cases:

| Problem | Rule |
|-|-|
| Clean rebase triggers another review | Reuse approval under the configured patch and tree checks. |
| Equivalent push dismisses approval | Avoid unnecessary pushes after approval. |
| Branch CI flakes while queued | Inspect the queue's candidate checks before restarting work. |
| Individually green PRs break together | Test their integrated tree. |
| Dependent branches race to land | Sequence them before they reach the queue. |

The remaining judgment is how much surrounding change should invalidate an earlier review. A patch ID alone can't answer that.

## Related

- [patchrelay: Linear issues in, pull requests out](/posts/patchrelay)
- [merge-steward: speculative integration, parallel validation, fast-forward landing](/posts/merge-steward)
- [review-quill: a strict reviewer for your coding agent](/posts/review-quill)
