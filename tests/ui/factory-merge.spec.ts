import { expect, test } from '@playwright/test';

interface ItemState {
  id: number;
  path: string;
  stage: string;
  ci: number | null;
  x: number;
  y: number;
  z: number;
}

// PRs from the three lines cross a square collector and queue up behind
// each other; boxes never share a spot anywhere on the line. Past the
// collector, a gate admits each PR into the merge queue, where every
// candidate's CI runs at the same time.
test('factory merge node never overlaps and keeps the queue moving', async ({ page }) => {
  await page.goto('/');
  const stage = page.locator('.fx-stage');
  await expect(stage).toBeVisible();
  // The live model attaches its snapshot once the figure starts on the client.
  await page.waitForFunction(() => typeof (document.querySelector('.fx-stage') as (Element & { factoryState?: unknown }) | null)?.factoryState === 'function');

  const read = () =>
    stage.evaluate((el) => (el as HTMLElement & { factoryState: () => ItemState[] }).factoryState());

  const first = await read();
  const inQueue = (item: ItemState) => item.stage === 'approved' && ['trunk', 'queue'].includes(item.path);
  const queuedAtStart = new Set(first.filter(inQueue).map((item) => item.id));
  const enteredQueue = new Set<number>();
  let parallel = 0;
  let last = first;
  for (let sample = 0; sample < 120; sample++) {
    const items = await read();
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        if (Math.abs(a.z - b.z) > 8) continue;
        const overlapping = Math.abs(a.x - b.x) < 15.5 && Math.abs(a.y - b.y) < 13.5;
        expect(overlapping, `items ${a.id} (${a.path}) and ${b.id} (${b.path}) overlap at ${a.x.toFixed(1)},${a.y.toFixed(1)}`).toBe(false);
      }
    }
    for (const item of items) if (inQueue(item) && !queuedAtStart.has(item.id)) enteredQueue.add(item.id);
    // Candidates in the queue test in parallel: several CIs part way at once.
    const running = items.filter((item) => item.path === 'queue' && item.ci !== null && item.ci > 0 && item.ci < 1).length;
    parallel = Math.max(parallel, running);
    last = items;
    await page.waitForTimeout(100);
  }
  // The queue moves both ways: new PRs come in across the collector, and PRs
  // that were already queued leave it, delivered to main or sent back.
  const stillQueued = new Set(last.filter(inQueue).map((item) => item.id));
  const leftQueue = [...queuedAtStart].filter((id) => !stillQueued.has(id));
  expect(enteredQueue.size, 'a PR entered the queue during the sample').toBeGreaterThan(0);
  expect(leftQueue.length, 'a PR that was queued at the start left the queue').toBeGreaterThan(0);
  expect(parallel, 'several queued candidates were testing at the same time').toBeGreaterThan(1);
});
