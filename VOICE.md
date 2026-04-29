# VOICE

Reference for writing in Aleksei Krasnoperov's voice on this blog. Distilled from the editorial pass on `from-yolo-to-patchrelay`, `picking-an-agent-harness`, `patchrelay`, `merge-steward`, `review-quill`, and `hello-world-formatting-the-factory-notes` (April 2026).

## Reference points

The closest published voice is Mitchell Hashimoto on `mitchellh.com/writing`, particularly *Ghostty Is Leaving GitHub*. First-person, slightly vulnerable, anchored in specific dates and numbers, no marketing-shaped language. The voice on this blog is calibrated against that reference. When in doubt, read a Hashimoto post and check whether the draft sounds like the same person could have written it.

## Voice profile

First-person from the first sentence. Honest, understated, never marketing-shaped. The narrator owns their own pain and their own mistakes; readers recognise themselves through specifics rather than through the word *you*.

Sentence rhythm is long compound sentences with em-dashes and parentheticals, mixed with the occasional short declarative for emphasis. Numbers, dates, command names, file paths, version numbers do load-bearing work — they replace adjectives. The writer admits uncertainty plainly and never wraps a post with a tidy summary.

Tone register: somewhere between an internal engineering memo and a private journal. Casual asides allowed. Self-deprecating in passing, never as a bit. No coffee-mug aphorisms.

## Style rules

| Do | Don't |
|-|-|
| Open in first person, anchored in a specific moment ("Sometime in March I caught myself, again, copying a Linear ticket ID...") | Open in second person to manufacture relatability ("If you've spent time running coding agents, you know the trap...") |
| Long compound sentences with em-dashes and parentheticals; mix in occasional short ones | Staccato fragments for fake drama ("Every time. Not once. Over and over.") |
| State observations directly | Land observations as paired aphorisms ("Faster output, less authorship." / "The parallelism bought speed and sold control.") |
| Concrete numbers and sources ("173 of 232 runs", "April 4, 2026", "$200/month each") | Vague intensifiers without a number ("dramatically faster", "much more expensive", "incredibly cheap") |
| Admit uncertainty plainly ("I don't know yet how to make that happen reliably") | Empty closers ("Let's find out!", "Still figuring it out.", "Time will tell.") |
| Conversational asides in parens ("(I tried.)") | Memes that clash with the surrounding register ("Agents go brrrr") |
| Drop a metaphor as soon as it has to work to keep up | Stretch a metaphor to land a point ("a strict reviewer with a fast loop is a coach") |
| Cut bios for people the reader already knows | Pad with credentials ("Peter Steinberger, recently joined OpenAI...") |
| Descriptive section headings ("When iteration becomes churn", "What's not in this post") | Formulaic patterns ("The mental shift", "The permission brake", "The VPS") |
| Use "I" / "my" throughout | Pivot from "I" to "you" mid-paragraph (the classic AI-promo move that masks "I did a dumb thing" as "you fall into a trap") |
| Cite real sources by name when possible | Reference inaccessible private files (`~/vault/...`, `/home/...`) as if they were public links |
| Name the tool you actually picked | List five options, treat them as equivalents, and refuse to commit |

## Lexicon

### Recurring phrases (signature, not template)

- "I lived with X for a month before I had to do something about it."
- "The honest caveat:"
- "is not a sentence I was going to say"
- "I don't know yet whether it's the thing or a stepping stone to the thing"
- "I'll write about it when I know enough to be wrong on the record"
- "(I tried.)"
- "fine for me today"
- "is not a path I was going to walk down" / "is a path that ends in tears"
- "the most useful structural takeaway"
- "what's not in this post"

### Words to avoid

- *genuinely*, *literally* — usually doing nothing
- *dramatically*, *significantly* — only acceptable with a number on the same line
- *decent* (as self-rating, e.g. "decent code quality")
- *fascinating*, *intriguing*, *thought-provoking* — telling the reader how to feel
- *in essence*, *at the end of the day*, *fundamentally*
- *delve*, *embark*, *unleash* — AI register
- *we* used as the editorial-collective when it's actually *I*
- *robust*, *seamless*, *cutting-edge*, *paradigm shift* — marketing residue

### Code, commands, identifiers

Use backticks. Prefer the exact tool/command/file/run-type name from the codebase over a paraphrase. If the codebase calls it `review_fix`, the post calls it `review_fix`. Don't soften to "the review-fix run."

## Structure patterns

### Promo-shaped post (patchrelay, merge-steward, review-quill)

1. **Pain** — first-person, anchored in a specific moment. Two or three sentences.
2. **Tool name in bold + one-line value prop**. The reader should know what the tool is and why it exists by the third paragraph.
3. **Architecture / mechanics** — the build-log content, organised around what the reader needs to understand. Subheadings descriptive.
4. **Honest caveat** — what the system fails at, what's unsolved, current crude mitigation.
5. **Try it** — install command + link to source.
6. **Related** — internal cross-links.

### Reflection-shaped post (from-yolo-to-patchrelay)

1. **A specific moment** that frames the shift the post is about.
2. **Observation about the shift** — what changed, how the writer noticed.
3. **Consequence** — what they had to build, what they had to throw away.
4. **Forward-looking line** that names the still-uncertain part.

### Closers

A forward-looking line that names what's still uncertain. Never a summary, never a call to action. Examples that work:

- "I'll write about it when I know enough to be wrong on the record."
- "The 74.6% number is doing better."
- "I'm going to keep building it and find out."

## Failure modes to watch for

These are mistakes the editorial pass had to fix repeatedly. Watch for them when generating drafts.

1. **Pronoun pivot in the lede.** "If you've spent time… You'll find that…" then a switch to "I". The Hashimoto pattern is "I" from the first sentence.
2. **Pseudo-aphorisms.** Two parallel sentences engineered to land a sound-bite. "Security through absence." "The parallelism bought speed and sold control." Cut these.
3. **Fragment drama.** Two-word sentences for false emphasis. "Not once." "Over and over." Use sparingly, only when earned.
4. **Empty closers.** "Time will tell." "Let's find out!" Replace with a specific uncertainty.
5. **Marketing flourishes.** *genuinely*, *seamlessly*, *literally*, *the right answer is X* (without a number).
6. **Self-rating.** "decent code quality", "well-architected", "clean implementation." Let the work be its own evidence.
7. **Bio-padding for known names.** Don't introduce people the reader knows by reputation.
8. **Metaphor that works too hard.** "A strict reviewer with a slow loop is a bottleneck. A strict reviewer with a fast loop is a coach." Drop the metaphor; describe the mechanism.
9. **Vault-path leaks.** `~/vault/...`, `/home/...`, internal Linear issue IDs that leak from interview transcripts. The reader can't follow these. Cut.
10. **Promotional structure with promotional voice.** The structure can be pain → solution; the voice should still be first-person and specific. Don't translate the structure into "you'll save time" copy.

## Sample paragraphs (in-voice)

Lede sample (promo):

> Sometime in March I caught myself, again, copying a Linear ticket ID into a terminal so I could paste it into a Codex prompt — for the fourth or fifth time that morning. I'd already opened tmux, switched between four worktrees, restarted two failed builds, and rebased one branch against a `main` that had moved twice while I wasn't looking. The agents were faster than me at writing code. I was the bottleneck.

Mid-post sample (mechanism):

> Patchrelay caps the number of `review_fix` rounds for any single PR at a hard limit, after which the issue escalates for human attention instead of letting the loop spend my budget on surface fixes. The cap stops the bleeding. It does not address the cause.

Closer sample (forward-looking):

> The shape of that tail is where the next round of work goes. I want to know what makes a long-tail issue different from a short one — is it size, ambiguity, repo, time of day, prompt cold-start, something I have not measured yet. That's the next thing, and it is a real research direction rather than a feature I know how to ship. I will write about it when I know enough to be wrong on the record.

## Calibration check before publishing

Before publishing a draft, run through this check:

- [ ] First sentence is first-person.
- [ ] No "you" / "your" in body prose (acceptable in titles, install instructions, and quoted policy strings).
- [ ] Every adjective answering "how much" is followed by a number.
- [ ] No paired aphoristic sentences.
- [ ] No private file paths (`~/...`, `/home/...`).
- [ ] Closing sentence names a specific uncertainty, not a tidy summary.
- [ ] If a metaphor appears, it survives one sentence of unfolding without falling apart.
- [ ] If the draft sounds like a marketing landing page when read aloud, rewrite the lede.
