---
title: 'Review volume is the wrong bottleneck'
summary: PatchRelay can produce enough PRs that review volume looks scary. review-quill handles much of the mechanical review; the harder problem is product validation.
publishedAt: 2026-05-18
readingTime: 3 min read
tags: software-factory, patchrelay, review-quill, code-review
featured: false
---

Once a few agent runs are in flight, code review volume looks like the next bottleneck. I think that is the wrong bottleneck to optimize.

Honest answer: I do not want to become a faster reviewer. I want to stop being the person every generated PR has to wait for. If the system needs me to read every pull request line by line, then the agents did not remove work. They moved the work to a new queue.

The split I keep coming back to is review versus validation.

Review asks whether the diff is mechanically sound: tests, invariants, edge cases, stale docs, broken assumptions. Validation asks whether the product is still moving in the right direction.

Diff correctness is not product correctness. A PR can be clean, tested, and locally reasonable while still nudging the product in the wrong direction.

I am comfortable automating more of the first category. `review-quill` reviews the PR, then PatchRelay, or plain Codex/Claude, repairs what it finds. The result is not perfect software, but what lands is at least operational, and usually already through a few adversarial passes before I see it.

Since early April, my local `review-quill` database has 3,913 review attempts across 1,309 PRs. It approved 1,579 attempts and requested changes 2,131 times. PatchRelay has recorded 2,709 runs across 729 issues; `review_fix` is the single biggest non-implementation category, with 987 runs.

That is the part I care about. The system did a lot of arguing with itself, and most of the time I did not have to join the argument.

The harder constraint is direction. It is easy to run many agents in parallel. It is also easy for them to confidently steer a project somewhere subtly wrong. I cannot reliably catch that by looking at the code alone, because the code can be plausible while the product has drifted.

So the question I care about is changing from "how do I review all this code?" to "how do I test that the product still looks, feels, and behaves right?"

That part is still open. With `usertold.ai` still in beta, I am not quite there yet. I do not expect one perfect eval to solve it. I expect layers: automated checks, screenshots, flow tests, human taste, user feedback, and enough captured intent that agents optimize for the actual product instead of merely producing plausible diffs.

In the meantime, better PR review tooling would still help. GitHub is already a rough review surface for large diffs: laggy, file-by-file, and too eager to hide parts of the change. At agent scale, I want help seeing what matters, not another way to page through what changed.
