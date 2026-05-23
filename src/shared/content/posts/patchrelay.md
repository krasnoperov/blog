---
title: 'patchrelay: Linear issues in, pull requests out'
summary: patchrelay is the deterministic orchestration layer that turns a delegated Linear issue into a linked pull request and keeps that PR healthy until merge or close.
publishedAt: 2026-04-29
readingTime: 5 min read
tags: software-factory, patchrelay, agentic-development, codex, harness-engineering
featured: true
---

Sometime in March I caught myself, again, copying a Linear ticket ID into a terminal so I could paste it into a Codex prompt — for the fourth or fifth time that morning. I'd already switched between four zmx sessions in four worktrees, restarted two failed builds, and rebased one branch against a `main` that had moved twice while I wasn't looking. The agents were faster than me at writing code. I was the bottleneck.

patchrelay is what I built to stop being the bottleneck. I assign a Linear issue to it, walk away, and come back to a pull request that's implemented, reviewed, and either merged or honestly stuck with the reason in writing. Same agent I'd run myself; the surrounding machinery — durable workspace per issue, distinct repair loops, Linear glue — runs on its own.

## The harness

patchrelay is the deterministic orchestration layer between Linear and Codex. The Codex app-server gives me JSON-RPC, `codex resume`, and a session protocol — primitives, not a system. Everything that turns a Linear issue into a healthy pull request — which run type to fire on which event, where state lives across restarts, what counts as done — patchrelay owns. The model is good at writing code; everything around it is a control problem.

### One durable worktree per Linear issue

Every Linear issue gets a git worktree on disk that lives across runs. When the agent starts an implementation, that worktree is its scratch space. When CI fails an hour later and a `ci_repair` run kicks off, it resumes against the same worktree — the agent sees the code it just wrote, not a fresh checkout of `main`. Run state, observations, and thread IDs all persist in SQLite alongside the worktree.

The alternative is the stateless model: clone, work, throw away. That's the right model for a one-shot agent and the wrong model for an agent that should learn from its own previous turns inside an issue's lifecycle.

### Run types are not "try again"

The first version of patchrelay had one generic agent loop and a retry counter. It was bad. "The PR has failing checks, run the agent again" and "the reviewer requested changes, run the agent again" sound like the same problem and they aren't. Different inputs, different prompts, different success criteria, different reasons to escalate.

So patchrelay has six run types, and the orchestrator picks the right one based on what changed in GitHub or Linear:

- `implementation` — new Linear assignment
- `review_fix` — `REQUEST_CHANGES` review posted on the PR
- `ci_repair` — required checks failing on the PR head
- `queue_repair` — merge-steward evicted the PR from the queue
- `branch_upkeep` — `main` advanced under the PR
- `main_repair` — `main` itself went red

Each has its own prompt scaffold, its own context selection (the failing check logs, or the review comments, or the merge-queue eviction incident), its own retry budget. The agent doesn't have to figure out from cold context what kind of work is in front of it — the orchestrator hands it a labeled job with the inputs that make sense for the job.

### Repo-local workflow files

Every repo I work in has its own quirks: where tests live, what "done" means, which checks must be green before review is even sensible. I tried two extremes — bake the conventions into patchrelay, and let the model figure them out from a generic README — and neither worked. Baking makes the harness brittle. Asking the model to guess is right about half the time.

What works is two markdown files committed to each repo: `IMPLEMENTATION_WORKFLOW.md` for the implementation-shaped runs (implementation, ci-repair, queue-repair, main-repair) and `REVIEW_WORKFLOW.md` for the review-shaped runs (review-fix, branch-upkeep). They're short, action-oriented, human-authored. Patchrelay reads them at the start of each run and stitches them into the prompt. Durable machine-level policy lives in Codex `developer_instructions`. Per-repo behavior lives in the repo. The harness stays narrow.

### Linear is the control plane

There's no patchrelay UI for daily work. An operator dashboard exists, but the daily-use surface is Linear. Assign an issue to the patchrelay app, watch the agent post a plan as agent-session activity, watch progress updates land on the issue, click through to the PR when it opens. Comments on the Linear issue forward into the active Codex session as user messages. Rejections trigger a `review_fix` run. Approvals close the issue.

The four events I rely on — issue assignment, comment, status change, approval — are all real Linear webhooks, and the agent's session activity feed lands back on the issue without me wiring anything. Linear isn't a backlog poller in this design; it's the control plane.

### Operator takeover via `codex resume`

When a run gets stuck, I could SSH in, attach to the worktree, and continue the conversation by hand. In practice I almost never do that. What I do is open another Codex session inside the same worktree with `codex resume <thread-id>` and ask it to investigate what went wrong — read the recent commits, look at the failing test, propose a hypothesis. The investigator is usually a different model, or a session running with a different `developer_instructions` profile than the original implementer.

This was the feature that pushed me toward the Codex app-server in the first place, and it's the one I'd find hardest to give up. Sending a fresh agent into the exact state another agent left behind, without losing the conversation, is what makes "an agent gets stuck" a cheap failure mode to recover from.

## What's not in this post

The orchestration story above is half the system. The other half is two services that got pulled out of patchrelay because they were not, on closer inspection, agent work at all. [merge-steward](/posts/merge-steward) puts chaotic parallel-PR work into an order. [review-quill](/posts/review-quill) is the strict reviewer that drills the agent until the PR is right. They share no API surface with patchrelay or with each other; they coordinate only through GitHub statuses.

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
