---
title: From YOLO to patchrelay
summary: Permission prompts killed agent velocity. A rented VPS fixed security. Four parallel agents created a merge mess. Copy-pasting task IDs created patchrelay.
publishedAt: 2026-04-07
readingTime: 5 min read
tags: software-factory, patchrelay, agentic-development, security
featured: true
---

## The mental shift

The transition was calm. Gradual. Sometime in late 2025 I stopped writing code directly and started describing what I wanted in prose. Not because I read a blog post about it or watched a talk. Just because the models got good enough.

Around December 2025, GPT-5.3 and Opus 5.3 crossed a quality threshold. The architecture they produced was reasonable. You didn't need to babysit every decision. You could express an idea, walk away, and come back to something that mostly worked. The gap between "I have an idea" and "I have working code" shrank dramatically.

But something else shifted too. You lose grip on decisions. Sometimes it's no longer your ideas — it's a black box. The code works, the tests pass, and you can't fully explain why a particular abstraction was chosen. That's the trade-off. Faster output, less authorship. I'm still in the process of understanding how that changes what "writing software" means.

## The permission brake

The speed gain had an armed brake on it: permission prompts.

Every time the agent wanted to run a command, it asked. Every time. The allowlist approach failed immediately. Models constantly invented new command variants — bash scripts, `git -c` flags, argument shapes you'd never seen before. You can't pattern-match against creativity. Tasks would stall before the model had even started doing useful work.

So you turn the prompts off. Now the agent is fast. It also has your SSH keys, your personal documents, your privileged access. Everything on the notebook.

I never saw anything actually dangerous. Not once. But I can imagine the attack vectors: prompt injection via web search, a malicious npm package suggestion. The model is reliable enough not to spoil its own work. Security should come from physical restrictions — an agent should not be able to interact with sensitive resources in the first place. I wasn't ready for unrestricted local access.

## The VPS

Never tried Docker. Great for servers and testcontainers but terrible developer experience. Didn't want to find out the issues.

[Hetzner](https://www.hetzner.com/): a dedicated server under $100/month. Comparable to $200 in combined Claude and Codex subscriptions. A Mac Mini has worse specs. A Mac Studio is too expensive — won't beat renting for a couple of years. No home internet dependency either, though Spain has reliable internet.

The reasoning is simple. The instance has nothing sensitive on it. No personal documents, no production credentials, no browser sessions. The agent runs unrestricted because there's nothing worth stealing. Security through absence.

## Four agents on OpenClaw

During the [OpenClaw](https://github.com/openclaw/openclaw) hype, I tried running agents in parallel. Project cloned, environment ready. Easy to log in to Codex, harder for Claude but manageable.

I tried [Linear](https://linear.app/) as a task tracker instead of GitHub Issues. Easy to spin up agents for detailed plans: main feature, billing, observability. Feed them to four terminals. Agents go brrrr.

No permission requests. All tools work. Agents install Playwright, capture screenshots. Everything worked like a charm — until merge time.

Four agents means four PRs. Four PRs in an actively developed project means merge conflicts. Each conflict can be resolved by an agent, but now you're micromanaging all of them, watching CI, repairing builds. You didn't write those four PRs yourself so you couldn't prevent the conflicts. The parallelism bought speed and sold control.

## patchrelay

patchrelay was not born from the merge conflicts. It was born from copy-pasting task IDs.

When you have a task tracker you still need to copy the task ID to the terminal every time you start an agent on something. Over and over. The obvious idea: agents should receive tasks automatically, in a way where you can open a session to review what they're doing.

Linear stuck as the tracker. I started with webhooks about task statuses. Then I discovered Linear's agentic integrations — delegating tasks directly is interesting. There's potential here for something like a software factory core.

patchrelay v1: a Node.js server, decent code quality, user-primitive webhooks. It stuck often trying to build the implement/CI/review pipeline. The loop from task to pull request kept breaking in new ways.

Still figuring it out. Will it work? Let's find out.

## PS

This post was written using the [Ghostwriter](https://github.com/estruyf/ghostwriter-agents-ai) skill in Claude Code. I did an interview, the skill captured the material, and the Writer agent drafted the post from my answers. The voice and opinions are mine. The typing isn't.

## Related

- [Picking an agent harness when the SDK terms are murky](/posts/picking-an-agent-harness)
