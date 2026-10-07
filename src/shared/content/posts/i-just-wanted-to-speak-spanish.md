---
title: 'I just wanted to speak Spanish'
summary: 'Courses were too slow, so I built my own. Testing it needed user interviews, so I built UserTold. Promoting that needed videos, so I built MakeFX. How one wish became four products, and the question each one is stuck on now.'
publishedAt: 2026-10-08
readingTime: 5 min read
tags: indie-hacking, product-development, learnspeakrepeat, usertold, makefx, fellowmakers
featured: true
---

Hi, I'm Alekséi. I'm from Siberia, I live in Alicante, and I could read Spanish long before I could speak it.

I wanted to fix that one thing. The fix now has a user-research tool and a video canvas hanging off it, and I planned neither.

This is how that happened.

## I wanted to speak Spanish, but the courses were too slow

```image
/media/posts/i-just-wanted-to-speak-spanish/learnspeakrepeat.webp
Two speech loops spiral under an evening moon.
```

I already knew some Spanish. What I couldn't do was say it. The courses I tried were either too slow for me or too boring to come back to.

So I built my own: [Learn, Speak, Repeat!](https://learnspeakrepeat.com).

Every evening it builds me a session for the time I have, and the session ends where the courses never got to: a two-minute monologue, or a role-play with a voice partner that corrects me and makes me say it again. Whatever I get wrong is a review card the next evening.

Opus 5.5 wrote the latest version. I asked it to explain Spanish to me and got back a full course, grounded in research on what works for teaching Spanish, and written separately for English and Russian speakers. But content written per learner plus a live voice partner cost real money every evening, so the price sits at €19 or €39 a month, with voice minutes counted.

For me it's worth it. A full 20, 40, or 60 minutes of real practice every evening means I don't need to work through a course at all.

## I needed to watch people use it, but the tools weren't agentic

```image
/media/posts/i-just-wanted-to-speak-spanish/usertold.webp
A voice line goes in through one door and leaves along several paths.
```

A course that works for me proves very little. I needed to see other learners use it: where they got stuck, what they skipped, what they said out loud while doing it.

But the tools I found were either expensive or not agentic. I wanted my coding agent to run the interviews, read the answers, and turn them into work.

So I built [UserTold](https://usertold.ai). My agent writes a study, and UserTold runs it inside the product: a voice interview, or quiet observation of a task followed by questions about what just happened. Each session comes back as evidence I can check, down to the quote, the click, and the page. The evidence becomes issues in Linear or GitHub, and when an issue closes, the evidence is marked resolved, so I can see if the problem comes back. It costs $0.25 a minute of completed interview, with no subscription.

UserTold is listed in ChatGPT, and the listing brings registrations, but not, as far as I can tell, from people who want user research. They came for something else, and I don't know yet what it is.

So the next study UserTold runs is about UserTold.

## I wanted to promote it with videos, but there was no canvas for agents

```image
/media/posts/i-just-wanted-to-speak-spanish/makefx.webp
A canvas of finished assets, each tied to its recipe, and one empty tile.
```

I wanted to show UserTold working rather than describe it, which means video, and I wanted my agent to make it: images, voice, a presenter who looks the same in every take.

But there was no collaborative canvas made for agents. What my agent generated ended up as loose files, with no memory of how they were made.

So I built [MakeFX](https://makefx.app). My agent connects with one command and makes images, video, and audio. Everything lands on one shared canvas, and every asset keeps its recipe: the model, the prompt, the references, and what it cost. The price is on the card before anything runs, and a failed generation costs nothing. Fable recently rewrote it, and now it delivers the assets I need for my other projects.

But the tool I built to make promo videos still doesn't have one of its own. That's next.

## I was building alone, but so were hundreds of others

By September I had three products and was building them alone. So when a founder in Germany posted three lines on X, an age, a country, and a wish to meet other builders, I answered, along with hundreds of others.

But a few hundred replies is a wall of text, not a map. I couldn't see who builds what, or who is stuck on the same problem I am.

So I built [FellowMakers](https://fellowmakers.app): a map of everyone who answered and what they build, drawn only from what they wrote themselves. Where people turned out to be building the same thing without knowing each other, it groups them into waves. Most people on that map are stuck on a problem someone else on the map has already solved. [My card is there too](https://fellowmakers.app/people/snejink).

## Four products, four open questions

I'm Aleksei Krasnoperov, 40, a digital nomad. On X I'm [@snejink](https://x.com/snejink), and the bio there says "Shippin'".

One person can build four products now because building got cheap. I spent most of the last year on how I build: [a reviewer and a merge queue](/posts/gates-not-autonomy) that check everything before it lands, and lately [an agent session that plans and orchestrates the work itself](/posts/orchestrator-moved-into-the-session). That part is done for my scale.

What isn't done is everything after the build. If you're building something too, [come find me on FellowMakers](https://fellowmakers.app/people/snejink). Each of these questions is the next post in this series:

- Learn, Speak, Repeat!: can the voice partner get cheap enough that €39 stops being the question?
- UserTold: what are the people from ChatGPT actually looking for?
- MakeFX: can my agent make MakeFX's own promo on MakeFX, end to end?
- FellowMakers: do strangers who match on the map actually talk?

## Related

- [The orchestrator moved into the session](/posts/orchestrator-moved-into-the-session)
- [The gates, not the autonomy](/posts/gates-not-autonomy)
