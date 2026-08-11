import { expect, test } from '@playwright/test';

const postPath = '/posts/two-films-about-durable-objects';
const videoPaths = [
  '/media/celld/durable-objects-explained.mp4',
  '/media/celld/durable-objects-under-the-hood.mp4',
];

test.describe('Durable Objects film post', () => {
  test('renders and serves both local films', async ({ page, request }) => {
    await page.goto(postPath);

    const navigation = page.getByRole('navigation');
    await expect(navigation.getByRole('link')).toHaveCount(1);
    await expect(navigation.getByRole('link', { name: 'krasnoperov.me' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Two films about Durable Objects and celld' })).toBeVisible();
    const videos = page.locator('video');
    await expect(videos).toHaveCount(2);
    await expect(videos.nth(0)).toHaveAttribute('poster', '/media/celld/durable-objects-explained-poster.jpg');
    await expect(videos.nth(1)).toHaveAttribute('poster', '/media/celld/durable-objects-under-the-hood-poster.jpg');

    for (const [index, path] of videoPaths.entries()) {
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
  });

  test('centers desktop players at up to twice the article width', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(postPath);

    const geometry = await page.evaluate(() => {
      const article = document.querySelector('article')?.getBoundingClientRect();
      const videos = [...document.querySelectorAll('video')].map((video) => video.getBoundingClientRect());
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
  });

  test('keeps the article and both players inside a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(postPath);

    await expect(page.locator('video')).toHaveCount(2);
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
  });
});
