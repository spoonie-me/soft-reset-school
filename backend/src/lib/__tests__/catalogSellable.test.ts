// Every course in the generated catalog must belong to a track the backend can
// actually sell. Otherwise the site lists a Buy button that checkout rejects.
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_placeholder');

describe('course catalog vs sellable tracks', () => {
  it('has no catalog course in a track that is not sellable', async () => {
    const { CREDENTIAL_SELLABLE_TRACKS } = await import('../stripe');
    const file = path.resolve(__dirname, '../../../../src/data/courseCatalog.ts');
    const src = fs.readFileSync(file, 'utf8');
    const tracks = [...src.matchAll(/"trackId":\s*"([^"]+)"/g)].map((m) => m[1]);
    expect(tracks.length).toBeGreaterThan(0);
    const sellable = new Set<string>(CREDENTIAL_SELLABLE_TRACKS as readonly string[]);
    const bad = [...new Set(tracks)].filter((t) => !sellable.has(t));
    expect(bad).toEqual([]);
  });
});
