---
title: 'Review volume is the wrong bottleneck'
summary: PatchRelay can keep agents busy, and that quickly makes manual review feel impossible. The review-quill repair loop absorbs much of the code-review work. The harder question — whether the agents are still steering the product in the right direction — is still open.
publishedAt: 2026-05-18
readingTime: 3 min read
tags: software-factory, patchrelay, review-quill, code-review
featured: false
---

Once you've got a few agent runs in flight, code-review volume looks like the next bottleneck to optimize. I don't think it is.

I don't want to become a faster reviewer. I want to stop being the person every generated PR has to wait for. If the system needs me reading every diff line by line, the agents didn't remove the work — they shoved it sideways into a new queue with my name on it.

The split I keep coming back to is review versus validation. Review is "does the diff hold up": tests, invariants, edge cases, the docs that quietly went stale. Validation is "is the product still going in the right direction." A PR can clear the first bar and fail the second without anyone noticing, because the code is fine and the product has drifted half a step sideways.

Automating the first one is mostly tractable. `review-quill` reviews the PR; patchrelay (or plain Codex/Claude) repairs what it flags. What lands isn't perfect software, but it's been through a few adversarial passes before I see it. Since early April, my local `review-quill` database shows 3,913 review attempts across 1,309 PRs — 1,579 approved, 2,131 sent back for changes. Patchrelay has logged 2,710 runs across 733 issues; `review_fix` is the biggest non-implementation category, with 987 runs. Most of the time the system argues with itself, and I don't have to join the argument.

Direction is the harder problem. It's easy to run many agents in parallel, and easy for them to confidently steer the product somewhere subtly wrong. I can't reliably catch that by reading code, because the code looks plausible and the drift only shows up in the product.

So the question I want to be working on is shifting from "how do I review all this code" to "how do I tell whether the product still looks, feels, and behaves right." I don't expect one perfect eval to solve it. I expect layers: automated checks, screenshots, flow tests, human taste, user feedback, and enough captured intent that the agents are optimizing for the actual product instead of producing plausible diffs. With `usertold.ai` still in beta, I'm not there yet.

Better PR-review tooling would still help in the meantime. GitHub is a rough surface for large diffs — laggy, file-by-file, eager to hide parts of the change. At agent scale, what I need is help seeing what matters, not another way to page through what changed.
