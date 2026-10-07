# Authoring guide

This guide is for anyone (or any agent) writing posts for this blog. It exists because the first wave of posts is opinionated about voice and grounding, and the cost of relearning the rules every time would be high.

The blog is personal. It is a builder's calling card: who I am, the products I build (`usertold`, `makefx`, `fellowmakers`, `learnspeakrepeat`), and what each of them teaches me about building products — finding people, distribution, telling the story, pricing. The first wave of posts documented the software factory that ships them (`patchrelay`, `review-quill`, `merge-steward`); that setup is done for the current scale, and new posts should not drift back into factory notes unless something there genuinely changes. Every post should sound like the same person wrote it.

## Content prep rules

Before drafting any post:

1. **Read the relevant research note(s) first.** They live in `~/vault/notes/research/`. The post plan in `~/.claude/plans/linear-puzzling-wilkes.md` lists which note grounds which post. For new posts, search the notes directory before assuming a topic isn't already researched.
2. **Pull metrics, dates, and incidents from notes or git, not from memory.** If a number can't be cited, leave it out. If you remember "the merge queue ran 232 times for 18 issues" but you're not sure, go re-read `20260327_patchrelay_merge_steward.md` and confirm.
3. **For history claims, check git.** `git log --oneline`, `git log --reverse --oneline`, `git show <sha>`. Cite the sha and the commit subject inline so the reader (and the next author) can verify.
4. **For opinion or speculation, flag it inline.** Phrases like "my guess is", "I haven't tested this at scale, but", "this is a hunch". Don't smuggle opinion into past tense.
5. **Don't invent benchmarks, user counts, or revenue numbers.** If a vendor's blog says X, link to it. If you have a personal measurement, say so plainly.

A post that respects these rules can be re-read a year later without making the author cringe. A post that doesn't is a liability.

## Post structure

There are two kinds of post, and each has its own shape.

**Product and personal posts** (what a project is, what it is teaching me, where it goes next) open with who the post is for or what happened, give each product its own section, and end on the next move for each one. They don't need a vendor survey. They still follow every content prep and voice rule: no invented numbers, and opinion flagged as opinion.

**Technical posts** (a tool, a system design, a choice between options) follow the four-part shape:

1. **The problem.** What hurt, in concrete terms. Two to four paragraphs. Open on a scene or an observation, not a thesis statement.
2. **The landscape.** What other people do. This is the survey section. Cite vendors, papers, blog posts. Be specific about names and versions.
3. **The choice.** What I picked, with the reasoning. Be specific about the file, the commit, the version. If there's a sha or a function name, name it.
4. **The caveat.** This might change. What does the interface look like so the choice can be swapped? What would make me reconsider?

This shape exists because the blog refuses to manifest a single right answer. Every technical post is one author's most-logical-for-now choice, not a recommendation. The structure forces that humility into the bones of every post.

## Storytelling

Product and personal posts are told as stories, and the same rules apply at two levels.

**Inside a post.**

- **Open on a hook,** not a thesis: a person, a wish, a concrete problem. "Hi, I'm Alekséi. All I wanted was to speak Spanish." beats "This post is about my products."
- **Chain beats with "but" and "so", never "and then".** Each step is a want, the obstacle that blocked it, and what I did about it. If two beats are joined by "and then", one of them is a list item, not a story beat.
- **Details serve the beat.** A product's features go in where they answer the "so": how the thing solves the problem that blocked me. Keep the specifics (prices, minutes, what a session contains) and cut the catalogue prose.
- **End on the next move,** stated plainly: what the product does next. The next move is the reason to read the next post.

**Across posts.**

- **A series is one chain stretched over several posts.** The opener lays out the whole chain; each later post takes one link and goes deep.
- **Each post delivers the next move the previous one named, then names a new one.** Link back to the post that named it in the first paragraph.
- **Never promise a date.** A next move is a hook; "coming next week" is a debt.

## Promote, don't apologise

Product and personal posts promote the work. State what a product does today and what it does next; leave doubts, complaints, and hedges out of the copy.

| Instead of | Write |
|-|-|
| working on, trying to, experimenting with | I built, it does, it ships |
| still early, stuck, doesn't have yet, I don't know yet | what it does today, and the next move |
| just, simple, small, little side project | the product name and the outcome |
| I think, maybe, probably, hopefully | the claim, with the figure that proves it |
| let me know if this is useful | an invitation and a link |
| AI-powered | what the agent actually does |

A post ends on the next move ("the next study UserTold runs is on them"), never on a gap ("I don't know yet"). A cost is phrased as what it buys ("six hours of speaking a month for about the price of two tutor hours"), not as a complaint ("expensive enough to push prices up").

## Voice rules

For full voice calibration — sentence rhythm, lexicon, the closer rules, the failure-mode checklist — see `VOICE.md` at the repo root. The rules below are the load-bearing subset; `VOICE.md` is the authority where they overlap.

- **First person singular.** "I rented a Hetzner box" not "we rented a Hetzner box". The blog is personal. There is no "we" unless there really is a we.
- **Plain past tense for things that happened, plain present for things that are.** Don't dramatise. The story is interesting because the technical observation is interesting, not because the prose insists you should care.
- **Short paragraphs.** Two to five sentences. One idea per paragraph. If a paragraph runs longer than five sentences it's usually two paragraphs.
- **Banned words and phrases.** No `delve`, `leverage`, `robust`, `seamless`, `unlock`, `landscape` as filler, `journey` as marketing, "in conclusion", "at the end of the day", "it's important to note that", "let's dive in". These are AI tells; the reader's brain skips them.
- **Em-dashes are part of the voice — use them, but watch for loose chaining.** Long compound sentences with em-dashes are signature here (see `VOICE.md`). The failure isn't the dash; it's a clause joined by an additive "and" or a trailing relative that adds nothing. Test: cut the sentence at the join — if both halves stand alone and the link survives, split it; if the length carries the argument, keep it.
- **No marketing closers, and no empty ones.** Technical posts end on the technical observation or a specifically-named uncertainty; product and personal posts end on the next move. Don't summarise what the reader just read, and don't gesture vaguely ("time will tell"). A flat forward line ("Let's find out.") is fine once the open question of a technical post has been stated explicitly.
- **Code identifiers in backticks.** Function names, file paths, commit shas. Don't bold them and don't italicise them.
- **Cite by name, not by adjective.** "Hetzner CPX21" not "an affordable VPS". "Codex App Server" not "a modern agent runtime". Readers want to fact-check.

## Markdown and rendering constraints

These come from the actual blog renderer. Authoring outside these bounds breaks the build.

- **Tables.** Use the minimum separator: `|-|-|`. Never `|---|---|` and never any box-drawing characters (`┌`, `─`, `│`, etc.). This is a global rule, not a blog-specific one.
- **Mermaid.** Supported and lazy-loaded. Use only when a flow, state, or sequence is genuinely clearer than prose. Default is zero diagrams per post. The renderer falls back to source code on render error, so prefer simple `flowchart LR` over experimental layouts.
- **Fenced code.** No syntax highlighting in this renderer. Don't lean on colour to convey meaning. Keep code samples short — five to fifteen lines is plenty.
- **Video.** A fenced `video` block embeds one local MP4. Its three non-empty lines are the `/media/...mp4` source, the `/media/...` poster, and a short accessible caption. Keep both assets in `public/media/`; external video URLs remain ordinary links.
- **Image.** A fenced `image` block embeds one local image as a captioned figure. Its two non-empty lines are the `/media/...` source (`.jpg`, `.jpeg`, `.png`, or `.webp`) and a short caption that doubles as the alt text. Keep the file in `public/media/`; the content tests check that it exists.
- **Footnotes are not supported.** Use inline links like `[name](url)` instead.
- **Links.** External links open in a new tab automatically. Internal cross-links between posts use `[Title](/posts/<slug>)`.
- **Frontmatter.** Must match the manifest exactly: `title`, `summary`, `publishedAt` (YYYY-MM-DD), `readingTime`, `tags`, `featured`. The test suite enforces this — a mismatch fails the build.
- **Tags are split on commas.** A tag value cannot contain a comma. Use hyphens for multi-word tags (`merge-queue`, not `merge queue`).
- **Body starts at H2.** The post title is rendered from frontmatter. Don't repeat it as an H1 in the body.

## Cross-linking convention

The blog has no tag pages, no series pages, no search. Routes are `/`, `/posts`, and `/posts/:slug`. To link related posts, add a `## Related` section at the end of the post with one or more `[Title](/posts/<slug>)` lines. Keep it to posts that are genuinely connected, not every post in the wave.

## Word count

Default target is 1200 to 1800 words. A post that wants to be a survey (the merge-queue landscape, the diff-handling deep dive) can run up to ~2200. If a post is shorter than 1200 it's probably underbaked; if it's longer than 2200 it's probably two posts.

## What "good" looks like

A post is good when:

- A reader can reproduce the technical claims by following the citations.
- The author's choice is legible as one option among several, not as a recommendation.
- The prose disappears behind the content. No paragraph reads like it was written by an AI trying to sound thoughtful.
- A year later, the author can read it without rewriting any factual claim.
