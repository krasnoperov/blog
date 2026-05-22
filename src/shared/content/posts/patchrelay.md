---
title: 'patchrelay: a Linear-driven harness for Codex'
summary: Running coding agents on real work turned me into their full-time conductor. patchrelay is what I built to stop being the bottleneck: Linear is the control surface, runs survive restarts, and takeover is one command.
publishedAt: 2026-04-29
readingTime: 7 min read
tags: software-factory, patchrelay, agentic-development, codex, harness-engineering
featured: true
---

Sometime in March I caught myself, again, copying a Linear ticket ID into a terminal so I could paste it into a Codex prompt — for the fourth or fifth time that morning. I'd already switched between four zmx sessions in four worktrees, restarted two failed builds, and rebased one branch against a `main` that had moved twice while I wasn't looking. The agents were faster than me at writing code. I was the bottleneck.

patchrelay is what I built to stop being the bottleneck. I assign a Linear issue to it, walk away, and come back to a pull request that's implemented, reviewed, and either merged or honestly stuck with the reason in writing. Same agent I'd run myself; the surrounding machinery — durable workspace per issue, distinct repair loops, Linear glue — runs on its own.

## The harness

The Codex app-server gives me a stable JSON-RPC protocol with `codex resume` semantics. Threads persist on the server side. Turns, items, and approvals are primitives I can subscribe to. Everything else — what to run, when to run it, how to keep state across failures — patchrelay owns.

### One durable worktree per Linear issue

Every Linear issue gets a git worktree on disk that lives across runs. When the agent starts an implementation, that worktree is its scratch space. When CI fails an hour later and a `ci_repair` run kicks off, it resumes against the same worktree — the agent sees the code it just wrote, not a fresh checkout of `main`. Run state, observations, and thread IDs all persist in SQLite alongside the worktree.

The alternative is the stateless model: clone, work, throw away. That's the right model for a one-shot agent and the wrong model for an agent that should learn from its own previous turns inside an issue's lifecycle.

### Run types are not "try again"

The first version of patchrelay had one generic agent loop and a retry counter. It was bad. "The PR has failing checks, run the agent again" and "the reviewer requested changes, run the agent again" sound like the same problem and they aren't. Different inputs, different prompts, different success criteria, different reasons to escalate.

So patchrelay has six run types, and the orchestrator picks the right one based on what changed in GitHub or Linear: `implementation`, `review_fix`, `ci_repair`, `queue_repair`, `branch_upkeep`, `main_repair`. Each has its own prompt scaffold, its own context selection (the failing check logs, or the review comments, or the merge-queue eviction incident), its own retry budget. The agent doesn't have to figure out from cold context what kind of work is in front of it — the orchestrator hands it a labeled job with the inputs that make sense for the job.

### Repo-local workflow files

Every repo I work in has its own quirks: where tests live, what "done" means, which checks must be green before review is even sensible. I tried two extremes — bake the conventions into patchrelay, and let the model figure them out from a generic README — and neither worked. Baking makes the harness brittle. Asking the model to guess is right about half the time.

What works is two markdown files committed to each repo: `IMPLEMENTATION_WORKFLOW.md` for the implementation-shaped runs (implementation, ci-repair, queue-repair, main-repair) and `REVIEW_WORKFLOW.md` for the review-shaped runs (review-fix, branch-upkeep). They're short, action-oriented, human-authored. Patchrelay reads them at the start of each run and stitches them into the prompt. Durable machine-level policy lives in Codex `developer_instructions`. Per-repo behavior lives in the repo. The harness stays narrow.

### Linear is the surface

There's no patchrelay UI for daily work. An operator dashboard exists, but the daily-use surface is Linear. Assign an issue to the patchrelay app, watch the agent post a plan as agent-session activity, watch progress updates land on the issue, click through to the PR when it opens. Comments on the Linear issue forward into the active Codex session as user messages. Rejections trigger a `review_fix` run. Approvals close the issue.

Linear's agent-session integration is the part of the system I expected to fight, and didn't. The webhook surface covers what I needed; the agent-as-teammate model maps cleanly onto how I wanted to delegate work.

### Operator takeover via `codex resume`

When a run gets stuck, I could SSH in, attach to the worktree, and continue the conversation by hand. In practice I almost never do that. What I do is open another Codex session inside the same worktree with `codex resume <thread-id>` and ask it to investigate what went wrong — read the recent commits, look at the failing test, propose a hypothesis. The investigator is usually a different model, or a session running with a different `developer_instructions` profile than the original implementer.

This was the feature that pushed me toward the Codex app-server in the first place, and it's the one I'd find hardest to give up. Sending a fresh agent into the exact state another agent left behind, without losing the conversation, is what makes "an agent gets stuck" a cheap failure mode to recover from.

## What changed since the engine-choice post

Two things happened in April that didn't change my mind about the engine — they sharpened the reasons I'd made the call.

The first was the OpenClaw thing. On April 4, 2026, [Anthropic emailed Claude subscribers](https://techcrunch.com/2026/04/04/anthropic-says-claude-code-subscribers-will-need-to-pay-extra-for-openclaw-support/) that subscription quotas wouldn't cover "third-party harnesses" anymore, named OpenClaw — Peter Steinberger's open-source Claude Code-style harness — explicitly, and offered a one-month subscription credit as compensation. Continued programmatic use of subscription auth meant turning on ["extra usage"](https://support.claude.com/en/articles/12429409-manage-extra-usage-for-paid-claude-plans), which is API-tier pricing wearing a different jacket. Six days later [Steinberger's account got briefly suspended](https://techcrunch.com/2026/04/10/anthropic-temporarily-banned-openclaws-creator-from-accessing-claude/) for "suspicious signals" and reinstated a few hours after his post went viral. The previous patchrelay post was deliberately careful about Anthropic's licensing — not a legal claim, just a personal-risk claim. The OpenClaw thing was that risk turning into a bill. Anyone who'd built a service on Claude subscription auth woke up to a forced migration. The cost question — what does it actually cost to run a service on Claude — got a very specific answer: API tier, or nothing.

The second was OpenAI's [Symphony](https://github.com/openai/symphony) spec, released April 27, 2026. Symphony is an open-source specification for Codex orchestration with a reference implementation in Elixir, and it turns Linear into a control plane for coding agents. Same shape as patchrelay's: every open task gets an agent, ticket statuses act as a state machine, agents run continuously while humans review. If Symphony had existed three months earlier I'd have started from it. It didn't, I have a working stack with semantics I trust, and Symphony is explicitly framed as a reference implementation rather than a maintained product. The interesting thing about it isn't that it threatens patchrelay; it's that two teams independently arrived at the same shape. That convergence is the part I keep coming back to.

There's also a third option I keep being asked about: [pi](https://pi.dev/), Mario Zechner's open-source TypeScript agent toolkit, the same one OpenClaw was built on top of. I read through `pi-mono` more than once before picking the app-server. The reason I didn't build patchrelay on it is closer to taste than principle: I wanted to drive a specialized app-server protocol directly rather than wrap another generic harness around it. There was no dealbreaker, just a hunch that the right altitude for patchrelay was the layer below pi rather than the layer above. The choice was "drive the specialized server directly," and pi was the harness I left on the table.

## What's not in this post

The orchestration story above is half the system. The other half is two services that got pulled out of patchrelay because they were not, on closer inspection, agent work at all. [merge-steward](/posts/merge-steward) puts chaotic parallel-PR work into an order. [review-quill](/posts/review-quill) is the strict reviewer that drills the agent until the PR is right. They share no API surface with patchrelay or with each other; they coordinate only through GitHub statuses.

## Try it

```
npm install -g patchrelay
patchrelay init https://your-domain.example.com
```

Source, docs, and self-hosting instructions: [github.com/krasnoperov/patchrelay](https://github.com/krasnoperov/patchrelay).

## Related

- [From YOLO to patchrelay](/posts/from-yolo-to-patchrelay)
- [Picking an agent harness when the SDK terms are murky](/posts/picking-an-agent-harness)
- [merge-steward: a self-hosted merge queue without the Enterprise gate](/posts/merge-steward)
- [review-quill: a strict reviewer for your coding agent](/posts/review-quill)
