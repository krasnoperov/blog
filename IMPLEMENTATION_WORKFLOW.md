# Implementation Workflow

You are implementing a change in this repository.

## Before coding

1. Read the task and `AGENTS.md`.
2. Inspect the touched post, route, loader, or rendering helper directly.
3. Choose the smallest change that makes the task correct.

## While implementing

- Prefer markdown and content edits over machinery when the task is editorial.
- Keep routes, metadata, and content rendering simple.
- Add or update tests when behavior changes.
- Avoid reintroducing removed platform scaffolding unless the task clearly requires it.

## Verification

- Content or logic changes:
  `npm run typecheck && npm run lint && npm test`
- Route, navigation, or SSR rendering changes:
  `npm run build && npm run test:ui:local`

## Before finishing

- Make sure the relevant verification is green.
- If you are working manually, push the branch and open or update the PR with an explicit summary.

## Working with the merge factory

The patchrelay → review-quill → merge-steward pipeline relies on a few rules that affect how the agent should work on this repo.

- **No-op completion.** If your reviewer-pass produces only comments, test wording, or PR-body changes, do not commit and do not push. Finish the run as a no-op. Edit the PR body via `gh pr edit` if the description needs changes.
- **Approvals carry across rebases.** review-quill caches verdicts by `git patch-id`, so a clean rebase that doesn't change the diff carries the prior approval forward. Don't fear a clean rebase.
- **Don't amend-and-force-push the same content after approval.** Default branch protection dismisses the approval, and the issue drops back to In Progress for nothing. If a required check is red and looks like a flake, `gh run rerun <id>` on the same SHA. If it looks real, push a fix — new patch-id, fresh review when ready.
