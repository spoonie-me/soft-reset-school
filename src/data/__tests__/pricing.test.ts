import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  TRACK_PRICE,
  BUNDLE_PRICES,
  MAX_BUNDLE_SIZE,
  COURSE_PRICE,
  COURSE_BUNDLE_3_PRICE,
  COURSE_TRACK_PRICE,
} from '../pricing';

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

describe('flag-off prices stay as on main', () => {
  it('track 99, bundles 149 and 199, at most 3 tracks', () => {
    expect(TRACK_PRICE).toBe(99);
    expect(BUNDLE_PRICES).toEqual({ 2: 149, 3: 199 });
    expect(MAX_BUNDLE_SIZE).toBe(3);
  });
});

describe('course prices (flag on)', () => {
  it('are 29, 69 and 99', () => {
    expect(COURSE_PRICE).toBe(29);
    expect(COURSE_BUNDLE_3_PRICE).toBe(69);
    expect(COURSE_TRACK_PRICE).toBe(99);
  });

  it('match the backend', () => {
    const cents = (name: string) => Number(stripeSrc.match(new RegExp(`${name}\\s*=\\s*(\\d+)`))?.[1]);
    expect(cents('COURSE_PRICE_CENTS')).toBe(COURSE_PRICE * 100);
    expect(cents('COURSE_BUNDLE_3_PRICE_CENTS')).toBe(COURSE_BUNDLE_3_PRICE * 100);
    expect(cents('COURSE_TRACK_PRICE_CENTS')).toBe(COURSE_TRACK_PRICE * 100);
  });
});
