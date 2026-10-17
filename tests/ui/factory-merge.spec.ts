import { expect, test } from '@playwright/test';

interface ItemState {
  id: number;
  path: string;
  stage: string;
  granted: boolean;
  x: number;
  y: number;
  z: number;
}

// The merge node admits one PR at a time into the funnel and only when the
// queue has room, so boxes never share a spot anywhere on the line.
test('factory merge node never overlaps and keeps the queue moving', async ({ page }) => {
  await page.goto('/');
  const stage = page.locator('.fx-stage');
  await expect(stage).toBeVisible();
  // The live model attaches its snapshot once the figure starts on the client.
  await page.waitForFunction(() => typeof (document.querySelector('.fx-stage') as (Element & { factoryState?: unknown }) | null)?.factoryState === 'function');

  const read = () =>
    stage.evaluate((el) => (el as HTMLElement & { factoryState: () => ItemState[] }).factoryState());

  const first = await read();
  const queuedAtStart = new Set(first.filter((item) => item.path === 'trunk').map((item) => item.id));
  const enteredQueue = new Set<number>();
  let last = first;
  for (let sample = 0; sample < 80; sample++) {
    const items = await read();
    const inFunnel = items.filter((item) => item.granted && item.path !== 'trunk');
    expect(inFunnel.length, 'at most one PR is inside the funnel').toBeLessThanOrEqual(1);
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        if (Math.abs(a.z - b.z) > 8) continue;
        const overlapping = Math.abs(a.x - b.x) < 15.5 && Math.abs(a.y - b.y) < 13.5;
        expect(overlapping, `items ${a.id} (${a.path}) and ${b.id} (${b.path}) overlap at ${a.x.toFixed(1)},${a.y.toFixed(1)}`).toBe(false);
      }
    }
    for (const item of items) if (item.path === 'trunk' && !queuedAtStart.has(item.id)) enteredQueue.add(item.id);
    last = items;
    await page.waitForTimeout(100);
  }
  // The queue moves both ways: new PRs come in through the funnel, and PRs
  // that were already queued leave it for main and the dock.
  const stillThere = new Set(last.map((item) => item.id));
  const leftQueue = [...queuedAtStart].filter((id) => !stillThere.has(id));
  expect(enteredQueue.size, 'a PR entered the queue during the sample').toBeGreaterThan(0);
  expect(leftQueue.length, 'a PR that was queued at the start left the line').toBeGreaterThan(0);
});
