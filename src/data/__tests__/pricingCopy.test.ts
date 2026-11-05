import { describe, it, expect, afterEach, vi } from 'vitest';
import { COURSE_COPY, courseCopy, purchaseValue } from '../pricingCopy';
import { COURSES_SEO, PRICING_SEO, TRACKS_SEO, trackSeoDescription, courseSeo } from '../courseSeo';
import { COURSE_CATALOG } from '../courseCatalog';

afterEach(() => vi.unstubAllEnvs());

// House rules for new copy: no em dashes, no semicolons, nothing about illness,
// no promise of a job or income.
const ILLNESS = /\b(ill|illness|sick|chronic|disabled|disability|patient|spoon|pots|diagnosis|diagnosed|symptom|flare|crash)/i;
const PROMISE = /\b(you will (get|land|earn)|guarantee[ds]?|get hired|land a job|earn €|income)\b/i;

function texts(): string[] {
  return [
    ...Object.values(COURSE_COPY),
    ...Object.values(COURSES_SEO),
    ...Object.values(PRICING_SEO).filter((v) => !v.startsWith('Pricing')),
    TRACKS_SEO.description,
    trackSeoDescription('A pitch.'),
    ...COURSE_CATALOG.flatMap((c) => Object.values(courseSeo(c))),
  ];
}

describe('course copy', () => {
  it('is off by default and on only for the exact string "true"', () => {
    expect(courseCopy()).toBeNull();
    for (const v of ['1', 'TRUE', 'yes', '', 'false']) {
      vi.stubEnv('VITE_COURSES_ENABLED', v);
      expect(courseCopy()).toBeNull();
    }
    vi.stubEnv('VITE_COURSES_ENABLED', 'true');
    expect(courseCopy()).toBe(COURSE_COPY);
  });

  it('has no em dashes and no semicolons', () => {
    for (const t of texts()) {
      expect(t, t).not.toMatch(/—/);
      expect(t, t).not.toMatch(/;/);
    }
  });

  it('says nothing about illness and promises no job or income', () => {
    for (const t of texts()) {
      expect(t, t).not.toMatch(ILLNESS);
      expect(t, t).not.toMatch(PROMISE);
    }
  });

  it('states the three prices', () => {
    expect(COURSE_COPY.priceLine).toBe('A course is €29. Any 3 courses are €69. A whole track is €99.');
  });

  it('reports GA4 value 29 for one course, 69 for three, and defers to the track value otherwise', () => {
    expect(purchaseValue('course', 1)).toBe(29);
    expect(purchaseValue('course', 3)).toBe(69);
    expect(purchaseValue('track_credential', 0)).toBeNull();
  });
});
