import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { TRACK_PRICE, BUNDLE_PRICES } from '../pricing';

// The frontend shows prices from src/data/pricing.ts; the backend charges what
// backend/src/lib/stripe.ts says. If the two ever disagree, a learner is
// charged a different amount than the page promised.
const stripeSrc = readFileSync(join(__dirname, '../../../backend/src/lib/stripe.ts'), 'utf8');

describe('credential prices', () => {
  it('track price matches the backend', () => {
    const m = stripeSrc.match(/track_credential:\s*{\s*priceInCents:\s*(\d+)/);
    expect(Number(m?.[1])).toBe(TRACK_PRICE * 100);
  });

  it('bundle prices match the backend', () => {
    const m = stripeSrc.match(/PROGRAM_PRICES_IN_CENTS[^{]*{([^}]*)}/);
    const backend = Object.fromEntries(
      [...(m?.[1] ?? '').matchAll(/(\d+):\s*(\d+)/g)].map(([, n, cents]) => [Number(n), Number(cents) / 100]),
    );
    expect(backend).toEqual(BUNDLE_PRICES);
  });
});
