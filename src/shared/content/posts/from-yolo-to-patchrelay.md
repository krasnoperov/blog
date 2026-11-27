---
title: From YOLO to patchrelay
summary: "Running four coding agents moved my bottleneck from writing code to coordinating reviews, CI, and merges. That is where patchrelay started."
publishedAt: 2026-04-29
readingTime: 3 min read
tags: software-factory, patchrelay, agentic-development, security
featured: true
---

Sometime in late 2025 I stopped writing code by hand. I hadn't decided to. I just noticed that I'd spent weeks describing what I wanted in prose and reading the diff afterwards. The models' architectural choices had become reasonable enough that I could leave a task for half an hour and come back to something that mostly worked.

That still unsettles me. A growing share of what I ship is code I didn't write, and I can't always explain why a particular abstraction was chosen. I'm trying to develop that intuition by building things and seeing which choices hold up.

## Permission prompts

The first obstacle was the constant request to approve commands. I tried allowlisting them, but the agent kept finding a new shape: a `git -c` flag, a one-line shell script, an argument I hadn't anticipated. It stalled; I tapped “yes” like I was logging into my bank.

Turning prompts off solved that interruption. It also gave the agent access to my laptop's SSH keys, browser sessions, and personal files. I hadn't seen it do anything malicious, but a poisoned package or instructions in a web page seemed like plausible ways for that access to go wrong.

So I rented a dedicated [Hetzner](https://www.hetzner.com/) server for well under €100 a month. It had room for parallel agents and their browsers, and the workflow no longer depended on my apartment's internet connection.

I kept my personal documents, browser sessions, and production credentials off it. The box still held source code and the credentials needed to work on it; compromising it would matter. But an agent running there couldn't reach everything on my laptop.

## Four agents at once

zmx sessions and Git worktrees gave each branch a persistent shell in its own directory. Opening four agents was about as easy as opening four terminals. The first time I had it working, I sat there for a minute looking at it.

I'd moved task tracking to [Linear](https://linear.app/) by then. I split the work into four lanes and fed one to each terminal. For the first hour, it worked beautifully: agents installed Playwright, took screenshots, ran tests, and made progress while I watched.

Then they started merging. Branches conflicted, CI failed, and `main` kept moving while another agent rebased. Each individual conflict was something an agent could resolve. Choosing what should happen next kept falling to me.

I hadn't written those branches, so I had little intuition for which conflicts were harmless. By the end of the day I was mostly watching CI and telling agents to rebase or retry.

## patchrelay

The repeated instructions were what made me build patchrelay: check CI, read the review, fix it, rebase, try again. The agents could do the work once asked. I needed something to notice when to ask.

I started with webhooks responding to Linear status changes, then added Linear's agent integration so I could delegate an issue directly. A small Node.js server starts the agent session and reacts to CI and review events until the PR merges or needs my help. Progress stays visible in the tracker.

Version one is useful, and the review-and-CI part still fails in new ways. There's also a more basic question I haven't answered: when does writing an issue and walking away beat sitting next to the agent and steering it?

My hunch is that it depends on how well I can specify the task. I'll delegate the ones that look clear and keep the exploratory work interactive for a few weeks, then compare.

## PS

The original draft came from an interview with the [Ghostwriter](https://github.com/estruyf/ghostwriter-agents-ai) skill in Claude Code. I rewrote it by hand because it sounded like an AI doing an impression of a person. This version has since had another editorial pass; the opinions remain mine.

## Related

- [Picking an agent harness when the SDK terms are murky](/posts/picking-an-agent-harness)
