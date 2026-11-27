---
title: 'review-quill: a strict reviewer for your coding agent'
summary: "review-quill checks a real checkout at each PR head, publishes GitHub reviews, and reuses approvals for matching patches. The harder problem is knowing when repeated fixes have become churn."
publishedAt: 2026-04-29
readingTime: 4 min read
tags: software-factory, patchrelay, review-quill, code-review
featured: false
---

I kept finding changes that worked locally but left the rest of the repository behind. An agent updated a function without its docs, changed a schema without its fixtures, or missed an assumption in a caller. After a month of checking every PR for these omissions, I wanted a separate reviewer.

I tried Anthropic's Claude reviewer GitHub Action. It worked for basic review, but my conditions—wait for green CI, inspect certain paths, check the linked issue's state—were becoming awkward to express in Actions YAML.

review-quill runs those reviews as a service and publishes ordinary GitHub approvals or requests for changes.

## Give the reviewer a checkout

Each attempt gets an ephemeral worktree at the exact PR head SHA, built from a persistent bare clone. The reviewer can search callers, read adjacent tests, and check documentation against the implementation.

Repository guidance comes from `REVIEW_WORKFLOW.md` and `AGENTS.md`. TypeScript supplies the review rubric and output contract, starts the Codex App Server session, and handles publication. Changing a repo's review policy usually means editing its markdown.

Each attempt starts a fresh Codex thread. A new push supersedes an in-flight review and dismisses any decisive review already published against the old SHA. The next attempt judges the new head without inheriting the previous conversation. That doesn't guarantee a consistent verdict, but it prevents old objections from lingering simply because they are in the thread.

The implementing agent can wait with `review-quill pr status --wait`:

| Exit code | Meaning |
|-|-|
| `0` | Approved or intentionally skipped |
| `2` | Changes requested, attempt errored, or attempt cancelled |
| `3` | Still in flight |
| `4` | Wait timed out |

On `2`, the caller needs to inspect the result. A published review gives it comments to address; an errored attempt needs diagnosis rather than an invented code fix. Pushing a fix starts another review.

## Avoid paying again for a rebase

A clean rebase can change the head SHA without changing the normalized patch. review-quill compares Git `patch_id` values and can publish a cached approval against the new SHA when they match.

This is a reuse policy, not proof that the surrounding code is irrelevant. In `integration_tree` mode, the reviewer examines the proposed integrated tree and the cache key is `(patch_id, integration_tree_id)`. Both must match before approval carries forward. That is more conservative when `main` is changing underneath the PR.

## Connecting review to implementation

The services communicate through GitHub state. patchrelay opens a PR; a webhook starts review-quill. An approval and green checks let merge-steward admit it. When the queue lands it, patchrelay can close the issue.

They don't call each other's APIs. review-quill can review a human-written PR without either of the other services installed. The PR timeline also gives me a shared place to investigate a stalled change, though I still need service logs when the published events don't explain it.

## The reviewer was usually right

The first weeks looked broken. Three to five rounds of review and fixes were normal; some issues went past ten. I expected the logs to show a reviewer inventing objections.

There was some of that. In one case, it reversed its position across three consecutive rounds. Mostly, though, it was finding missed invariants, test contracts, and edge cases introduced by recent commits. The implementer would patch the immediate complaint and only later address the underlying problem.

That changed how I read a long review thread. Several rounds weren't automatically evidence of a bad reviewer. I had to inspect what each round caught.

Some threads really were churn: the same files changed repeatedly, the reviewer found another symptom, and neither agent stepped back to diagnose the cause. patchrelay caps `review_fix` runs at a configurable limit, ten by default, then asks for human attention. The cap limits spending; it doesn't make the diagnosis better.

Across the issues I've inspected, two or three repair rounds are common, with a tail beyond ten. I want to understand what distinguishes that tail—task size, ambiguity, missing context, or something else—before adding more retries.

## Try it

```
pnpm add -g review-quill
review-quill init https://review.example.com
review-quill repo attach owner/repo
```

The [`ship-pr`](https://github.com/krasnoperov/patchrelay-agents) skill teaches a coding agent to wait for review, inspect the result, fix requested changes, and push again.

Source and docs: [github.com/krasnoperov/patchrelay/tree/main/packages/review-quill](https://github.com/krasnoperov/patchrelay/tree/main/packages/review-quill).

## Related

- [patchrelay: Linear issues in, pull requests out](/posts/patchrelay)
- [merge-steward: speculative integration, parallel validation, fast-forward landing](/posts/merge-steward)
- [From YOLO to patchrelay](/posts/from-yolo-to-patchrelay)
