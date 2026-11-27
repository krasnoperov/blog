---
title: Picking an agent harness when the SDK terms are murky
summary: "I replaced patchrelay’s terminal-driven Codex runner with App Server so the agent runtime could own conversation state. Here is the April 2026 reasoning and what would make me reconsider."
publishedAt: 2026-04-07
readingTime: 3 min read
tags: software-factory, patchrelay, harness-engineering, codex, claude-code
featured: false
---

I'd spent weeks wrapping the Codex CLI in PTY primitives before I read about Codex App Server. I was tracking agent conversations through a terminal multiplexer and trying to recover that state after crashes. App Server already exposed much of what I was building.

I replaced the runner in [`61f0521`](https://github.com/krasnoperov/patchrelay/commit/61f0521f3bd383953c911fd735077c86c689f074), `Replace zmx/launcher with codex app-server pipeline engine`. The choice was partly about session control and partly about whether I felt comfortable using a subscription through the available interfaces. This is how I reached it in April 2026.

## The interfaces I considered

Claude Code was my favourite interactive agent. Codex CLI was what patchrelay's first runner drove through zmx. Both worked at a terminal, but my PTY-based integration left me parsing output and tracking completion from outside the agent. I wanted a protocol that represented the work directly.

The Claude Agent SDK offered programmatic access to tools, permissions, and subagents. I was running on a Pro or Max subscription rather than a metered API key, though, and I wasn't confident that the subscription terms covered the integration I wanted. I put it aside. That was my decision at the time, not a finding about what the terms allow today.

Codex's MCP server fit workflows already built around MCP tools. For patchrelay, I wanted more direct access to persistent conversations, individual turns, progress events, and approval requests.

Codex App Server exposed those through JSON-RPC over stdio, with JSONL framing. Its vocabulary matched the state I needed:

- A **thread** holds a conversation that can be resumed.
- A **turn** is one execution pass within it.
- **Items** describe the messages, commands, file changes, and other work in that turn, with progress notifications.
- **Approval requests** let the server pause for a decision from the client.

That gave patchrelay a thread ID to persist and events it could interpret without scraping a terminal screen.

## Watching a run without owning its terminal

I already used [zmx](https://zmx.sh) for remote shells. It kept sessions alive when I disconnected, preserved native scrollback, and worked well with Ghostty. Spawning each agent in a zmx session seemed like a natural way to make runs attachable.

Spawning worked. Recovery was where it got complicated: after a parent process crashed, patchrelay had to reconcile its idea of a run with whatever was still alive in the terminal layer. I was maintaining two views of the same session.

With App Server, the agent runtime owned the conversation. patchrelay retained the thread ID, and the interface could read its items. A terminal session was no longer necessary to inspect the work.

The operator interface became `patchrelay watch <issue-id>`. I could SSH over Tailscale from my MacBook—or from Echo on my phone—and see the current turn, command output, plan, and pending approval. Closing that viewer didn't stop the agent. After a dropped connection, I could run it again.

I kept zmx for interactive shells. It no longer had to carry patchrelay's run state.

## Human input and another runtime

App Server also gave me a way to route approval requests through Linear. patchrelay could post an `elicitation` activity, wait for the person's answer, and return it to the pending request. I didn't have to invent a separate convention for a question buried in terminal output.

I was comfortable using the shipped Codex integration with my OpenAI subscription, and its thread, turn, item, and approval model reduced the amount of state patchrelay had to own.

The cost was committing that runner to Codex. Running Claude in the same pipeline would need another adapter. I'd reconsider if a different model justified the work, or if maintaining the App Server integration became expensive.

The interface I'd want to preserve is small: start or resume a thread, drive a turn, observe its items, answer requests, and save its ID. Whether another runtime can support that cleanly is what I'd check first.

## Related

- [From YOLO to patchrelay](/posts/from-yolo-to-patchrelay)
- [patchrelay: Linear issues in, pull requests out](/posts/patchrelay)
