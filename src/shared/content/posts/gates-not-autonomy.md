---
title: 'The gates, not the autonomy'
summary: 'Living with patchrelay, the autonomy turned out to be the part I reach for least deliberately. What actually changed how I ship are two gates — a reviewer and a merge queue — that do not care whether a human or an agent wrote the code.'
publishedAt: 2026-05-23
readingTime: 5 min read
tags: software-factory, patchrelay, agentic-development, review-quill, merge-steward
featured: false
---

I ended [the last post](/posts/from-yolo-to-patchrelay) on a question I couldn't answer yet: does writing a Linear issue and walking away actually beat sitting next to the agent and steering it turn by turn? I had a v1 and a hunch. This is what living in it taught me.

The short version is that I got the emphasis wrong. I built patchrelay to make agents run *autonomously*, and the autonomy turned out to be the part I reach for least deliberately — I use it when the task fits and skip it when it doesn't. What actually changed how I ship is quieter: everything I produce now, from either hand, passes through two gates that don't care who wrote it.

## Autonomy never stops to ask

patchrelay is told to work autonomously and deliver a solution. That's the whole pitch — assign a Linear issue, walk away, come back to a PR. But "deliver a solution" has a sharp edge: it never stops to ask. When the agent hits a fork — an ambiguous requirement, a detail the issue didn't pin down, two reasonable ways to model the same thing — it picks one and keeps going. Reasonably, I hope. I usually can't tell.

That's the real cost, and it took me a while to name it, because it doesn't look like a failure. The build is green. The PR is open. The cost is that *I didn't see the decision happen*. A question came up, the agent answered it on my behalf, and the first I hear of it is reading the diff at the end — if I catch it at all. For a task with crisp acceptance criteria, that's fine: there were no real forks, or the ones there were didn't matter. For an exploratory task, the unasked questions *are* the work, and silent autonomy is exactly the wrong shape for it.

## So the interactive lane stayed — by necessity

I didn't keep interactive sessions out of nostalgia for the YOLO days. I kept them because they're the only way to do the work patchrelay is bad at. When I'm exploring — shaping an idea, working a tight loop, following the model's reasoning to see where it goes — I want to be in the room when the forks come up. Half the value is watching which way the agent leans and overruling it in the moment, before a hundred lines get built on top of the wrong call.

So the split I reach for isn't strategic-versus-routine, the way I framed it when I started. It's how well I can specify the task before it begins. Well-specified work goes to patchrelay and I leave. Underspecified work stays interactive and I stay close. An interactive session usually ends one of two ways: it spawns a batch of now-well-specified Linear issues for the delegated lane, or it produces a PR directly.

And that's the hinge I didn't see coming when I wrote the last post: it doesn't matter which lane the work came from, because both lanes end at the same two gates.

## review-quill: the gate to production

`review-quill` reviews every PR before it can land, from a real checkout of the code, and it turned out to be the gate I lean on hardest. It catches the class of thing that ships green and breaks later: an invariant the rest of the file quietly enforces, a doc that no longer matches the function it describes, a test fixture three files over that still assumes the old behavior. Those are exactly the decisions an autonomous run makes without telling me — and review-quill is where they get caught, whether a human or patchrelay made them.

It isn't free. Some PRs bounce through more rounds than I'd like before they pass, and a few of those rounds are the reviewer being stubborn rather than right. But that cost is *observable*. Every round leaves a transcript — the review, the diff, the response — and I can read them afterward, find where the loop went sideways, and tune the review prompts so the next case of the same shape goes better. A larger team would build eval suites for this and measure it properly. I'm one person, so transcript-driven tuning is my version of the same instinct — less rigorous, but enough to keep the gate honest.

## merge-steward: making delivery boring

`merge-steward` is the second gate, and its job is to make landing a PR uneventful no matter where the PR came from. It takes an approved, green PR, builds the tree that would exist if it landed on the current `main`, runs CI on *that* tree, and only fast-forwards `main` when the tested result still holds.

Two things have to be true for this to pay off, and they're both on me, not the tool. The repo needs good test and lint coverage — fast enough that the gate isn't a bottleneck, broad enough that "green" actually means something. And the thing under test has to be the *integrated* result, not the branch in isolation, because "passed on my branch" and "passes once it's actually on `main`" are different claims — that gap is the entire reason four green branches could merge into a broken `main` back when I was doing this by hand.

Testing never proves the absence of bugs; I know that, and merge-steward doesn't pretend otherwise. What clearing the gate does guarantee is narrower and still worth a lot: the project still integrates, and it won't fall over on deploy. That's most of what I was actually losing sleep over.

## The shape that held up

So, the question I left open: delegating beats steering for the work that's well-specified enough to delegate, and not otherwise. That's a smaller, more boring claim than "agents run my repo now" — and a truer one.

The thing I got wrong at the start was treating the autonomy as the product. It isn't. The autonomy is situational. What's durable is the pair of gates underneath both lanes: whether I delegated a Linear issue or hand-built a PR in an interactive session, the same reviewer checks it and the same queue lands it, tested as it'll exist in production. The lanes diverge on how the work gets made. They converge on how it gets verified and shipped.

That convergence is the order I was looking for when I started — back when four parallel agents had turned me into a full-time coordinator. I assumed the fix would be a smarter, more autonomous agent. It turned out to be two deterministic gates that don't care who I am or where the code came from.

## Related

- [From YOLO to patchrelay](/posts/from-yolo-to-patchrelay)
- [patchrelay: Linear issues in, pull requests out](/posts/patchrelay)
- [review-quill: a strict reviewer for your coding agent](/posts/review-quill)
- [merge-steward: speculative integration, parallel validation, fast-forward landing](/posts/merge-steward)
