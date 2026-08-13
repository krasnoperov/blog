import { expect, test } from '@playwright/test';

const postCases = [
  {
    path: '/posts/two-films-about-durable-objects',
    heading: 'Durable Objects beyond Cloudflare with celld',
    videoPaths: [
      '/media/celld/durable-objects-explained.mp4',
      '/media/celld/durable-objects-under-the-hood.mp4',
    ],
    posterPaths: [
      '/media/celld/durable-objects-explained-poster.jpg',
      '/media/celld/durable-objects-under-the-hood-poster.jpg',
    ],
  },
  {
    path: '/posts/writing-practice-on-celld',
    heading: 'A writing coach on celld',
    videoPaths: ['/media/celld/writing-practice-on-celld.mp4'],
    posterPaths: ['/media/celld/writing-practice-on-celld-poster.jpg'],
  },
] as const;

test.describe('celld film posts', () => {
  test('renders and serves all local films', async ({ page, request }) => {
    for (const post of postCases) {
      await page.goto(post.path);

      const navigation = page.getByRole('navigation');
      await expect(navigation.getByRole('link')).toHaveCount(1);
      await expect(navigation.getByRole('link', { name: 'krasnoperov.me' })).toBeVisible();
      await expect(page.getByRole('heading', { name: post.heading })).toBeVisible();
      const videos = page.locator('video');
      await expect(videos).toHaveCount(post.videoPaths.length);

      for (const [index, path] of post.posterPaths.entries()) {
        await expect(videos.nth(index)).toHaveAttribute('poster', path);
      }

      for (const [index, path] of post.videoPaths.entries()) {
        await expect(videos.nth(index).locator('source')).toHaveAttribute('src', path);
        const response = await request.get(path, {
          failOnStatusCode: false,
          headers: { Range: 'bytes=0-1023' },
        });
        expect(response.status()).toBe(206);
        expect(response.headers()['content-type']).toBe('video/mp4');
        expect(response.headers()['accept-ranges']).toBe('bytes');
        expect(response.headers()['content-range']).toMatch(/^bytes 0-1023\/\d+$/);
        expect((await response.body()).byteLength).toBe(1024);
      }
    }
  });

  test('centers desktop players at up to twice the article width', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });

    for (const post of postCases) {
      await page.goto(post.path);

      const geometry = await page.evaluate(() => {
        const article = document.querySelector('article')?.getBoundingClientRect();
        const videos = [...document.querySelectorAll('video')].map((video) =>
          video.getBoundingClientRect(),
        );
        return {
          article: article ? { left: article.left, width: article.width } : null,
          videos: videos.map((video) => ({ left: video.left, width: video.width })),
        };
      });

      expect(geometry.article).not.toBeNull();
      for (const video of geometry.videos) {
        expect(video.width).toBeCloseTo(geometry.article!.width * 2, 0);
        expect(video.left + video.width / 2).toBeCloseTo(
          geometry.article!.left + geometry.article!.width / 2,
          0,
        );
      }
    }
  });

  test('keeps the article and all players inside a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const post of postCases) {
      await page.goto(post.path);

      await expect(page.locator('video')).toHaveCount(post.videoPaths.length);
      const geometry = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        videos: [...document.querySelectorAll('video')].map((video) => {
          const rect = video.getBoundingClientRect();
          return { left: rect.left, right: rect.right, width: rect.width, height: rect.height };
        }),
      }));

      expect(geometry.scrollWidth).toBe(geometry.clientWidth);
      for (const video of geometry.videos) {
        expect(video.left).toBeGreaterThanOrEqual(0);
        expect(video.right).toBeLessThanOrEqual(geometry.clientWidth);
        expect(video.width / video.height).toBeCloseTo(16 / 9, 1);
      }
    }
  });
});
