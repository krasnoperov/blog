import { expect, test } from '@playwright/test';

const postPath = '/posts/two-films-about-durable-objects';
const videoPaths = [
  '/media/celld/durable-objects-explained.mp4',
  '/media/celld/durable-objects-under-the-hood.mp4',
];

test.describe('Durable Objects film post', () => {
  test('renders and serves both local films', async ({ page, request }) => {
    await page.goto(postPath);

    await expect(page.getByRole('heading', { name: 'I asked GPT-5.6 to explain Durable Objects' })).toBeVisible();
    const videos = page.locator('video');
    await expect(videos).toHaveCount(2);
    await expect(videos.nth(0)).toHaveAttribute('poster', '/media/celld/durable-objects-explained-poster.jpg');
    await expect(videos.nth(1)).toHaveAttribute('poster', '/media/celld/durable-objects-under-the-hood-poster.jpg');

    for (const [index, path] of videoPaths.entries()) {
      await expect(videos.nth(index).locator('source')).toHaveAttribute('src', path);
      const response = await request.head(path, { failOnStatusCode: false });
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toBe('video/mp4');
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
