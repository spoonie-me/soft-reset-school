import { describe, it, expect, afterEach } from 'vitest';
import { canAccessLesson, hasFullAccess, lockedMessage } from '../access';
import { coursesEnabled } from '../flags';

// Two domains in a sellable track "t1" and one domain in an open track "open".
const dA1 = { id: 'dA1', trackId: 't1', order: 1, courseForSale: true };
const dA2 = { id: 'dA2', trackId: 't1', order: 2, courseForSale: true };
const dOpen = { id: 'dO', trackId: 'open', order: 2, courseForSale: false };
// A domain in a sellable track that has no course entry.
const dNoSale = { id: 'dN', trackId: 't1', order: 3, courseForSale: false };

function check(domain: typeof dA1, moduleOrder: number, lessonOrder: number, own: { tracks?: string[]; courses?: string[] } = {}) {
  return canAccessLesson({
    domain,
    module: { order: moduleOrder },
    lesson: { order: lessonOrder },
    trackAccess: own.tracks ?? ['open'],
    courseAccess: own.courses ?? [],
  });
}

// A literal copy of the access logic on origin/main before courses existed
// (isTrialLesson plus the trackAccess check in the routes). Do not call the
// current code from here.
function oldRule(domain: typeof dA1, moduleOrder: number, lessonOrder: number, tracks: string[]) {
  const lesson = { order: lessonOrder, module: { order: moduleOrder, domain: { order: domain.order } } };
  const isTrial = lesson?.order === 1 && lesson.module?.order === 1 && lesson.module.domain?.order === 1;
  return isTrial || tracks.includes(domain.trackId ?? '');
}

afterEach(() => {
  delete process.env.COURSES_ENABLED;
});

describe('coursesEnabled', () => {
  it('is false by default and true only for the exact string "true"', () => {
    expect(coursesEnabled()).toBe(false);
    for (const v of ['1', 'TRUE', 'yes', '', 'false']) {
      process.env.COURSES_ENABLED = v;
      expect(coursesEnabled()).toBe(false);
    }
    process.env.COURSES_ENABLED = 'true';
    expect(coursesEnabled()).toBe(true);
  });
});

describe('flag off: identical to the old track rule', () => {
  it('matches the old rule for every combination, even when a course is owned', () => {
    for (const d of [dA1, dA2, dOpen, dNoSale]) {
      for (const m of [1, 2]) {
        for (const l of [1, 2]) {
          for (const tracks of [[], ['t1'], ['open'], ['t1', 'open']]) {
            for (const courses of [[], [d.id]]) {
              expect(check(d, m, l, { tracks, courses })).toBe(oldRule(d, m, l, tracks));
            }
          }
        }
      }
    }
  });

  it('null module, null domain and undefined trackAccess behave as the old rule', () => {
    // Old rule with a missing piece: not a trial, and no track access means locked.
    expect(canAccessLesson({ domain: dA1, module: null, lesson: { order: 1 }, trackAccess: [] })).toBe(false);
    expect(canAccessLesson({ domain: null, module: { order: 1 }, lesson: { order: 1 }, trackAccess: [] })).toBe(false);
    expect(canAccessLesson({ domain: dA1, module: { order: 1 }, lesson: { order: 1 }, trackAccess: undefined })).toBe(true);
    expect(canAccessLesson({ domain: dA2, module: { order: 1 }, lesson: { order: 1 }, trackAccess: undefined })).toBe(false);
    expect(canAccessLesson({ domain: dA1, module: null, lesson: { order: 1 }, trackAccess: ['t1'] })).toBe(true);
    expect(hasFullAccess({ domain: null, trackAccess: [''] })).toBe(true); // old: includes('') on a missing trackId
    expect(hasFullAccess({ domain: undefined, trackAccess: undefined })).toBe(false);
  });

  it('403 wording is the exact old text', () => {
    expect(lockedMessage()).toBe('You need the full track to read this. The first lesson of every track is a free trial.');
  });

  it('only the first lesson of the first domain is free', () => {
    expect(check(dA1, 1, 1, { tracks: [] })).toBe(true);
    expect(check(dA2, 1, 1, { tracks: [] })).toBe(false);
  });

  it('owning a course does nothing', () => {
    expect(check(dA2, 2, 1, { tracks: [], courses: ['dA2'] })).toBe(false);
    expect(hasFullAccess({ domain: dA2, trackAccess: [], courseAccess: ['dA2'] })).toBe(false);
  });
});

describe('flag on', () => {
  const on = () => {
    process.env.COURSES_ENABLED = 'true';
  };

  it('track owner reads every domain of the track', () => {
    on();
    expect(check(dA1, 2, 3, { tracks: ['t1'] })).toBe(true);
    expect(check(dA2, 2, 3, { tracks: ['t1'] })).toBe(true);
  });

  it('course owner reads only that domain, the other domain of the track stays locked', () => {
    on();
    const own = { tracks: [], courses: ['dA2'] };
    expect(check(dA2, 2, 3, own)).toBe(true);
    expect(check(dA1, 2, 3, own)).toBe(false);
    expect(hasFullAccess({ domain: dA2, trackAccess: [], courseAccess: ['dA2'] })).toBe(true);
    expect(hasFullAccess({ domain: dA1, trackAccess: [], courseAccess: ['dA2'] })).toBe(false);
  });

  it('nobody: only lesson 1 of module 1 of each domain is free', () => {
    on();
    expect(check(dA1, 1, 1, { tracks: [] })).toBe(true);
    expect(check(dA2, 1, 1, { tracks: [] })).toBe(true);
    expect(check(dA2, 1, 2, { tracks: [] })).toBe(false);
    expect(check(dA2, 2, 1, { tracks: [] })).toBe(false);
  });

  it('a domain that is not for sale as a course gets no extra free lesson', () => {
    on();
    expect(check(dNoSale, 1, 1, { tracks: [] })).toBe(false);
    expect(check(dNoSale, 1, 1, { tracks: ['t1'] })).toBe(true);
    expect(check(dNoSale, 1, 1, { tracks: [], courses: ['dN'] })).toBe(true);
  });

  it('403 wording says course when the flag is on', () => {
    on();
    expect(lockedMessage()).toContain('first lesson of every course');
    expect(lockedMessage()).not.toContain('every track');
  });

  it('null module or null domain is locked unless owned', () => {
    on();
    expect(canAccessLesson({ domain: dA1, module: null, lesson: { order: 1 }, trackAccess: [] })).toBe(false);
    expect(canAccessLesson({ domain: null, module: { order: 1 }, lesson: { order: 1 }, trackAccess: [] })).toBe(false);
  });

  it('module order 1 with lesson order 2 is not free', () => {
    on();
    expect(check(dA1, 1, 2, { tracks: [] })).toBe(false);
    expect(check(dA2, 1, 2, { tracks: [] })).toBe(false);
  });

  it('a domain with a single module still has only one free lesson', () => {
    on();
    expect(check(dA2, 1, 1, { tracks: [] })).toBe(true);
    expect(check(dA2, 1, 2, { tracks: [] })).toBe(false);
  });

  it('a track that is not for sale stays open (it is in trackAccess)', () => {
    on();
    expect(check(dOpen, 3, 4, { tracks: ['open'] })).toBe(true);
  });

  it('a course on its own does not open the exam or module-level content of another domain', () => {
    on();
    expect(hasFullAccess({ domain: dA1, trackAccess: [], courseAccess: ['dA2'] })).toBe(false);
    expect(hasFullAccess({ domain: null, trackAccess: [], courseAccess: ['dA2'] })).toBe(false);
  });

  it('missing access lists fail closed', () => {
    on();
    expect(canAccessLesson({ domain: dA1, module: { order: 2 }, lesson: { order: 2 }, trackAccess: undefined })).toBe(false);
  });
});

describe('flag on: health-informatics style track (domains not for sale as courses)', () => {
  // Domain order 1 is the old trial lesson, the rest are not courses.
  const hi1 = { id: 'h1', trackId: 'hi', order: 1, courseForSale: false };
  const hi2 = { id: 'h2', trackId: 'hi', order: 2, courseForSale: false };
  const on = () => {
    process.env.COURSES_ENABLED = 'true';
  };

  it('keeps today\'s free lesson even though the domain is not a course', () => {
    on();
    expect(check(hi1, 1, 1, { tracks: [] })).toBe(true);
  });

  it('gives no other free lesson', () => {
    on();
    expect(check(hi2, 1, 1, { tracks: [] })).toBe(false);
    expect(check(hi1, 1, 2, { tracks: [] })).toBe(false);
    expect(check(hi1, 2, 1, { tracks: [] })).toBe(false);
  });

  it('track owner still reads everything', () => {
    on();
    expect(check(hi2, 3, 3, { tracks: ['hi'] })).toBe(true);
  });
});
