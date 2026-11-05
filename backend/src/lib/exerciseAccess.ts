// @ts-nocheck
import { prisma } from './db.js';
import { canAccessLesson, hasFullAccess } from './access.js';

/**
 * Can this user see this exercise's answers/explanation?
 * Lesson exercises keep the old rule (first lesson free, rest needs the track).
 * Exercises without a lesson (assessment bank) are never part of a free trial:
 * they need full access to their domain's track, found through the assessment's
 * module or, failing that, Exercise.domainId. No domain found means no access.
 * The exercise must be loaded with lesson.module.domain and assessment.module.domain.
 */
export async function canAccessExercise(
  exercise: any,
  ent: { trackAccess?: string[]; courseAccess?: string[] },
): Promise<boolean> {
  const lesson = exercise.lesson;
  if (lesson) {
    const domain = lesson.module?.domain;
    if (!domain?.trackId) return true; // unchanged legacy behaviour
    return canAccessLesson({
      domain, module: lesson.module, lesson,
      trackAccess: ent.trackAccess, courseAccess: ent.courseAccess,
    });
  }
  let domain = exercise.assessment?.module?.domain ?? null;
  if (!domain && exercise.domainId) {
    domain = await prisma.competencyDomain.findUnique({ where: { id: exercise.domainId } });
  }
  return !!domain && hasFullAccess({ domain, trackAccess: ent.trackAccess, courseAccess: ent.courseAccess });
}
