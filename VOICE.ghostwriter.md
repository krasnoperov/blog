# Voice Profile

A voice analysis distilled from the six representative posts in `src/shared/content/posts/`. The goal is to let future drafts sound like they came from the same author.

## 1. Voice profile

- **Tone.** Reflective, dryly self-aware, and quietly confident. The author writes as a working practitioner thinking out loud, not as a marketer or a teacher. There is a recurring willingness to admit that something was bad, that a decision might be wrong, or that the author "doesn't know yet." Confidence comes from specificity rather than from rhetorical force.
- **Stance.** First-person singular throughout. Opinions are owned ("I picked," "I lost an afternoon," "I am not making a legal claim"). The author rarely hides behind passive voice or behind "we."
- **Pacing.** Patient. Posts open with a small concrete scene or anecdote, widen into the underlying problem, then narrow to a decision and its trade-offs. Short, declarative sentences are interleaved with longer, more conversational ones, which keeps the rhythm moving.
- **Formality.** Informal-technical. Contractions are normal ("don't," "isn't," "I'd"). Em dashes are everywhere. Parenthetical asides are common. There is no academic hedging, no corporate softening, no exclamation points.
- **Sentence length.** Mixed but readable. A post will often park a one-line sentence as its own paragraph for emphasis ("It was bad."; "Merge-queue logic is a deterministic control problem."), surrounded by 25–40 word sentences that develop a thought without rambling. Paragraphs are typically 2–5 sentences.
- **Density.** Technical content is concrete: real numbers (74.6%, €100/month, 232 runs), real product names (Hetzner, Linear, Codex App Server, Tailscale, Mosh), real commit hashes, real failure modes. Abstractions are earned by example, not asserted.

## 2. Style rules

### Do

- **Open with a scene, an anecdote, or a small confession.** "Sometime in late 2025 I stopped writing code by hand, and it crept up on me." "The first time I had four agents running in parallel against the same repo, I lost an afternoon to merge collisions."
- **State the thesis after the scene, not before it.** Let the reader feel the problem before naming it.
- **Be precise about quantities and proper nouns.** Name the vendor, the version, the price, the date, the count. Vagueness is the enemy of credibility.
- **Use first-person singular and own the opinion.** "I picked," "I built," "I was wrong about."
- **Admit unknowns and trade-offs explicitly.** Phrases like "I don't know yet whether," "I might be wrong about that," "the honest caveat is" are signature moves.
- **Use em dashes for asides and qualifications.** They carry the conversational rhythm of the prose.
- **Use parentheticals to insert post-hoc context or self-correction.** Example: "(This was a couple of weeks before `/loop` landed in Claude Code, which closes a meaningful chunk of this gap on its own.)"
- **End sections with a one-line landing.** A short sentence that crystallises the section's point: "Merge-queue logic is a deterministic control problem." or "Convergence is cheap."
- **Use bold sparingly, inside list items or numbered points,** to label a structural argument: "First, **the licensing is unambiguous for me**."
- **Close posts with concrete artifacts when applicable** — install commands in fenced code blocks, source repo links, and a `## Related` list of internal post links.

### Don't

- **Don't lecture.** Don't say "let me explain" or "in this article we will cover." The structure speaks for itself.
- **Don't hype.** Avoid "amazing," "powerful," "blazing-fast," "revolutionary," "game-changing." If something is good, prove it with a number or a story.
- **Don't bullet-point the prose.** Lists are reserved for genuine enumerations (options, run types, requirements). Body text stays paragraph-shaped.
- **Don't moralize.** Recommendations are framed as personal taste or personal-risk calls, not as universal advice.
- **Don't bury the human cost.** The author repeatedly names the operator's experience ("I'm sitting in front of it tapping yes like I'm logging into my bank") because that is what makes the technical decision legible.
- **Don't use emojis. Don't use exclamation points.** The voice does not raise itself.
- **Don't pad with marketing softeners** — "really," "very," "essentially" — unless they're carrying load.

## 3. Lexicon

### Favorite phrases and rhythmic moves

- "It works." / "It was bad." / "It crept up on me." — short declarative landings.
- "The honest caveat" / "I'm not making a legal claim, I'm making a personal-risk claim" — explicit framing of what kind of claim is being made.
- "The shape of X is Y" — used to abstract a concrete decision ("the shape of the answer was clear enough," "the shape looked like a stuck loop," "the shape of that tail").
- "Something I did not expect to matter as much as it does."
- "Workable, but you'll keep meeting your own duct tape."
- "Not occasionally, but in essentially every combination."
- "Green yesterday, broken today."
- "I lived with that pattern for maybe a month before I had to do something about it."
- "I might be wrong about that." / "I don't know yet whether it's going to be the thing or a stepping stone to the thing."
- "On paper this is the cleanest way." (often followed by a quiet "but")
- "The cost of X is Y." — explicit trade-off framing.

### Transitions

- "So I built one." / "So I rented a server." / "So patchrelay has six run types."
- "The first version of X was..." (followed by what changed and why)
- "What works is..." / "What I do is..." / "What I mostly found, though, is..."
- "The fix is well-understood:" / "The fix was to..."
- "The thing that..." as a topic-shifting opener.

### Words to avoid

- delve, leverage, utilize, robust, seamless, cutting-edge, best-in-class
- "in today's fast-paced world," "at the end of the day," "needless to say"
- "amazing," "incredible," "awesome," "powerful" (unless quoting someone)
- "synergy," "ecosystem" (when used as filler)
- vague intensifiers: "very," "really," "extremely," "highly"
- "we" in solo-author posts — the voice is always "I"

### Punctuation tics

- Em dashes (`—`) for asides, qualifications, and conversational pivots. Used heavily.
- Parentheticals for post-hoc clarifications and small self-corrections.
- Backticks for command names, file names, commit SHAs, and protocol primitives.
- Inline links to vendors, products, and supporting evidence — usually on the first mention.

## 4. Structure patterns

### Frontmatter

Every post carries: `title`, `summary`, `publishedAt`, `readingTime`, `tags`, `featured`. `summary` is a single sentence written in the same voice as the body — it does not read like a marketing tagline. It typically names the problem and hints at the resolution, sometimes with em-dash punctuation.

### Intro

Posts almost never begin with an `H2`. They open with **one to three short paragraphs of body text** that establish the scene. Common opener shapes:

- A dated anecdote: "Sometime in March I caught myself, again, copying a Linear ticket ID..."
- A failure mode: "The failure mode I see most often with coding agents on real work isn't bugs."
- A direct claim that gets unpacked: "Once you have a server and a coordinator, the next question is unavoidable..."

The thesis or the name of the thing being introduced lands in the second or third paragraph, often in bold (`**patchrelay** is what I built to stop being the bottleneck.`).

### Headings

- `##` for primary sections, `###` for substructure, no deeper nesting.
- Headings are short, lowercase except where proper nouns demand otherwise, and lean either descriptive ("Renting a box," "Four agents at once," "Reviewing on real code") or argument-shaped ("Why this had to be its own service," "Why the App Server won," "When iteration becomes churn").
- Heading style is more like chapter labels than SEO bait. They describe the move the section is making, not the keyword it ranks for.

### Body

- Paragraphs are short to medium (2–5 sentences typically).
- Lists appear only for genuine enumerations: options being compared, requirements, run types, surveyed prior art.
- Code blocks are short and load-bearing — install commands, type definitions, configuration fragments. They are not decorative.
- Numbers, vendor names, and commit SHAs are cited inline.
- Self-quoting and self-correction are common: "Stated abstractly that sounds obvious. Sitting in front of it the first time, watching two AI services go back and forth six times on the same PR, my reflex was that the system was broken. It wasn't."

### Endings

A post typically ends with one or more of:

- A **caveat / future-revisit section** ("The caveat," "When iteration becomes churn," "What's not in this post"). The author names what would change their mind.
- A **`## Try it`** block when there is a shippable artifact, with install commands and a source link.
- A **`## Related`** list of links to sibling posts.
- A short final paragraph that lands the bigger argument without overclaiming. Often something like "I will write about it when I know enough to be wrong on the record."

There is rarely a "Conclusion" heading. The post stops when the argument has landed.

## 5. Sample paragraph in the voice (clearly labeled)

> **Sample — written to imitate the voice, not drawn from any existing post:**
>
> The first time I tried to run the agent without a sandbox, it took it about ninety seconds to `rm -rf` something I cared about. Not maliciously — it had decided a stale `node_modules` was the cause of a failing test, and a stale `node_modules` is the kind of thing you delete. The directory it picked was one level above the one I'd asked it to work in. Tests went green. The next morning my dotfiles repo was gone.
>
> The fix that finally stuck wasn't a smarter agent or a better prompt. It was a rule about blast radius: the agent runs in a place where the worst thing it can do is rebuild itself. Everything else — the SSH keys, the password manager, the half-finished talk slides — lives somewhere the agent cannot see. I lose nothing if the box burns down tonight. (I had to rebuild it twice in the first week to convince myself of that, which is its own small piece of evidence that the rule is the right one.)
>
> The cost is that I now keep two laptops worth of state in my head — one for the human side, one for the agent side — and the seams between them are not always clean. That's fine. The thing I was buying was being able to stop watching, and that is exactly what I bought.

---

*Source posts analyzed:*

- `/home/alv/projects/blog/src/shared/content/posts/from-yolo-to-patchrelay.md`
- `/home/alv/projects/blog/src/shared/content/posts/picking-an-agent-harness.md`
- `/home/alv/projects/blog/src/shared/content/posts/patchrelay.md`
- `/home/alv/projects/blog/src/shared/content/posts/merge-steward.md`
- `/home/alv/projects/blog/src/shared/content/posts/review-quill.md`
- `/home/alv/projects/blog/src/shared/content/posts/hello-world-formatting-the-factory-notes.md`
