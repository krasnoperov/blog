---
title: 'What the factory is for'
summary: 'For a year this blog was about building a software factory. At my scale it is finished, so the blog moves on to the four products it ships: UserTold, MakeFX, FellowMakers, and Learn, Speak, Repeat!'
publishedAt: 2026-10-08
readingTime: 6 min read
tags: indie-hacking, usertold, makefx, learnspeakrepeat, fellowmakers
featured: true
---

For a year this blog has been about one thing: building a software factory. Permission prompts, a rented box with nothing on it, patchrelay, review-quill, merge-steward, and most recently [the orchestrator moving into the session](/posts/orchestrator-moved-into-the-session). I'm calling that done. Not perfect, but done for the scale I work at. One person with a couple of models, a reviewer, and a merge queue ships faster than I can decide what's worth shipping.

That moves the bottleneck from building to choosing, which is a better problem to have and a better thing to write about. So from here on, this blog is about the products and what I learn running them.

## Who's writing

I'm Aleksei Krasnoperov. I'm 40, a digital nomad from Siberia, living in Alicante, Spain. On X I'm [@snejink](https://x.com/snejink), and my bio there says "Shippin'", which is still the most accurate description I have.

In September a founder in Germany posted three lines on X: an age, a country, and a wish to meet other builders. Hundreds of people answered in the same shape, me included. I wanted to see who all those people were, so I read the threads and built [FellowMakers](https://fellowmakers.app): a map of who answered and what they're building, drawn only from what they wrote themselves. [My card is there too](https://fellowmakers.app/people/snejink). It's the shortest honest summary of me there is, and a good place to find people building the same thing you are.

The rest of this post is the other three things I'm building, and the open question each of them has right now.

## UserTold: people come for something else

```image
/media/posts/what-the-factory-is-for/usertold.webp
A voice line goes in through one door and leaves along several paths.
```

[UserTold](https://usertold.ai) runs voice interviews with real users inside your product, or quietly observes how they use it, and turns what they said and did into evidence you can check: the quote, the screen, the page they were on. Agents can drive it through MCP, so a coding agent that already turns issues into merged PRs gets the missing upstream piece: what users actually said.

UserTold recently got listed in ChatGPT, and that listing now drives registrations. That's the good news. The interesting news is that the people arriving through it don't seem to come for what I built it for. They want something else, and I don't know yet what it is.

That's a good problem for this particular product. A tool for asking users why is the right tool for finding out why its own users showed up. So the next study UserTold runs is about UserTold.

## MakeFX: makes everything except its own poster

```image
/media/posts/what-the-factory-is-for/makefx.webp
A canvas of finished assets, each tied to its recipe, and one empty tile.
```

[MakeFX](https://makefx.app) is a canvas for agent-made media. Your agent generates images, video, and audio, everything lands on one canvas, and every asset keeps its recipe: the model, the prompt, the references, and what it cost. You pay per asset, with no subscription.

It just went through a major rewrite by Fable, and it works beautifully now. It delivers the quality assets I need for my other projects, and I stopped noticing the tool, which is what I wanted.

The assets to promote MakeFX itself are still to be made. That's next.

## Learn, Speak, Repeat! and the course Opus wrote

```image
/media/posts/what-the-factory-is-for/learnspeakrepeat.webp
Two speech loops spiral under an evening moon.
```

[Learn, Speak, Repeat!](https://learnspeakrepeat.com) started as my own problem. I live in Spain, and I need to speak Spanish, not just read it.

It also went through a rewrite, this one by Opus 5.5, and it surprised me the most. I asked Opus to explain Spanish to me. What came back was a complete course, grounded in research on what actually works for teaching Spanish to adults. And it was written separately for English speakers and for Russian speakers.

Every evening it builds a session at your level: review, a short explanation, exercises, listening, and then speaking, either a monologue or a live role-play with a conversation partner that listens, corrects you, and repeats with you. Everything you get wrong becomes a review card for the next evening.

That design has a cost. It relies heavily on customised content and live voice sessions, and running both is expensive enough to push subscription prices to the top of what feels reasonable. But it buys the thing I actually wanted: a fair 20, 40, or 60 minutes of real practice every evening. With that secured, I don't need to follow a course. The practice is the course.

## What this blog is now

The factory posts stay up. They're still the most detailed thing I've written, and the gates they describe are still how everything here ships. But the factory has stopped being the interesting part. The interesting part is what it ships, who uses it, and what they actually came for.

So that's what I'll write about: four products, one person, and what I learn from running them. If you're building something similar, [come find me on FellowMakers](https://fellowmakers.app/people/snejink).

## Related

- [The orchestrator moved into the session](/posts/orchestrator-moved-into-the-session)
- [The gates, not the autonomy](/posts/gates-not-autonomy)
- [From YOLO to patchrelay](/posts/from-yolo-to-patchrelay)
