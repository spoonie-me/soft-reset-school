/* The course catalog is generated from the seed data by scripts/sync-courses.mjs
 * and committed. If the seed data changes and the file is not regenerated, a
 * course page would show modules or a free lesson that no longer exist, so this
 * fails. Fix: node scripts/sync-courses.mjs */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
// @ts-expect-error plain .mjs script with no type declarations
import { buildCourseCatalog } from '../../../scripts/sync-courses.mjs';
import { COURSE_CATALOG, getCourse, coursesOfTrack } from '../courseCatalog';
import { CATALOG_TRACKS } from '../trackCatalog';

const SEED = path.resolve(__dirname, '../../../backend/prisma/seed-data');
const courses = JSON.parse(fs.readFileSync(path.join(SEED, 'courses.json'), 'utf8')) as Record<string, { courseForSale: boolean; courseSlug: string }>;

describe('courseCatalog', () => {
  it('matches what the seed data builds (no drift)', () => {
    expect(COURSE_CATALOG).toEqual(buildCourseCatalog());
  });

  it('lists exactly the courses with courseForSale true', () => {
    const forSale = Object.values(courses).filter((c) => c.courseForSale).map((c) => c.courseSlug).sort();
    expect(COURSE_CATALOG.map((c) => c.slug).sort()).toEqual(forSale);
  });

  it('has unique slugs and unique domain keys', () => {
    expect(new Set(COURSE_CATALOG.map((c) => c.slug)).size).toBe(COURSE_CATALOG.length);
    expect(new Set(COURSE_CATALOG.map((c) => c.domainKey)).size).toBe(COURSE_CATALOG.length);
  });

  it('belongs to tracks the public catalog knows', () => {
    const tracks = new Set(CATALOG_TRACKS.map((t) => t.slug));
    for (const c of COURSE_CATALOG) expect(tracks.has(c.trackId), c.slug).toBe(true);
  });

  it('adds up: module lesson counts sum to the course lesson count', () => {
    for (const c of COURSE_CATALOG) {
      expect(c.modules.reduce((n, m) => n + m.lessonCount, 0), c.slug).toBe(c.lessonCount);
      expect(c.modules.length).toBeGreaterThan(0);
      expect(c.firstLessonId).toBeTruthy();
    }
  });

  it('looks courses up by slug and by track in order', () => {
    const first = COURSE_CATALOG[0];
    expect(getCourse(first.slug)).toBe(first);
    expect(getCourse('nope')).toBeUndefined();
    expect(getCourse(undefined)).toBeUndefined();
    const list = coursesOfTrack(first.trackId);
    expect(list.map((c) => c.order)).toEqual([...list.map((c) => c.order)].sort((a, b) => a - b));
  });
});
