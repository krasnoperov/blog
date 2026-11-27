---
title: 'The gates, not the autonomy'
summary: "I delegate tasks with clear requirements and keep exploratory work interactive. Both routes use the same reviewer and merge queue; judging product decisions remains harder."
publishedAt: 2026-05-23
readingTime: 2 min read
tags: software-factory, patchrelay, agentic-development, review-quill, merge-steward
featured: true
---

I ended [From YOLO to patchrelay](/posts/from-yolo-to-patchrelay) wondering whether delegating a Linear issue would beat sitting beside an agent. After living with it, I choose according to how well I can specify the task before it starts.

Well-specified work goes to patchrelay. When I'm still exploring the product or deciding how something should behave, I keep the session interactive. Both routes produce PRs that go through the same reviewer and merge queue.

## Decisions I want to see

An autonomous run can reach an ambiguous requirement, choose an interpretation, and continue to a green build. I may only discover the decision when I read the final diff.

For a task with clear acceptance criteria, that's often acceptable. For exploratory work, discussing those choices is part of the work. I want to see the agent's proposed direction before it builds more code on top of it.

An interactive session can produce a PR directly or leave me with a batch of issues precise enough to delegate. I don't need to choose one mode for the whole project.

## review-quill

`review-quill` checks every PR from a real checkout. It can find a caller that relies on an old invariant, documentation that no longer describes the function, or a test fixture still assuming the previous behavior. Those problems occur in both interactive and autonomous work.

Some PRs take more rounds than I'd like, and sometimes the reviewer is stubborn rather than right. Each round leaves a transcript of the review, diff, and response, so I can inspect the disagreement and adjust the prompts.

At this point I'm tuning from transcripts. An eval suite would make it easier to measure whether a change reduces noise without losing useful findings.

## merge-steward

`merge-steward` takes an approved PR, builds the result of integrating it with `main`, runs CI on that result, and fast-forwards `main` only when the tested commit remains valid.

This addresses the failure I saw with parallel branches: each passed on its own, but their combined state failed. The queue still depends on the tests I provide. A green result means those checks passed on the integrated code; it cannot guarantee a successful deployment or the absence of bugs.

I can change how the code gets written without rebuilding either service. The question I still need to answer is how well the reviewer catches the silent decisions that matter to the product, and which ones need me in the original conversation.

## Related

- [From YOLO to patchrelay](/posts/from-yolo-to-patchrelay)
- [patchrelay: Linear issues in, pull requests out](/posts/patchrelay)
- [review-quill: a strict reviewer for your coding agent](/posts/review-quill)
- [merge-steward: speculative integration, parallel validation, fast-forward landing](/posts/merge-steward)
