---
title: "A Linear agent that doesn't stop at the pull request"
summary: "patchrelay uses Linear’s standard agent interface, runs in persistent worktrees, and keeps the session active through review, CI repairs, and landing."
publishedAt: 2026-05-29
readingTime: 3 min read
tags: software-factory, patchrelay, agentic-development, linear, codex
featured: true
---

I delegated one Linear issue to patchrelay and another to Cursor. Both showed a human assignee, an agent contributor, a session panel with progress updates, and a linked PR. Without the names, I would have struggled to tell them apart.

Linear provides that shared interface. The parts I needed to control were where the agent ran and what happened after it opened a PR.

## The Linear interface

The [Agent Interaction Guidelines and SDK](https://linear.app/changelog/2025-07-30-agent-interaction-guidelines-and-sdk) give external agents a workspace identity through an [OAuth app in app-actor mode](https://linear.app/developers/oauth-actor-authorization), using `actor=app`.

The [protocol](https://linear.app/developers/agent-interaction) I integrated has four parts:

- Delegation keeps the human as assignee and adds the agent as a contributor. The [guidelines](https://linear.app/developers/aig) leave accountability with the human.
- Delegation or an `@`-mention starts a session and sends a webhook. The agent has ten seconds to emit an activity or update the session URL before it appears unresponsive.
- Activities such as `thought`, `action`, `elicitation`, `response`, and `error` determine the visible session state. An `elicitation` asks for input; a `response` marks completion.
- The agent attaches the PR to `externalUrls`. Linear's GitHub integration mirrors its checks, reviews, and diff onto the issue.

That gives me an interface people already know how to use. I don't need a separate dashboard for assigning work or reading progress.

## A workspace that survives the run

patchrelay runs a [Codex session in my repository](/posts/patchrelay), in a durable Git worktree on my own machine. The toolchain and branch are still there when the next run starts.

This suits the work after implementation: a failing check can send the agent back into the state it left behind. Linear sees the same session activities regardless of where that work runs.

## After the PR opens

The hosted sessions I had watched ended with a response announcing the PR. Linear continued to display later CI failures and review requests through its GitHub integration, but those signals no longer had an agent responding to them.

That was the work I wanted patchrelay to handle. Rebasing, repairing CI, and responding to review had been taking [most of my coordination time](/posts/from-yolo-to-patchrelay).

In the workflow described here:

- A change request from [review-quill](/posts/review-quill) starts `review_fix` with the review as input.
- Failed CI starts `ci_repair` with the failing logs.
- An eviction from [merge-steward](/posts/merge-steward) starts `queue_repair` with the integration failure.

Those runs report into the same Linear session. Opening a PR doesn't mark the issue Done; landing on `main` does, with a successful deployment also required when that integration is configured. If repair cannot finish, the session records why it stopped.

## What I would replace

I would reconsider this loop if Linear supplied a durable coding-session lifecycle that handled review, CI, queue, and deployment events. Maintaining an adapter would also become questionable if the session contract changed frequently.

The boundary is limited: accept issue and session webhooks, emit activities, attach the PR URL, and retain the session ID across repairs. Another runner could implement it. The thing I'd need to verify is whether it follows a failed review or deployment all the way through to resolution.
