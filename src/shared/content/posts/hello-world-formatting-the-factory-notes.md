---
title: Hello World for Factory Notes
summary: A self-demonstrating post that shows how this blog renders markdown structure, code, tables, and Mermaid diagrams.
publishedAt: 2026-03-28
readingTime: 2 min read
tags: hello-world, markdown, diagrams
featured: false
---

I use this first post to check how the blog renders headings, quotes, code, tables, and Mermaid diagrams. The examples below double as a rendering fixture.

## Headings and quotes

A heading separates sections. A blockquote should remain distinct from the surrounding prose:

> Check the rendered preview as well as the markdown source.

## Example source pattern

A short markdown example:

```md
## Outcome
Make the next step obvious.

## Constraints
- Keep the source static.
- Make diagrams easy to embed.
```

## Diagram examples

These four examples exercise different Mermaid renderers.

### 1. Flow of a note through the system

```mermaid
flowchart LR
  A[Idea] --> B[Markdown note]
  B --> C[Rendered post]
  C --> D[Shared understanding]
```

### 2. Review loop between author and publishing surface

```mermaid
sequenceDiagram
  autonumber
  participant Author
  participant Repo
  participant Renderer
  participant Reader

  Author->>Repo: Write markdown note
  Repo->>Renderer: Trigger build
  Renderer-->>Author: Preview rendered article
  Author->>Repo: Adjust wording and structure
  Renderer->>Reader: Publish polished post
  Reader-->>Author: Shared understanding
```

### 3. State of an idea before it becomes useful

```mermaid
stateDiagram-v2
  [*] --> Captured
  Captured --> Shaped: Add constraints
  Shaped --> Demonstrated: Add examples
  Demonstrated --> Published: Render the note
  Published --> Reused: Link it in later work
  Reused --> Published: Revise with better detail
```

### 4. Architecture view of a tiny publishing factory

```mermaid
architecture-beta
  group edge(cloud)[Edge delivery]
  group authoring(server)[Authoring loop]
  group content(database)[Content store]

  service writer(server)[Writer workstation] in authoring
  service git(disk)[Git repo] in content
  service build(server)[Build pipeline] in authoring
  service worker(server)[Cloudflare Worker] in edge
  service reader(internet)[Reader browser] in edge

  writer:R --> L:git
  git:T --> B:build
  build:R --> L:worker
  reader:L --> R:worker
```

## Table example

The table should stay readable at narrow widths.

| Layer | Format | Why it exists |
|-|-|-|
| Source | Markdown | Easy to write and review |
| Structure | Frontmatter | Gives the post metadata |
| Diagram | Mermaid | Shows system flow clearly |
| Output | HTML | Makes the note pleasant to read |

## A small code example

Code blocks preserve indentation and scroll when needed:

```ts
type FactoryNote = {
  title: string;
  markdown: string;
  publishedAt: string;
};
```
