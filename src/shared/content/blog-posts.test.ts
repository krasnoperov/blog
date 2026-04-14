import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { BLOG_POST_MANIFEST } from './blog-post-manifest';
import { createBlogPost, createBlogPostSummary } from './blog-posts-core';

const postsDirectory = path.resolve('src/shared/content/posts');

async function readPostFiles() {
  const entries = await readdir(postsDirectory);
  const markdownFiles = entries.filter((entry) => entry.endsWith('.md')).sort();

  return Promise.all(
    markdownFiles.map(async (entry) => ({
      name: entry,
      slug: entry.replace(/\.md$/, ''),
      content: await readFile(path.join(postsDirectory, entry), 'utf8'),
    })),
  );
}

test('blog post source files exist', async () => {
  const posts = await readPostFiles();

  assert.ok(posts.length > 0);
  assert.equal(posts.length, BLOG_POST_MANIFEST.length);
});

test('every post starts with frontmatter and includes required metadata', async () => {
  const posts = await readPostFiles();

  for (const post of posts) {
    assert.match(post.content, /^---\n[\s\S]*\n---\n/);
    assert.match(post.content, /\ntitle:\s.+/);
    assert.match(post.content, /\nsummary:\s.+/);
    assert.match(post.content, /\npublishedAt:\s\d{4}-\d{2}-\d{2}/);
    assert.match(post.content, /\nreadingTime:\s.+/);
    assert.match(post.content, /\ntags:\s.+/);
  }
});

test('manifest slugs match markdown files and source metadata stays aligned', async () => {
  const posts = await readPostFiles();
  const postSlugs = posts.map((post) => post.slug).sort();
  const manifestSlugs = BLOG_POST_MANIFEST.map((post) => post.slug).sort();

  assert.deepEqual(postSlugs, manifestSlugs);

  for (const entry of BLOG_POST_MANIFEST) {
    const source = posts.find((post) => post.slug === entry.slug);

    assert.ok(source, `Missing markdown source for ${entry.slug}`);
    assert.doesNotThrow(() => createBlogPost(createBlogPostSummary(entry), source.content));
  }
});

test('featured post marker exists in the manifest and at least one source file', async () => {
  const posts = await readPostFiles();

  assert.ok(BLOG_POST_MANIFEST.some((post) => post.featured));
  assert.ok(posts.some((post) => /\nfeatured:\s*true/.test(post.content)));
});

test('starter post demonstrates markdown and Mermaid authoring', async () => {
  const posts = await readPostFiles();
  const starter = posts.find((post) => post.slug === 'hello-world-formatting-the-factory-notes');

  assert.ok(starter);
  assert.match(starter.content, /```md/);
  assert.match(starter.content, /```mermaid/);
  assert.ok((starter.content.match(/```mermaid/g) ?? []).length >= 4);
  assert.match(starter.content, /flowchart LR/);
  assert.match(starter.content, /sequenceDiagram/);
  assert.match(starter.content, /stateDiagram-v2/);
  assert.match(starter.content, /architecture-beta/);
  assert.match(starter.content, /\| Layer \| Format \| Why it exists \|/);
});
