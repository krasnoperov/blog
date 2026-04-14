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
