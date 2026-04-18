---
title: Picking an agent harness when the SDK terms are murky
summary: The five honest options for embedding a coding agent into a custom factory, why the SDK licensing question pushed me to the Codex App Server, and why I stopped fighting tmux for session attach.
publishedAt: 2026-04-07
readingTime: 11 min read
tags: software-factory, patchrelay, harness-engineering, codex, claude-code
featured: false
---

## The choice patchrelay couldn't dodge

Once you have a server and a coordinator, the next question is unavoidable: what actually runs the agent loop? Something has to hold the conversation, dispatch tool calls, ask for approvals, persist thread state across restarts, and emit enough events back out that you can render what's happening. That something is the harness, and you do not get to skip picking one.

I want to lay out the choices I looked at before I picked, because the decision is more interesting than the answer. If you read the research notes I leaned on (`~/vault/notes/research/20260324_unlocking_the_codex_harness_app_server.md` and `20260317-patchrelay-agent-pipeline-landscape.md`) you'll see the same survey from a different angle — this post is the version that's grounded in what I actually tried and which commits in patchrelay represent the changes of mind.

## The landscape

I count five honest options for "thing patchrelay can call to make an agent do work". They are not interchangeable, and the differences are sharper than the marketing suggests.

### 1. Claude Code CLI

Anthropic's flagship terminal agent. It is the best interactive agent I have used. It is also designed for an interactive human at a terminal, not for being driven by a parent process that wants to ingest its event stream. You can run it in non-interactive mode and parse its output, and people do, but you fight the tool the whole way: the JSON output schema is not a stable contract, the tool-call rendering is meant for humans, and there's no first-class story for "another process wants to inspect what the agent is doing right now".

For an interactive workflow on your own laptop, Claude Code is the right tool. For a custom harness that wants to own the orchestration and treat the agent as a worker, it's the wrong shape.

### 2. Codex CLI

OpenAI's open-source counterpart. It is structurally similar to Claude Code: written in Rust, designed for terminal use, runs the same agent loop you would expect (user input → model → tool use → observation → response). For a long time it was the default way to run Codex from a script, and patchrelay's first runner (the version that lived under the `zmx` PTY wrapper) was effectively a child-process driver around `codex` invocations.

The Codex CLI is more script-friendly than Claude Code is, in my experience. But it has the same fundamental limit: it's a terminal client, not an embeddable runtime. Driving it from another program means parsing whatever it prints and guessing when a turn is finished. Workable, but you'll keep meeting your own duct tape.

### 3. Anthropic's Claude Agent SDK

Anthropic ships a programmatic SDK (formerly the Claude Code SDK) that exposes the same core tools, permission framework, and subagent primitives. On paper this is the cleanest way to build a harness: you import a library, you call a function, you get an agent run. No subprocesses, no PTYs, no parsing.

There is a problem I have not been able to talk myself past. I run my factory off a subscription (Pro or Max), not a metered API key, because the economics for a single-developer setup are dramatically better. As of writing, the terms around using a paid Anthropic subscription to drive the SDK from your own software are unclear in a way that makes me uneasy. Anthropic's published guidance distinguishes between "Claude Code as a CLI", "Claude.ai web", and "API usage", and the SDK sits in a corner that overlaps all three. There is video commentary out there from people more legally adventurous than me that walks through the exact ambiguity — search for "Theo Claude Code SDK terms" and you'll find the canonical complaint.

I am not a lawyer and I am explicitly not making a legal claim. I am making a personal-risk claim: the day Anthropic clarifies that the SDK is subscription-licensed under terms I can read and accept, I will reconsider. Until that happens, the SDK is on the "wait" pile.

### 4. Codex MCP server

The Codex team also ships an MCP (Model Context Protocol) interface that exposes Codex through the same tool-server contract as any other MCP integration. This is the cleanest fit if you already have an MCP-based workflow and want Codex to slot into it. The OpenAI App Server article is honest about what it gives up: the richer Codex-specific session semantics — turns, items, persistent thread state, approvals — do not map naturally onto MCP's request/response shape.

If you're building something MCP-shaped, this is your lane. If you're building something that wants to *be* an agent runtime rather than consume one, it isn't.

### 5. Codex App Server

The Codex App Server is the option I didn't know existed when I started. OpenAI shipped it as the embedding layer between Codex core (the agent loop and thread runtime) and any UI that wants to render an agent at work. The Codex CLI itself is being refactored to use it. The VS Code extension uses it. Cursor's Codex integration uses it. The protocol is JSON-RPC over stdio, framed as JSONL, and it gives you primitives that nothing else on this list exposes:

- **Threads** are persistent conversation containers. You can start, resume, fork, list, and read them. A client can disconnect and reconnect later and the thread is still there.
- **Turns** are one execution pass inside a thread. The client starts a turn; the server emits progress notifications; the turn completes or fails.
- **Items** are the units of work inside a turn: user message, agent message, plan, reasoning, command execution, file change, tool call, context compaction. Each one has a `started → deltas → completed` lifecycle.
- **Approvals** are bidirectional. The server can request user approval mid-turn for a command or a file write, and the client can satisfy that request without breaking the protocol.

This is the shape I was trying to build by hand on top of the Codex CLI when I was wrapping it in PTY primitives (`3df55d2 Add PTY-backed zmx primitives and integration coverage`). Once I read OpenAI's post on the App Server I deleted most of what I had built and replaced it with the App Server (`61f0521 Replace zmx/launcher with codex app-server pipeline engine`). That commit is the largest single deletion in patchrelay's history. It is also the change after which everything started getting easier.

## The session-attach problem

Picking the runtime is the harness question. Picking how you watch it is the session question. They are tangled, and the version of this story where I tried to solve them separately ended in tears.

The default answer to "how do I attach to a long-running agent on a remote box" is tmux. Anthropic's own Claude Code Agent Teams feature requires tmux (v2.1.32+) for parallel agent coordination. Most of the public tutorials for running coding agents on a Hetzner box reach for tmux on the first page. It works.

I do not like tmux for this. The reasons are mostly aesthetic and a few are not. Aesthetic: the keybindings are forty years old, the configuration is its own dialect, and it does not play well with modern terminal emulators (I run Ghostty and the `xterm-ghostty` terminal type breaks tmux in annoying ways). Not aesthetic: tmux is fundamentally a multiplexer, which means it owns the terminal state and the agent runs underneath as a child of the multiplexer. That coupling means the agent's lifecycle is tied to tmux's lifecycle, which means crash recovery, restart, and "I want to attach from a different machine" all become tmux problems instead of agent-runtime problems.

The first version of patchrelay handled this by inventing its own multiplexer. The early commits — `3df55d2 Add PTY-backed zmx primitives`, `0dce116 Harden runtime session tracking against stale zmx state`, `9d68a4e Make issue stage launches durable and recoverable` — were all about wrapping each agent run in a pseudo-terminal that patchrelay owned, persisting the state of those terminals, and letting an operator attach to them by name. This was zmx. It was hand-rolled, it was complicated, and it had exactly the same fundamental flaw as tmux: a stateful terminal layer that the agent runtime did not know about.

The fix was to move the thread state from "the terminal layer" to "the agent runtime layer". Once patchrelay started talking to the Codex App Server, threads became durable on the App Server's side, not on patchrelay's side. There was no longer a terminal session to attach to, because there was no terminal — there was a JSON-RPC stream and a thread id. Attaching to a running agent stopped being a session-management problem and became a "fetch the latest items by thread id" problem.

The operator UX I ended up with is small. From any device with a Tailscale connection to the box, I `ssh` in, run a small CLI command (`patchrelay watch <issue-id>`), and a TUI renders the current turn, command output, plan, and any pending approval. Closing the SSH session does nothing to the agent — the agent is held by the App Server, and the TUI is just a stateful renderer that's reading items off a thread. If the network blinks I run the command again and pick up where I was.

Mosh helps for the network layer. Tailscale handles the authentication and the addressing. Neither is a multiplexer, and neither owns the agent's state.

## Why the App Server won

I picked the Codex App Server for three concrete reasons.

First, **the licensing is unambiguous for me**. I can run Codex with my OpenAI subscription, the App Server is part of the same shipped software, and OpenAI has positioned it publicly as the integration surface. There is no clause I can read that I'm uncomfortable with, and there is no terms-of-service question I'm putting off.

Second, **the primitives match what a harness needs to do**. The thread / turn / item / approval split is exactly the shape I had been trying to build by hand. Replacing my hand-rolled state with the App Server's primitives meant deleting code, not writing more.

Third, **bidirectionality is part of the protocol, not bolted on**. The App Server emits notifications and can request approvals from the client. That's not a thing I had to invent — it's there, and it means patchrelay can sit between Linear and Codex without losing the moments when the agent needs human input. Those moments become Linear `elicitation` events; the human responds in Linear; patchrelay replays the response into the App Server's pending approval. The whole flow is rendered in one place.

The cost is that the App Server is OpenAI-specific. I can drive Codex through it. I cannot drive Claude through it. If I want to run a Claude-based stage in the same pipeline, I have to either use the Claude Code CLI (and accept the parsing/duct-tape tax) or wait for Anthropic to ship a comparable runtime — which they may, and I would happily reconsider on the day they do.

## The caveat

Three things would make me revisit this.

1. **Anthropic ships a stable, subscription-licensed embedding runtime** with comparable primitives. The Claude Agent SDK is close to the right shape; what's missing is the licensing clarity and a public commitment to the protocol surface. Either of those would put it on the table.
2. **The Codex App Server protocol breaks backward compatibility** in a way that costs me a meaningful refactor. OpenAI's article on the App Server commits explicitly to backward compatibility, so I'd treat a break as a strong signal that the project's priorities have shifted.
3. **A new model from a third vendor** — neither Anthropic nor OpenAI — becomes good enough at coding to be worth running, with a runtime that exposes thread/turn/item-shaped primitives. This is the least likely of the three but the one I'd have the most fun integrating.

The shape of the interface, in patchrelay's code, is roughly: spawn a thread, drive a turn, observe items, satisfy approvals, persist the thread id. That contract is what I'd preserve in the swap. The implementation behind the contract is the part that would change.

For the session-attach side: the rule I'd keep is that the agent runtime owns the thread state, not the terminal layer. Whatever multiplexer or attach mechanism I use is an opinion about the operator UX, not a load-bearing part of the agent's lifecycle. If I went back to tmux tomorrow, the agents would not notice.

Patchrelay's harness is the most important choice in the whole factory, and it is also the one I've changed my mind about most. The current answer is "Codex App Server, with the operator attaching by thread id over a small TUI". The next answer might be different. The interface is what I'm trying to keep stable.

## Related

- [From YOLO to patchrelay](/posts/from-yolo-to-patchrelay)
- [The naive loop and why it broke](/posts/naive-loop-broke)
