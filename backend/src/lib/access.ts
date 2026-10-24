// Who can read lesson content.
//
// Content is paid per track (one-time, same purchase as the exam and
// credential). The trial is the first lesson of each track: lesson 1, of
// module 1, of the track's first domain. Everything else needs a purchase.
//
// People who signed up before the cutover were told every lesson was free
// forever. They keep that. Set LEGACY_FREE_ACCESS_BEFORE to move the date,
// or to "none" to switch the grandfathering off.

const LEGACY_DEFAULT = '2026-10-24T00:00:00Z';

export function legacyFreeAccessBefore(): Date | null {
  const raw = process.env.LEGACY_FREE_ACCESS_BEFORE ?? LEGACY_DEFAULT;
  if (raw.trim().toLowerCase() === 'none') return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date(LEGACY_DEFAULT) : d;
}

export function isGrandfathered(createdAt: Date | null | undefined): boolean {
  const cutoff = legacyFreeAccessBefore();
  return !!cutoff && !!createdAt && createdAt < cutoff;
}

interface LessonWithPlace {
  order?: number | null;
  module?: { order?: number | null; domain?: { order?: number | null } | null } | null;
}

export function isTrialLesson(lesson: LessonWithPlace | null | undefined): boolean {
  return lesson?.order === 1 && lesson.module?.order === 1 && lesson.module.domain?.order === 1;
}
