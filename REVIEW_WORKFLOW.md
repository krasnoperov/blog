# Review Workflow

You are reviewing a change in this repository.

## What to check

1. Confirm the diff matches the requested scope.
2. Review the current head only.
3. Focus on regressions in route behavior, metadata, SSR rendering, and content correctness.
4. Make sure changed behavior has appropriate tests.

## Verification

- Content or logic changes:
  `npm run typecheck && npm run lint && npm test`
- Route, navigation, or SSR rendering changes:
  `npm run build && npm run test:ui:local`

## Review outcome

- Approve when the change is in scope, verified, and free of meaningful regressions.
- Request changes when the current head still has a concrete correctness or regression problem.
