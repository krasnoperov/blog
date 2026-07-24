---
title: "A Linear agent that doesn't stop at the pull request"
summary: On Linear's surface, patchrelay is indistinguishable from Cursor or Devin — same protocol, same streaming thoughts, the same linked PR and diff. Two things set it apart: the work runs in my own repos, and the session doesn't end when the PR opens — it keeps reacting to review, CI, and the merge queue until the change actually lands.
publishedAt: 2026-05-29
readingTime: 5 min read
tags: software-factory, patchrelay, agentic-development, linear, codex
featured: true
---

I delegated a Linear issue to patchrelay and, a few minutes later, delegated another one to Cursor. Side by side in Linear they were the same thing: an issue with a human assignee and an agent contributor, a session panel that fills with little italic *thoughts* as the agent reads files and runs commands, a status dot that goes from thinking to working to done. If you covered the names I couldn't have told you which agent was which.

That sameness isn't an accident, and it isn't a problem. It's the whole shape of what Linear built — and once you see it, the interesting question stops being *how does patchrelay talk to Linear* and becomes *where is it allowed to be different at all*.

## The integration is a commodity

When Linear shipped its [Agent Interaction Guidelines and SDK](https://linear.app/changelog/2025-07-30-agent-interaction-guidelines-and-sdk) last July, it didn't ship a Zapier-style "connect your tool" panel. It shipped a way for an external program to *inhabit the workspace as a participant*. You install an [OAuth app in app-actor mode](https://linear.app/developers/oauth-actor-authorization) (`actor=app`), and Linear creates a workspace-scoped app identity to stand in for your agent.

From there the [agent protocol](https://linear.app/developers/agent-interaction) is small and opinionated:

- You don't get *assigned* an issue, you get **delegated** one. The human stays the assignee — the one accountable for the outcome — and your agent rides along as a contributor. Linear's [guidelines](https://linear.app/developers/aig) put the premise plainly: an agent cannot be held accountable.
- Delegation (or an `@`-mention) opens an **agent session** and fires a webhook. You have ten seconds to emit your first activity or update the session URL before Linear shows it as unresponsive — so the first thing every agent does is post a `thought` to say *I'm on it.*
- You report progress as typed **activities** — `thought`, `action`, `elicitation` (a question back), `response` (done), `error` — and Linear *infers* the session's state from whichever one you sent last. You never set a status field. Emit a question, the session shows "needs input"; emit a response, it shows "done."
- When you open a pull request, you attach its URL to the session's `externalUrls`. And Linear's GitHub integration does the rest on its own — it mirrors the PR onto the issue, with the status checks, the review state, and the diff all viewable without leaving Linear.

That visible surface is deliberately shared: a user delegates, the agent session reports state, and activities fill in the detail. Building it well is real work, but it isn't a *differentiator*, any more than speaking HTTP distinguishes a web server. It's the socket. The interesting part is what you plug into it.

I plug in two things the others mostly don't.

## One: the work runs on my box

The usual hosted-agent shape is familiar: delegate an issue and the work happens in a fresh remote sandbox that clones your repo, runs, and disappears. That's a perfectly good design, and for most people it's the right one.

patchrelay runs the other way around. The agent is a [Codex session in my actual repository](/posts/patchrelay), on a machine I own, in a [durable git worktree](/posts/picking-an-agent-harness) that survives across runs — with my toolchain, my secrets, my half-finished branch still sitting there from the last run. That *execution environment* is the one thing Linear genuinely can't see, and doesn't need to: from its side, an agent named patchrelay posts thoughts and opens a PR like everyone else.

I won't oversell this as unique. But it is the first real fork from the hosted default, and it's the reason the *second* difference is even possible.

## Two: the session doesn't end at the PR

Here's the tell. In the hosted sessions I had watched, the run terminated on the same beat: a `response` activity that said *Opened pull request #123* and a green check. Session complete. The agent did its job — it turned an issue into a PR.

And then Linear keeps showing the rest *anyway*. Its GitHub integration mirrors the PR onto the issue — the checks that go red an hour later, the review that asks for changes, the merge that does or doesn't happen. The signals are all sitting right there on the issue. The agent has just stopped listening for them; its session closed at "PR opened."

For patchrelay, *opening the PR is the middle of the session, not the end.* Because a PR isn't shipped. It's a candidate that now has to survive review and landing, and that tail is exactly where I used to lose my afternoons — [rebasing against a `main` that moved twice, restarting failed builds, re-reading a diff a reviewer bounced](/posts/from-yolo-to-patchrelay). So patchrelay keeps the session open and keeps working:

- [review-quill](/posts/review-quill) requests changes → a **review-fix** run addresses them and pushes a new head.
- CI goes red → a **ci-repair** run reads the failing check and fixes it.
- [merge-steward](/posts/merge-steward) can't integrate the change and evicts it → a **queue-repair** run rebases and resolves the conflict.

Each of those is a distinct repair loop, and each one reports back into *the same Linear session* — new thoughts, an updated plan checklist, the status dot lighting up again hours after the PR opened. The issue doesn't reach "Done" in Linear when the PR exists. It reaches Done when the change is actually on `main` — and, if I've wired up a deploy, when the deploy is green. If it gets genuinely stuck, the session says so, in writing, instead of quietly going idle.

That's the difference that matters to me. The marketplace model is **issue → pull request**. patchrelay's model is **issue → landed**. The first is the easy eighty percent; the second is the part that used to make me the bottleneck.

## Why the commodity part is the good part

It would be easy to read this as *Linear's API is generic, so I had to build the real value myself.* I read it the opposite way. Linear made the participation layer a standard on purpose — clearly-marked identity, delegation over assignment, sessions and typed activities — so that a session looks and behaves the same no matter who's behind it. That consistency is what lets me drop in an agent that's wildly different underneath without teaching anyone a new way to work. They delegate an issue and watch the thoughts roll in, same as always.

Which freed me to spend my effort in the two places the protocol deliberately leaves open: *below* it, where the work runs in my own repos, and *after* the PR, where the change still has to survive its way onto `main`. A well-behaved Linear agent that just happens not to let go until the thing is actually shipped.

## The caveat

This only makes sense while the post-PR tail is mine to own. If Linear grows a durable coding-session lifecycle that can listen to review, CI, merge-queue, and deploy events in the same way, I would reconsider keeping that loop in patchrelay. I would also revisit it if Linear changes the session/activity contract enough that maintaining the adapter becomes more work than the control it buys me.

The replaceable boundary is small: accept an issue and agent-session webhook, emit activities, attach the PR URL, and preserve the session id while repair runs happen. The current implementation behind that boundary is patchrelay plus review-quill and merge-steward. A hosted runner, a Linear-native lifecycle, or another agent runtime could replace it without changing how a person delegates work or follows its progress.
