// @ts-nocheck
import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { entitlementsMiddleware, type EntitledRequest } from '../middleware/entitlements.js';
import { sanitizeExerciseConfig } from '../lib/sanitizeExercise.js';
import { isTrialLesson } from '../lib/access.js';

const router = Router();

// List all published lessons (grouped by module)
router.get('/', async (_req, res) => {
  try {
    const lessons = await prisma.lesson.findMany({
      where: { isPublished: true },
      orderBy: [{ moduleId: 'asc' }, { order: 'asc' }],
      select: {
        id: true, moduleId: true, title: true,
        description: true, duration: true, difficulty: true, order: true,
      },
    });

    res.json({ lessons });
  } catch (err) {
    console.error('Lessons list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single lesson with exercises (gated by track access)
router.get('/:id', authMiddleware, entitlementsMiddleware, async (req, res) => {
  try {
    const entReq = req as EntitledRequest;

    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: {
        exercises: { orderBy: { order: 'asc' } },
        module: { include: { domain: true } },
      },
    });

    if (!lesson || !lesson.isPublished) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }

    // Check track access — the trial lesson is open, everything else needs the track
    const trackId = lesson.module?.domain?.trackId;
    if (trackId && !isTrialLesson(lesson) && !entReq.trackAccess?.includes(trackId)) {
      res.status(403).json({
        error: 'Track access required',
        message: "You need the full track to read this. The first lesson of every track is a free trial.",
        trackId,
      });
      return;
    }

    // Find adjacent lessons in the same module
    const [prevLesson, nextLesson] = await Promise.all([
      prisma.lesson.findFirst({
        where: { moduleId: lesson.moduleId, isPublished: true, order: { lt: lesson.order } },
        orderBy: { order: 'desc' },
        select: { id: true },
      }),
      prisma.lesson.findFirst({
        where: { moduleId: lesson.moduleId, isPublished: true, order: { gt: lesson.order } },
        orderBy: { order: 'asc' },
        select: { id: true },
      }),
    ]);

    // Parse JSON string fields for SQLite
    const parsedLesson = {
      ...lesson,
      learningObjectives: safeParseJson(lesson.learningObjectives),
      contentSections: safeParseJson(lesson.contentSections),
      exercises: lesson.exercises.map((ex) => ({
        ...ex,
        config: sanitizeExerciseConfig(safeParseJson(ex.config) as Record<string, unknown>),
        hints: safeParseJson(ex.hints),
        tags: safeParseJson(ex.tags),
      })),
      prevLessonId: prevLesson?.id ?? null,
      nextLessonId: nextLesson?.id ?? null,
      // Only the trial lesson is open without the track, and it is always lesson 1, so any next lesson is locked for non-owners.
      nextLessonLocked: !!nextLesson && !!trackId && !entReq.trackAccess?.includes(trackId),
      trackId: trackId ?? null,
      trackTitle: lesson.module?.domain?.trackId ?? null,
      domainTitle: lesson.module?.domain?.name ?? null,
    };

    // Get user progress
    const authReq = req as AuthRequest;
    const progress = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: authReq.userId!, lessonId: lesson.id } },
    });

    res.json({ lesson: parsedLesson, progress });
  } catch (err) {
    console.error('Lesson get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function safeParseJson(val: unknown): unknown {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

export default router;
