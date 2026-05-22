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

Something about that is unsettling, and I'm trying not to wave it off. The tests pass. The thing ships. But a growing share of what I produce is code I didn't quite write, and I can't always explain why a particular abstraction was chosen. The plan is to train the intuition the way I always have — build things, see where I land, correct, iterate, try different approaches, see which ones hold up. The shape of "writing software" is moving, and the way I map it is the way I always have: by working in it.

## Permission prompts

The thing that almost killed agent flow for me was permission prompts.

Every command the agent wanted to run, it asked me first. I tried to allowlist my way out of it, and allowlists don't work against an agent — the model invents new command shapes constantly. A `git -c` flag I'd never seen, a one-line bash script, an argument I didn't think to whitelist. So the agent stalls, often before it's done anything useful, and I'm sitting in front of it tapping "yes" like I'm logging into my bank.

The obvious move is to turn the prompts off. Then the agent is fast. It also has my SSH keys, my browser sessions, and full access to anything on the laptop. Nothing I saw was actually malicious — not in months of running this way — but I could imagine the attack surface clearly enough: prompt injection from a web search, a poisoned npm package the model decides to try because it looked plausible. The right answer can't be that the model is well-behaved. It has to be that the agent physically can't reach the things I care about.

## Renting a box

So I rented a server. A dedicated box at [Hetzner](https://www.hetzner.com/) for well under €100/month — a quarter of what the top Claude Max and ChatGPT Pro tiers cost combined, at $200/month each.

The current hype cycle around running coding agents at home has people buying Mac Minis for this: quiet, your own hardware, available 24/7. The problem is that a base Mac Mini strains the moment you have a handful of headless browsers running Playwright in parallel, which is exactly the kind of load a fleet of agents will throw at it. A loaded Mac Studio handles the workload, but against two years of Hetzner rent the math isn't close. Hetzner gives absurd value per euro, and the gap only widens at the higher tiers. I'm in Spain and the home internet is fine, but pinning a workflow to my apartment's uplink also felt wrong.

The point of the box isn't power. It's that there's nothing on it. No SSH keys to anything that matters, no browser session, no personal documents, no production credentials. The agent runs without permission prompts because there is genuinely nothing worth stealing. If the box gets compromised tomorrow, I rebuild it in an afternoon and lose nothing.

## Four agents at once

Running multiple agents in parallel wasn't really an experiment — it's what falls out of a proper setup. zmx sessions plus git worktrees give you persistent shells, one per branch in its own directory, each attachable from its own terminal window, and spinning up four agents on four worktrees is no harder than opening four terminals. The first time I had it working I just sat there for a minute looking at it.

I'd also moved my task tracking off GitHub Issues to [Linear](https://linear.app/) by then, which is dramatically nicer for spinning up well-scoped tasks quickly. I broke the work into four lanes, fed one to each terminal, and watched.

The first hour was magic. No permission prompts. Tools all worked. Agents installed Playwright, took screenshots, ran tests. Four lanes of progress at the same time. That's the demo every parallel-agent post is selling, and it really does work — for an hour.

Merge time is where it stops being magic. Four agents means four pull requests, and four pull requests in an actively-developed project means merge conflicts — not occasionally, but in essentially every combination. Each individual conflict is something an agent can resolve. But by then I'm a manager. I'm watching CI, restarting failed builds, deciding which PR lands first, asking each agent to rebase against whatever just landed. I hadn't written the four branches myself, so I had no intuition for which conflicts were trivial and which were going to bite.

By the end of the day, most of my time had gone into mechanical coordination rather than building features — and that's all work that has to be automated.

## patchrelay

The real reason I started patchrelay wasn't typing. It was that running four agents had turned me into a full-time conductor — most of what I did all day was telling each one to go check CI, fix what was broken, rebase against whatever had just landed, run the build again. The agents could do all of that work themselves; what they couldn't do was decide on their own when to do it. (This was a couple of weeks before `/loop` landed in Claude Code, which closes a meaningful chunk of this gap on its own. At the time there was no built-in option, so I started building one.)

The shape of the answer was clear enough: something that could pull a task from Linear, kick off an agentic session against it, listen for webhooks from CI and review, and keep steering the agent until the PR was green, conflict-free, and merged. Not a copy-paste helper — actual orchestration around an agent session.

Linear stayed as the tracker. I started small, with webhooks reacting to status changes, and worked outward from there into Linear's agent integrations, which let you delegate a task to an agent directly. Each new piece pulled the loop closer to running on its own: task in, branch out, review and CI iterating in the middle, all of it visible from the tracker.

patchrelay v1 is a small Node.js server. It works enough to be useful and breaks enough to remind me it's v1 — the loop from task to pull request keeps failing in new and interesting ways, mostly around the review-and-CI middle. I don't know yet whether it's going to be the thing or a stepping stone to the thing. I'm going to keep building it and find out.

Two lanes on the same box now: interactive zmx sessions where Claude or Codex sits next to me as I triage and shape, and delegated work through patchrelay, where I write a Linear issue and walk away. The interactive lane is where direction gets set; the delegated lane is where routine work goes.

## PS

This post was drafted by the [Ghostwriter](https://github.com/estruyf/ghostwriter-agents-ai) skill in Claude Code from an interview I did with it, and then rewritten by hand because the first draft sounded too much like an AI doing an impression of a person. The opinions are mine throughout.

## Related

- [Picking an agent harness when the SDK terms are murky](/posts/picking-an-agent-harness)
