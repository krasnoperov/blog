---
title: 'Review volume is the wrong bottleneck'
summary: "The automated review loop handles thousands of attempts. I still need a better way to see when a technically sound change takes the product in the wrong direction."
publishedAt: 2026-05-18
readingTime: 2 min read
tags: software-factory, patchrelay, review-quill, code-review
featured: false
---

I don't want every generated PR to wait for me to read it. With several agents working at once, that would leave me doing little else.

review-quill handles much of that review. It checks tests, invariants, edge cases, and documentation; patchrelay or an interactive agent repairs what it flags. Since early April, my local database has recorded 3,913 review attempts across 1,309 PRs: 1,579 approvals and 2,131 requests for changes. patchrelay has logged 2,710 runs across 733 issues, including 987 `review_fix` runs.

Those numbers show how much work the loop is doing. They don't tell me whether the resulting product is going in the right direction. A change can be consistent with the repository, pass its tests, and still make the product worse.

That's harder for me to catch in a diff. The code often looks plausible; the mistake becomes obvious when I use the feature. I need to inspect flows and screenshots, compare the result with the original intent, and hear from users. With UserTold still in beta, I don't yet have that feedback working as reliably as the code-review loop.

Better diff tools would help too. GitHub slows me down on large changes, especially when files or parts of a diff are hidden. But the question I need the review surface to answer is which product decisions changed and where I should look at the result.
