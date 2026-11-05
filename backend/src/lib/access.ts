// Who can read lesson content.
//
// Content is paid per track (one-time, same purchase as the exam and
// credential). The trial is the first lesson of each track: lesson 1, of
// module 1, of the track's first domain. Everything else needs a purchase.
//
// Earlier accounts used to keep free access. That was switched off, so by
// default nobody is grandfathered. To bring it back for accounts created
// before a date, set LEGACY_FREE_ACCESS_BEFORE to that ISO date.

import { coursesEnabled } from './flags.js';

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

interface DomainRef {
  id?: string | null;
  trackId?: string | null;
  courseForSale?: boolean | null;
}

/**
 * Does the user own the content of this domain, ignoring the free trial?
 * Flag off: owns the track (exactly the old check). Flag on: owns the track
 * or owns the domain as a course. trackAccess already holds every track that
 * is not for sale, so those stay open.
 */
export function hasFullAccess(args: {
  domain: DomainRef | null | undefined;
  trackAccess: string[] | undefined;
  courseAccess?: string[] | undefined;
}): boolean {
  const trackId = args.domain?.trackId ?? '';
  const ownsTrack = !!args.trackAccess?.includes(trackId);
  if (!coursesEnabled()) return ownsTrack;
  const ownsCourse = !!args.domain?.id && !!args.courseAccess?.includes(args.domain.id);
  return ownsTrack || ownsCourse;
}

/**
 * Can the user read this lesson? Flag off: the old rule (lesson 1 of module 1
 * of the track's first domain is free, the rest needs the track). Flag on: the
 * first lesson of every domain that is for sale as a course is free (on top of the old free lesson), and a
 * bought course opens its domain. Domains not for sale get no extra free lesson but keep the old one.
 */
export function canAccessLesson(args: {
  domain: (DomainRef & { order?: number | null }) | null | undefined;
  module: { order?: number | null } | null | undefined;
  lesson: { order?: number | null } | null | undefined;
  trackAccess: string[] | undefined;
  courseAccess?: string[] | undefined;
}): boolean {
  const { domain, module, lesson } = args;
  // The old free lesson always stays. With courses on, the first lesson of every
  // domain for sale as a course is free too. A sellable track whose domains are
  // not for sale as courses (health-informatics) keeps exactly today's free lesson.
  const oldTrial = isTrialLesson({ order: lesson?.order, module: { order: module?.order, domain: { order: domain?.order } } });
  const courseTrial = coursesEnabled() && lesson?.order === 1 && module?.order === 1 && !!domain?.courseForSale;
  return oldTrial || courseTrial || hasFullAccess(args);
}

/** The 403 text for a locked lesson. Flag off: the exact old wording. */
export function lockedMessage(): string {
  return coursesEnabled()
    ? 'You need this course or the full track to read this. The first lesson of every course is a free trial.'
    : 'You need the full track to read this. The first lesson of every track is a free trial.';
}
