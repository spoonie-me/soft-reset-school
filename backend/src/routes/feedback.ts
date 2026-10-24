// @ts-nocheck
import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { getExerciseFeedback } from '../lib/claude.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { entitlementsMiddleware, type EntitledRequest } from '../middleware/entitlements.js';
import { isTrialLesson } from '../lib/access.js';

const router = Router();

// Submit an exercise answer and get AI feedback
router.post('/:exerciseId', authMiddleware, entitlementsMiddleware, async (req, res) => {
  try {
    const authReq = req as EntitledRequest;
    const { answer } = req.body;

    // Only reject genuinely missing answers. `!answer` also rejected the
    // multiple-choice answer `0` (the first option) and the boolean `false`,
    // so picking the first option always 400'd.
    const isMissingAnswer =
      answer === undefined ||
      answer === null ||
      (typeof answer === 'string' && answer.trim() === '') ||
      (Array.isArray(answer) && answer.length === 0);
    if (isMissingAnswer) {
      res.status(400).json({ error: 'Answer is required' });
      return;
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id: req.params.exerciseId },
      include: {
        lesson: {
          include: {
            module: {
              include: { domain: true },
            },
          },
        },
      },
    });

    if (!exercise || !exercise.isActive) {
      res.status(404).json({ error: 'Exercise not found' });
      return;
    }

    // Check track access — the trial lesson is open, everything else needs the track
    const trackId = exercise.lesson?.module?.domain?.trackId;
    if (trackId && !isTrialLesson(exercise.lesson) && !authReq.trackAccess?.includes(trackId)) {
      res.status(403).json({
        error: 'Track access required',
        message: "You need the full track to read this. The first lesson of every track is a free trial.",
      });
      return;
    }

    // Get AI feedback — parse config for expected answer. Real seed data
    // has no correctAnswer/correctIndex field for MULTIPLE_CHOICE — the
    // correct option is options[].correct — so fall back to the text of
    // that option (see sanitizeExercise.ts for the same underlying gap).
    const config = typeof exercise.config === 'string' ? JSON.parse(exercise.config) : exercise.config;
    const correctOptionText = Array.isArray(config?.options)
      ? config.options.find((o: { correct?: boolean }) => o?.correct === true)?.text
      : undefined;
    const expectedAnswer = config?.correctAnswer ?? config?.correctIndex ?? correctOptionText ?? '';
    const result = await getExerciseFeedback(
      exercise.prompt,
      String(expectedAnswer),
      answer,
      exercise.type,
      trackId ?? 'default',
    );

    // Count previous attempts
    const previousAttempts = await prisma.submission.count({
      where: { userId: authReq.userId!, exerciseId: exercise.id },
    });

    // Save submission. When grading failed (API outage, unparseable response)
    // the score and isCorrect are left NULL rather than written as 0 — a
    // transient failure must not permanently record a zero for real work. The
    // learner's answer is still stored so nothing they typed is lost.
    const submission = await prisma.submission.create({
      data: {
        userId: authReq.userId!,
        exerciseId: exercise.id,
        answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
        feedback: result.feedback,
        score: result.graded ? result.score : null,
        isCorrect: result.graded ? result.isCorrect : null,
        attemptNumber: previousAttempts + 1,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: authReq.userId!,
        action: result.graded ? 'exercise_submitted' : 'exercise_submitted_ungraded',
        exerciseId: exercise.id,
        lessonId: exercise.lessonId,
        details: JSON.stringify({
          graded: result.graded,
          score: result.graded ? result.score : null,
          isCorrect: result.graded ? result.isCorrect : null,
        }),
      },
    });

    if (!result.graded) {
      // 503: the answer is saved but not scored. The UI shows this as
      // "couldn't grade — try again" instead of a 0.
      res.status(503).json({
        error: 'Grading unavailable',
        message: result.feedback,
        submission,
      });
      return;
    }

    res.json({ submission });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
