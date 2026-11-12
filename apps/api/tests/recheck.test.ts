import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CatalogStore } from '../src/lib/catalogStore';
import { syncSources } from '../src/recheck/engine';
import { harness, type Harness } from './helpers';

let h: Harness;
beforeAll(async () => {
  h = await harness();
});
afterAll(async () => {
  await h.close();
});

describe('recheck sources', () => {
  it('collects the links of the catalogue and keeps the table in step with it', async () => {
    const store = new CatalogStore(h.prisma);
    const first = await syncSources(h.prisma, store);
    expect(first.total).toBeGreaterThan(100);
    expect(await h.prisma.source.count()).toBe(first.total);
    const again = await syncSources(h.prisma, store);
    expect(again.added).toBe(0);
    expect(again.removed).toBe(0);
  });
});
