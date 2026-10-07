---
title: 'I just wanted to speak Spanish'
summary: 'Courses were too slow, so I built my own. Testing it needed user interviews, so I built UserTold. Showing that needed video, so I built MakeFX. One wish, four products, and the next move for each.'
publishedAt: 2026-10-08
readingTime: 5 min read
tags: indie-hacking, product-development, learnspeakrepeat, usertold, makefx, fellowmakers
featured: true
---

Hi, I'm Alekséi. I'm from Siberia, I live in Alicante, and I could read Spanish long before I could speak it.

I set out to fix that one thing. The fix grew into four products, each one built because the one before it needed it. Agents build them, and agents can run every one of them from ChatGPT, Claude, or Codex.

Here is the chain.

## I wanted to speak Spanish, but the courses were too slow

```image
/media/posts/i-just-wanted-to-speak-spanish/learnspeakrepeat.webp
Two speech loops spiral under an evening moon.
```

I already knew some Spanish. What I needed was to say it out loud, every day. The courses I tried were too slow for me or too dull to come back to.

So I built [Learn, Speak, Repeat!](https://learnspeakrepeat.com).

Every evening it builds me a session for the time I have, and every session ends with speaking: a two-minute monologue, or a role-play with an AI voice partner that corrects me and has me say it again. Whatever I get wrong becomes a review card for the next evening.

Opus 5.5 wrote the course. I asked it to explain Spanish to me and got back a full curriculum, grounded in research on how adults learn to speak, with separate tracks for English and Russian speakers. Every chapter is written for the learner reading it.

That is a live voice partner and a personal course for €19 or €39 a month. The bigger plan is six hours of speaking a month, for about the price of two hours with a tutor. I practise with it every evening, 20, 40, or 60 minutes, and I never open a textbook.

## I needed to watch people learn, but no tool was built for agents

```image
/media/posts/i-just-wanted-to-speak-spanish/usertold.webp
A voice line goes in through one door and leaves along several paths.
```

To make the course better for everyone, I needed to see other learners use it: where they slowed down, what they skipped, what they said out loud. And I wanted my coding agent to run those interviews, read the answers, and turn them into work.

The tools I found were either expensive or built for a person clicking through a dashboard. So I built [UserTold](https://usertold.ai).

My agent writes a study, and UserTold runs it inside the product: a voice interview, or quiet observation of a task followed by questions about what just happened. Each session comes back as evidence: the quote, the click, and the page it happened on. Evidence becomes issues in Linear or GitHub, and when an issue closes, the evidence is marked resolved. It costs $0.25 per recorded minute, billed only for interviews that finish processing. That's $15 an hour of real user interviews, with no contract.

UserTold is now listed in ChatGPT, and the listing brings a new audience with its own reasons to come. The next study UserTold runs is on them, and what they say becomes the next post in this series.

## I wanted to show it working, but there was no canvas for agents

```image
/media/posts/i-just-wanted-to-speak-spanish/makefx.webp
A canvas of finished assets, each tied to its recipe, and one empty tile.
```

The fastest way to explain UserTold is to show it, which means video. I wanted my agent to make that video: images, voice, a presenter who looks the same in every take. Generation tools gave my agent loose files with no record of how they were made.

So I built [MakeFX](https://makefx.app). My agent connects with one command and makes images, video, and audio. Everything lands on one shared canvas, and every asset keeps its recipe: the model, the prompt, the references, and what it cost. The price is on the card before anything runs, a failed generation is free, and credits never expire. Fable rewrote it this autumn, and it now delivers the assets for the products I run.

Next, MakeFX makes its own launch film, end to end, from one agent prompt, published with the full receipt.

## I build alone, and so do hundreds of others

In September a founder in Germany posted three lines on X: an age, a country, and a wish to meet other builders. Hundreds of people answered in the same shape, and I was one of them.

A few hundred replies is a wall of text. I wanted a map. So I built [FellowMakers](https://fellowmakers.app): 1,595 builders and 1,284 projects, every fact taken from what people wrote themselves. Where people build the same thing without knowing each other, it groups them into waves, and there are 71 of them. [My card is there too](https://fellowmakers.app/people/snejink).

## Four products, four next moves

I'm Aleksei Krasnoperov, on X [@snejink](https://x.com/snejink). One person ships four products because agents do the building, behind [a reviewer and a merge queue](/posts/gates-not-autonomy) that check every change, and [an agent session that plans and runs the work](/posts/orchestrator-moved-into-the-session).

Each product has its next move, and each one is the next post in this series:

- Learn, Speak, Repeat!: its own landing page and channel for Russian speakers.
- UserTold: what the new audience from ChatGPT came for, straight from the interviews.
- MakeFX: its own launch film, made on MakeFX, with the receipt.
- FellowMakers: the first State of Solo Builders, from 1,595 builders' own words.

If you build something too, [find me on FellowMakers](https://fellowmakers.app/people/snejink).

## Related

- [The orchestrator moved into the session](/posts/orchestrator-moved-into-the-session)
- [The gates, not the autonomy](/posts/gates-not-autonomy)
