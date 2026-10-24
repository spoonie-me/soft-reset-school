/* The free trial is one lesson per career track. The backend decides it by
 * position (lesson 1, module 1, first domain), the catalog names it by id so
 * the signup page can link to it. If they ever disagree, a learner clicks
 * "Start lesson 1" and hits a locked page, so fail the build instead. */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { CATALOG_TRACKS } from '../trackCatalog';

const SEED = path.resolve(__dirname, '../../../backend/prisma/seed-data/domains');
const readJson = <T,>(...parts: string[]): T => JSON.parse(fs.readFileSync(path.join(SEED, ...parts), 'utf8')) as T;

interface Row { id: string; order: number; moduleId?: string; slug?: string }

describe('trial lessons', () => {
  const career = CATALOG_TRACKS.filter((t) => t.kind === 'career');

  it('names a trial lesson for every career track', () => {
    for (const t of career) expect(t.trialLessonId, t.slug).toBeTruthy();
  });

  it.each(career.map((t) => [t.slug, t.trialLessonId] as const))('%s: %s is lesson 1 of module 1 of the first domain', (slug, lessonId) => {
    const domains = readJson<Row[]>(slug, 'domains.json');
    const first = domains.find((d) => d.order === 1);
    expect(first?.slug).toBeTruthy();
    const modules = readJson<Row[]>(slug, first!.slug!, 'modules.json');
    const lessons = readJson<Row[]>(slug, first!.slug!, 'lessons.json');
    const lesson = lessons.find((l) => l.id === lessonId);
    expect(lesson, 'lesson exists in the first domain').toBeTruthy();
    expect(lesson!.order).toBe(1);
    expect(modules.find((m) => m.id === lesson!.moduleId)?.order).toBe(1);
  });
});
