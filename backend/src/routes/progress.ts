// @ts-nocheck
import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { entitlementsMiddleware, type EntitledRequest } from '../middleware/entitlements.js';
import { isTrialLesson } from '../lib/access.js';

const router = Router();

// Get user's full progress
router.get('/', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const progress = await prisma.lessonProgress.findMany({
      where: { userId: authReq.userId },
      include: { lesson: { select: { id: true, title: true, moduleId: true, module: true } } },
    });

    const gamification = await prisma.gamification.findUnique({
      where: { userId: authReq.userId },
    });

    res.json({ progress, gamification });
  } catch (err) {
    console.error('Progress error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update lesson progress
router.post('/:lessonId', authMiddleware, entitlementsMiddleware, async (req, res) => {
  try {
    const authReq = req as EntitledRequest;
    const { status, progress: pct } = req.body ?? {};

    if (status !== undefined && status !== 'in-progress' && status !== 'completed') {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    if (pct !== undefined && (!Number.isInteger(pct) || pct < 0 || pct > 100)) {
      res.status(400).json({ error: 'Progress must be a whole number from 0 to 100' });
      return;
    }

    // Same rule as reading the lesson: the trial lesson is open, everything
    // else needs the track. Without this, anyone logged in could mark paid
    // lessons complete (and collect the XP) without having bought them.
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.lessonId },
      include: { module: { include: { domain: true } } },
    });
    if (!lesson || !lesson.isPublished) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }
    const trackId = lesson.module?.domain?.trackId;
    if (trackId && !isTrialLesson(lesson) && !authReq.trackAccess?.includes(trackId)) {
      res.status(403).json({ error: 'Track access required', trackId });
      return;
    }

    // A later "in-progress" ping (e.g. reopening a finished lesson) must not
    // undo a completion.
    const existing = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: authReq.userId!, lessonId: lesson.id } },
    });
    const keepCompleted = existing?.status === 'completed' && status !== 'completed';

    const updated = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId: authReq.userId!, lessonId: lesson.id },
      },
      create: {
        userId: authReq.userId!,
        lessonId: lesson.id,
        status: status ?? 'in-progress',
        progress: pct ?? 0,
        completedAt: status === 'completed' ? new Date() : undefined,
      },
      update: {
        status: keepCompleted ? undefined : status ?? undefined,
        progress: keepCompleted ? undefined : pct ?? undefined,
        completedAt: status === 'completed' && !existing?.completedAt ? new Date() : undefined,
      },
    });

    // Award XP if completed. The read-then-write here (check
    // updated.xpEarned === 0, then write) is a check-then-act race: two
    // concurrent requests can both read xpEarned as 0 before either writes,
    // so both would award XP. Make the award itself atomic by conditioning
    // the update's WHERE clause on xpEarned still being 0 — only the
    // request that actually flips it from 0 (count === 1) proceeds to grant
    // the gamification XP/streak increment.
    if (status === 'completed' && updated.xpEarned === 0) {
      const xp = 100;
      const { count } = await prisma.lessonProgress.updateMany({
        where: { id: updated.id, xpEarned: 0 },
        data: { xpEarned: xp },
      });

      if (count !== 1) {
        res.json({ progress: updated });
        return;
      }

      const gam = await prisma.gamification.upsert({
        where: { userId: authReq.userId },
        create: { userId: authReq.userId, totalXp: xp },
        update: { totalXp: { increment: xp } },
      });

      // Count this as a day learned — cumulative, never reset.
      //
      // This used to be a consecutive-day streak that reset to 1 whenever a day
      // was missed, with the best-ever figure kept alongside it forever. On a
      // platform for people whose conditions routinely take days away from them,
      // that meant the dashboard displayed a permanent monument to the last time
      // someone's body cooperated — and the landing page, the track catalog and
      // the "streak myth" blog post all explicitly promise "no streaks to break".
      // Now a gap of any length costs nothing: the number simply doesn't move on
      // days you're not here.
      if (gam) {
        const today = new Date().toISOString().slice(0, 10);
        const lastActive = gam.lastActiveDate?.toISOString().slice(0, 10);

        if (lastActive !== today) {
          await prisma.gamification.update({
            where: { userId: authReq.userId },
            data: {
              daysLearned: { increment: 1 },
              lastActiveDate: new Date(),
            },
          });
        }
      }
    }

    res.json({ progress: updated });
  } catch (err) {
    console.error('Progress update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
