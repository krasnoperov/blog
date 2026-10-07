---
title: 'The orchestrator moved into the session'
summary: 'patchrelay delivered a couple of thousand PRs for me. Since Opus 5.5, the main Claude Code session plans, delegates, and reviews on its own, so I no longer break work into Linear issues. The gates stayed: review-quill and merge-steward are still how anything lands.'
publishedAt: 2026-10-08
readingTime: 5 min read
tags: software-factory, patchrelay, agentic-development, claude-code, review-quill, merge-steward
featured: true
---

In [the last post about the factory](/posts/gates-not-autonomy) I wrote that the autonomy turned out to be the part of patchrelay I reach for least deliberately, and that what really changed how I ship was the two gates under it. A few months later that has gone further than I expected. The autonomy hasn't disappeared. It moved out of my orchestration layer and into the agent session itself.

```image
/media/posts/orchestrator-moved-into-the-session.webp
Many threads gather into one loop; a single line leaves it through two gates.
```

## What patchrelay gave me

I want to be fair to it first, because it earned that. patchrelay has delivered a couple of thousand PRs for me. The loop worked the way I hoped when I built it: write a Linear issue, delegate it, go do something else, and come back to production already updated. For a one-person setup that's an absurd amount of leverage, and I don't regret a single commit I put into it.

But the loop had a price I'd stopped noticing. Before anything could be delegated, I had to do the decomposition: turn an idea into well-specified issues, pin down the forks, sequence them so two branches wouldn't race each other into the queue. patchrelay was very good at executing a plan. Making the plan was still my job.

## What changed with Opus 5.5

Since Opus 5.5, I mostly don't write those issues anymore. I describe what I want to the main Claude Code session, and it does the breakdown itself. It runs subagents for the parallel parts. It calls Codex for an independent review of its own diff. It runs evals when the change needs them. When it notices work that's adjacent but out of scope, it raises it as a separate task chip instead of either ignoring it or quietly widening the PR, and the main session can keep talking to those chips while they run.

That is most of what I built patchrelay's orchestration for: holding a task, spawning work, watching it, steering it back. Except now the planning happens in the same context as the execution, so nothing is lost in a hand-off to a Linear ticket. The forks I complained about in the last post, where an autonomous run picks a branch and I only find out from the diff, come up in the conversation where I can still answer them.

The part that surprised me is where it showed up. Codex desktop is a great way to keep all my chats in one place, and I'd have guessed that's where a real ADE, an agent development environment, would grow. It turned out to be Claude Code. The difference isn't the shell around the model. It's that Opus 5.5 delivers, while Astra develops: one hands me a change that's planned, reviewed, and ready to land, and the other hands me progress.

## What survived: the gates

None of that changed the bottom of the pipeline. Whether the main session wrote the code, a subagent did, or patchrelay did, the PR still goes through the same two gates.

`review-quill` is still the one I lean on hardest, and it's better now than when I wrote about it. In the last post I said a larger team would build eval suites for the reviewer while I made do with reading transcripts. I ended up building them. The main thing the evals taught it was to stop overreacting. Its favorite way of doing that was finding scaling problems in code that is still looking for product-market fit. A feature that may not exist next month doesn't need to be ready for a hundred times the traffic it doesn't have yet. Once it learned to weigh a finding against where the product actually is, the noise dropped, and what's left is useful. It catches the non-obvious things the main session hadn't thought about, even a session that has already reviewed its own diff with Codex.

That's the argument for an independent reviewer that I find convincing now. It isn't "a second opinion." It's that a different process, with a different prompt and no stake in the change, looks at different things. The session that wrote the change is, by construction, the worst-placed reader of its own blind spots.

`merge-steward` hasn't changed at all, which is the point. It takes a PR that's green and approved, tests it as it would exist on `main`, and lands it. I almost never think about it. That's exactly what I want from a merge queue.

## The part I'd still replace

CI still runs on GitHub Actions. My complaint is the runner architecture. I have a powerful server that CI runs on, and it's hard to make Actions use it concurrently: the runner model thinks in terms of one job per runner, so a machine that could run a dozen pipelines at once spends most of its time waiting on a queue. But Actions are easier to keep using than to replace, and I haven't hit a problem painful enough to justify building my own. So they stay, grudgingly.

## The shape now

So the picture has moved again. A year ago I was the orchestrator, switching between four terminals and telling each agent when to rebase. Then patchrelay was the orchestrator, and my job shrank to writing good issues. Now the orchestrator lives inside the agent session, and my job is closer to the conversation I'd have with a senior engineer: say what I want, answer the questions that matter, and read what comes out.

What stayed fixed through all three is the same thing I landed on last time. Two deterministic gates that don't care who wrote the code, or what wrote the code. The layer that makes the work keeps changing. The layer that verifies and ships it is the part worth building to last.

## Related

- [The gates, not the autonomy](/posts/gates-not-autonomy)
- [From YOLO to patchrelay](/posts/from-yolo-to-patchrelay)
- [patchrelay: Linear issues in, pull requests out](/posts/patchrelay)
- [review-quill: a strict reviewer for your coding agent](/posts/review-quill)
- [merge-steward: speculative integration, parallel validation, fast-forward landing](/posts/merge-steward)
