---
title: Picking an agent harness when the SDK terms are murky
summary: The five real options for embedding a coding agent into a custom factory, why the SDK licensing question pushed me to the Codex App Server, and why session-attach belongs in the agent runtime, not the terminal layer.
publishedAt: 2026-04-07
readingTime: 11 min read
tags: software-factory, patchrelay, harness-engineering, codex, claude-code
featured: false
---

I'd been wrapping the Codex CLI in PTY primitives for weeks, hand-rolling thread state on top of a terminal multiplexer, before I read OpenAI's writeup on the App Server. The next commit (`61f0521`) deleted most of what I'd built — the largest single deletion in patchrelay's history, and the change after which everything started getting easier.

There are five real options for the harness underneath a system like this: Claude Code CLI, Codex CLI, Anthropic's Claude Agent SDK, the Codex MCP server, and the Codex App Server. Three I tried; one I ruled out for licensing; one I picked. This post is what each one is for, and where each one stopped working for me.

## The landscape

### 1. Claude Code CLI

Anthropic's flagship terminal agent. It's the best interactive agent I've used. It's also designed for an interactive human at a terminal, not for being driven by a parent process that wants to ingest its event stream. You can run it in non-interactive mode and parse its output, and people do, but you fight the tool the whole way: the JSON output schema isn't a stable contract, the tool-call rendering is meant for humans, and there's no first-class story for "another process wants to inspect what the agent is doing right now."

### 2. Codex CLI

OpenAI's open-source counterpart. Structurally similar to Claude Code: written in Rust, designed for terminal use, runs the agent loop you'd expect (user input → model → tool use → observation → response). For a long time it was the default way to run Codex from a script, and patchrelay's first runner — the version that lived under the `zmx` PTY wrapper — was effectively a child-process driver around `codex` invocations.

The Codex CLI is more script-friendly than Claude Code, in my experience. But it has the same fundamental limit: it's a terminal client, not an embeddable runtime. Driving it from another program means parsing whatever it prints and guessing when a turn is finished. Workable, but you'll keep meeting your own duct tape.

### 3. Anthropic's Claude Agent SDK

Anthropic ships a programmatic SDK (formerly the Claude Code SDK) that exposes the same core tools, permission framework, and subagent primitives. On paper this is the cleanest way to build a harness: import a library, call a function, get an agent run. No subprocesses, no PTYs, no parsing.

There's a problem I haven't been able to talk myself past. I run my factory off a subscription (Pro or Max), not a metered API key, because the economics for a single-developer setup are dramatically better. As of writing, the terms around using a paid Anthropic subscription to drive the SDK from your own software are unclear in a way that makes me uneasy. Anthropic's published guidance distinguishes between "Claude Code as a CLI," "Claude.ai web," and "API usage," and the SDK sits in a corner that overlaps all three. The ambiguity has been discussed publicly by people more legally adventurous than me.

I'm not a lawyer and I'm explicitly not making a legal claim. I'm making a personal-risk claim: the day Anthropic clarifies that the SDK is subscription-licensed under terms I can read and accept, I'll reconsider. Until then, the SDK is on the "wait" pile.

### 4. Codex MCP server

OpenAI also ships an MCP (Model Context Protocol) interface that exposes Codex through the same tool-server contract as any other MCP integration. This is the cleanest fit if you already have an MCP-based workflow and want Codex to slot into it. The OpenAI App Server article is honest about what it gives up: the richer Codex-specific session semantics — turns, items, persistent thread state, approvals — don't map naturally onto MCP's request/response shape.

### 5. Codex App Server

The Codex App Server is the option I didn't know existed when I started. OpenAI shipped it as the embedding layer between Codex core (the agent loop and thread runtime) and any UI that wants to render an agent at work. The Codex VS Code extension speaks it, and Cursor's Codex integration uses the same extension. The protocol is JSON-RPC over stdio, framed as JSONL, and it gives you primitives that nothing else on this list exposes:

- **Threads** are persistent conversation containers. You can start, resume, fork, list, and read them. A client can disconnect and reconnect later and the thread is still there.
- **Turns** are one execution pass inside a thread. The client starts a turn; the server emits progress notifications; the turn completes or fails.
- **Items** are the units of work inside a turn: user message, agent message, plan, reasoning, command execution, file change, tool call, context compaction. Each one has a `started → deltas → completed` lifecycle.
- **Approvals** are bidirectional. The server can request user approval mid-turn for a command or a file write, and the client can satisfy that request without breaking the protocol.

This is the shape I was trying to build by hand on top of the Codex CLI when I was wrapping it in PTY primitives (`3df55d2 Add PTY-backed zmx primitives and integration coverage`). Once I read OpenAI's post on the App Server I deleted most of what I'd built and replaced it with the App Server (`61f0521 Replace zmx/launcher with codex app-server pipeline engine`).

## The session-attach problem

Picking the runtime is the harness question. Picking how you watch it is the session question. They're tangled, and the version of this story where I tried to solve them separately ended in tears.

My daily setup uses [zmx](https://zmx.sh) for interactive sessions on the remote box — it lets me attach and detach from a shell without killing it, keeps native scrollback, and stays out of the way of my OS window manager. It's the lightest session-persistence tool I've found, and it's been my baseline for SSH work long before I had any agents to run. I run Ghostty as my terminal, and zmx doesn't fight that the way a heavier multiplexer would.

The natural question was whether I could push agents through the same setup. Have patchrelay spawn each agent inside a fresh zmx session on the box, then `zmx attach` from wherever I happened to be when I wanted to look in. The early commits — `3df55d2 Add PTY-backed zmx primitives and integration coverage`, `0dce116 Harden runtime session tracking against stale zmx state`, `9d68a4e Make issue stage launches durable and recoverable` — were all about making that work: spawning into the right session, tracking session state, surviving restarts.

The initial attempts weren't reliable. Spawning was fine; cleanly recovering from a crashed parent and reconnecting to whatever session an agent was supposed to be in turned out to be more state-tracking than I wanted to own. The trouble was structural: the thread state lived in a terminal layer that the agent runtime didn't know about, and reconciling those two views was its own subsystem.

The conservative move was to let the agent runtime own the thread state instead. Once patchrelay started talking to the Codex App Server, threads became durable on the App Server's side, not patchrelay's. There was no terminal session to attach to, because there was no terminal — there was a JSON-RPC stream and a thread id. Attaching to a running agent stopped being a session-management problem and became a "fetch the latest items by thread id" problem. The App Server is built for exactly this use case.

The operator UX I ended up with is small. I `ssh` into the box over Tailscale — from a MacBook, or from a phone running Echo — run `patchrelay watch <issue-id>`, and a TUI renders the current turn, command output, plan, and any pending approval. Closing the SSH session does nothing to the agent — the agent is held by the App Server, and the TUI is a stateful renderer reading items off a thread. If the network blinks I run the command again and pick up where I was. zmx is still my interactive baseline; it just isn't the agent-attach layer.

## Why the App Server won

Three concrete reasons.

First, **the licensing is unambiguous for me.** I can run Codex with my OpenAI subscription, the App Server is part of the same shipped software, and OpenAI has positioned it publicly as the integration surface. No clause I can read that I'm uncomfortable with, no terms-of-service question I'm putting off.

Second, **the primitives match what a harness needs to do.** The thread / turn / item / approval split is exactly the shape I'd been trying to build by hand. Replacing my hand-rolled state with the App Server's primitives meant deleting code, not writing more.

Third, **bidirectionality is part of the protocol, not bolted on.** The App Server emits notifications and can request approvals from the client. That isn't something I had to invent — it's there, and it means patchrelay can sit between Linear and Codex without losing the moments when the agent needs human input. Those moments become Linear `elicitation` events; the human responds in Linear; patchrelay replays the response into the App Server's pending approval. The whole flow is rendered in one place.

The cost is that the App Server is OpenAI-specific. I can drive Codex through it. I can't drive Claude through it. If I want to run a Claude-based stage in the same pipeline, I have to either use the Claude Code CLI (and accept the parsing/duct-tape tax) or wait for Anthropic to ship a comparable runtime — which they may, and I'd reconsider on the day they do.

## The caveat

Three things would make me revisit this.

1. **Anthropic ships a stable, subscription-licensed embedding runtime** with comparable primitives. The Claude Agent SDK is close to the right shape; what's missing is the licensing clarity and a public commitment to the protocol surface. Either of those would put it on the table.
2. **The Codex App Server protocol breaks backward compatibility** in a way that costs me a meaningful refactor. OpenAI's article on the App Server commits explicitly to backward compatibility, so I'd treat a break as a strong signal that the project's priorities have shifted.
3. **A new model from a third vendor** — neither Anthropic nor OpenAI — becomes good enough at coding to be worth running, with a runtime that exposes thread/turn/item-shaped primitives. The least likely of the three, and the one I'd have the most fun integrating.

The shape of the interface, in patchrelay's code, is roughly: spawn a thread, drive a turn, observe items, satisfy approvals, persist the thread id. That contract is what I'd preserve in a swap. The implementation behind the contract is the part that would change.

For the session-attach side: the rule I'd keep is that the agent runtime owns the thread state, not the terminal layer. Whatever attach mechanism I use is an opinion about the operator UX, not a load-bearing part of the agent's lifecycle. If I moved attach back into the terminal layer tomorrow, the agents wouldn't notice.

Patchrelay's harness is the most important choice in the whole factory, and it's also the one I've changed my mind about most. The current answer is "Codex App Server, with the operator attaching by thread id over a small TUI."

## Related

- [From YOLO to patchrelay](/posts/from-yolo-to-patchrelay)
- [patchrelay: Linear issues in, pull requests out](/posts/patchrelay)
