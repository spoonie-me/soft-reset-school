// Who can read lesson content.
//
// Content is paid per track (one-time, same purchase as the exam and
// credential). The trial is the first lesson of each track: lesson 1, of
// module 1, of the track's first domain. Everything else needs a purchase.
//
// Earlier accounts used to keep free access. That was switched off, so by
// default nobody is grandfathered. To bring it back for accounts created
// before a date, set LEGACY_FREE_ACCESS_BEFORE to that ISO date.

const LEGACY_DEFAULT = 'none';

export function legacyFreeAccessBefore(): Date | null {
  const raw = process.env.LEGACY_FREE_ACCESS_BEFORE ?? LEGACY_DEFAULT;
  if (raw.trim().toLowerCase() === 'none') return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
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
