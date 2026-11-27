---
title: 'patchrelay: Linear issues in, pull requests out'
summary: "patchrelay takes a delegated Linear issue through implementation, review fixes, CI repairs, and merge, keeping the same workspace available throughout."
publishedAt: 2026-04-29
readingTime: 3 min read
tags: software-factory, patchrelay, agentic-development, codex, harness-engineering
featured: true
---

One morning in March, I caught myself copying a Linear ticket ID into a Codex prompt for the fourth or fifth time. I'd switched between four zmx sessions, restarted two failed builds, and rebased against a `main` that had moved twice.

I built patchrelay to take over that coordination. I delegate a Linear issue; it starts an agent, opens a PR, and handles the review and repair work until the PR merges or gets stuck with a reason I can read.

## A workspace that survives the run

patchrelay connects Linear to Codex App Server. The server supplies the session protocol; patchrelay decides which event starts which kind of work and when that work is done.

Each issue gets a persistent Git worktree. If CI fails an hour after implementation, the repair run returns to the same code. SQLite stores run state, observations, and thread IDs so a restart doesn't lose the issue's history.

When a run gets stuck, I can open its worktree and use `codex resume <thread-id>` to investigate. I often ask a different model, or use different instructions, to read the commits and failing tests. Having the previous conversation and files available makes that much easier than reconstructing a failed run from a log.

## Six kinds of work

The first version had one generic loop and a retry counter. That gave the agent too little guidance: a failing test and a requested review change need different evidence and have different completion conditions.

The orchestrator now selects a run type from the event:

| Run | Trigger |
|-|-|
| `implementation` | A new Linear assignment |
| `review_fix` | A reviewer requests changes |
| `ci_repair` | Required checks fail on the PR head |
| `queue_repair` | The merge queue evicts the PR |
| `branch_upkeep` | `main` advances under the branch |
| `main_repair` | `main` goes red |

Each gets the relevant context—review comments, failing logs, or the eviction incident—and its own retry budget. Exhausting that budget brings the issue back to me.

## Repository instructions

I tried baking repository conventions into patchrelay and leaving the agent to infer them from a README. Neither worked reliably.

Two committed files now describe how to work in each repository. `IMPLEMENTATION_WORKFLOW.md` covers implementation, CI repair, queue repair, and main repair. `REVIEW_WORKFLOW.md` covers review fixes and branch upkeep. They specify checks, conventions, and what counts as finished. Machine-wide policy lives in Codex `developer_instructions`.

That lets me change a project's workflow without changing the service.

## Following the issue through merge

Linear is where I use patchrelay day to day. I delegate the issue, read the plan and activity updates, and follow the link to the PR. Issue comments become user messages in the active Codex session.

Review and landing happen through [review-quill](/posts/review-quill) and [merge-steward](/posts/merge-steward). The services coordinate through GitHub reviews, checks, and webhooks. A requested change starts a repair; an approved PR with green checks can enter the queue. Approval alone doesn't finish the issue: patchrelay follows it through landing.

There is an operator dashboard, but most days I only need Linear and the PR timeline. I open the underlying session when those no longer explain why the work is stuck.

## Try it

```
pnpm add -g patchrelay
patchrelay init https://your-domain.example.com
```

Source, docs, and self-hosting instructions: [github.com/krasnoperov/patchrelay](https://github.com/krasnoperov/patchrelay).

## Related

- [From YOLO to patchrelay](/posts/from-yolo-to-patchrelay)
- [Picking an agent harness when the SDK terms are murky](/posts/picking-an-agent-harness)
- [merge-steward: speculative integration, parallel validation, fast-forward landing](/posts/merge-steward)
- [review-quill: a strict reviewer for your coding agent](/posts/review-quill)
