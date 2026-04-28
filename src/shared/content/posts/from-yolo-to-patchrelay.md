---
title: From YOLO to patchrelay
summary: Notes on a year of agent-driven development — permission prompts, a rented Hetzner box with nothing on it, a parallel-agent experiment that turned into merge-conflict hell, and the small annoyance that became patchrelay.
publishedAt: 2026-04-29
readingTime: 5 min read
tags: software-factory, patchrelay, agentic-development, security
featured: true
---

## Writing less code

Sometime in late 2025 I stopped writing code by hand, and it crept up on me. I didn't decide to — there was no manifesto, no talk that converted me. I just noticed, a few weeks in, that I'd been describing what I wanted in prose and reading the diff afterwards, and that this had been working well enough that picking up the keyboard again felt like a downgrade.

Around the end of last year the frontier models crossed some threshold for me where the architecture they produced was, mostly, reasonable. I didn't have to babysit every decision. I could state an idea, walk away for half an hour, and come back to something that mostly worked.

Something about that is unsettling, and I'm trying to be honest with myself about it. The tests pass. The thing ships. But a growing share of what I produce is code I didn't quite write, and I can't always explain why a particular abstraction was chosen. I don't have a clean read on what that does to me as an engineer. I'm just noting it.

## Permission prompts

The thing that almost killed agent flow for me was permission prompts.

Every command the agent wanted to run, it asked me first. I tried to allowlist my way out of it, and allowlists don't work against an agent — the model invents new command shapes constantly. A `git -c` flag I'd never seen, a one-line bash script, an argument I didn't think to whitelist. So the agent stalls, often before it's done anything useful, and I'm sitting in front of it tapping "yes" like I'm logging into my bank.

The obvious move is to turn the prompts off. Then the agent is fast. It also has my SSH keys, my browser sessions, and full access to anything on the laptop. Nothing I saw was actually malicious — not in months of running this way — but I could imagine the attack surface clearly enough: prompt injection from a web search, a poisoned npm package the model decides to try because it looked plausible. The right answer can't be that the model is well-behaved. It has to be that the agent physically can't reach the things I care about.

## Renting a box

So I rented a server. A dedicated box at [Hetzner](https://www.hetzner.com/), comfortably under $100/month, which is roughly what I was already spending on Claude and Codex subscriptions combined. I considered running everything in Docker on my laptop and decided I didn't want to find out where Docker's developer experience falls apart at agent speed. I looked at a Mac Mini and the specs didn't justify it; I looked at a Mac Studio and the math didn't work against two years of rent. I'm in Spain and the home internet is fine, but pinning a workflow to my apartment's uplink also felt wrong.

The point of the box isn't power. It's that there's nothing on it. No SSH keys to anything that matters, no browser session, no personal documents, no production credentials. The agent runs without permission prompts because there is genuinely nothing worth stealing. If the box gets compromised tomorrow, I rebuild it in an afternoon and lose nothing.

## Four agents at once

Once the box was set up, the obvious next experiment was running multiple agents in parallel. I'd been reading about parallel-agent setups for a while and wanted to see what it actually felt like. I cloned the project four times, prepared the environment in each, and pointed an agent at each of them.

I'd also moved my task tracking off GitHub Issues to [Linear](https://linear.app/) by then, which is dramatically nicer for spinning up well-scoped tasks quickly. I broke the work into four lanes, fed one to each terminal, and watched.

The first hour was magic. No permission prompts. Tools all worked. Agents installed Playwright, took screenshots, ran tests. Four lanes of progress at the same time. That's the demo every parallel-agent post is selling, and it really does work — for an hour.

Merge time is where it stops being magic. Four agents means four pull requests, and four pull requests in an actively-developed project means merge conflicts — not occasionally, but in essentially every combination. Each individual conflict is something an agent can resolve. But by then I'm a manager. I'm watching CI, restarting failed builds, deciding which PR lands first, asking each agent to rebase against whatever just landed. I hadn't written the four branches myself, so I had no intuition for which conflicts were trivial and which were going to bite. By the end of the day I'd shipped less than I would have if I'd worked one PR at a time.

## patchrelay

patchrelay didn't come from the merge problem. It came from a much smaller frustration: copy-pasting task IDs.

Every time I started an agent on something, I copied the task ID from Linear into the terminal. Then again for the next task. Then again. After enough of that it started to feel obviously wrong — agents should be receiving tasks the way a human teammate does, assigned to them, with a thread I can open and read along.

Linear stayed as my tracker. I started small, with webhooks reacting to task-status changes, and ended up looking at Linear's agent integrations, which let you delegate work to an agent directly. Somewhere in there the shape of a "software factory" loop started to suggest itself: task in, branch out, review and CI in the middle, all of it visible from the tracker without me copying anything anywhere.

patchrelay v1 is a small Node.js server. It works enough to be useful and breaks enough to remind me it's v1. The loop from task to pull request keeps failing in new and interesting ways, mostly around the review-and-CI middle. I don't know yet whether it's going to be the thing or a stepping stone to the thing. I'm going to keep building it and find out.

## PS

This post was drafted by the [Ghostwriter](https://github.com/estruyf/ghostwriter-agents-ai) skill in Claude Code from an interview I did with it, and then rewritten by hand because the first draft sounded too much like an AI doing an impression of a person. The opinions are mine throughout.

## Related

- [Picking an agent harness when the SDK terms are murky](/posts/picking-an-agent-harness)
