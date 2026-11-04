// @ts-nocheck
import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import type { Request, Response, NextFunction } from 'express';
import { entitlementsMiddleware, type EntitledRequest } from '../middleware/entitlements.js';
import { isTrialLesson } from '../lib/access.js';

const router = Router();

/** Optional auth — sets userId if token present, but does not reject. */
function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }
  authMiddleware(req, res, () => {
    next();
  });
}

// Get module with its lessons and user progress
router.get('/:moduleId', optionalAuth, entitlementsMiddleware, async (req, res) => {
  try {
    const authReq = req as EntitledRequest;

    const mod = await prisma.module.findUnique({
      where: { id: req.params.moduleId },
      include: {
        domain: true,
        lessons: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            difficulty: true,
            order: true,
          },
        },
        assessment: {
          select: { id: true, title: true, description: true, passScore: true, questionCount: true },
        },
      },
    });

    if (!mod || !mod.isPublished) {
      res.status(404).json({ error: 'Module not found' });
      return;
    }

    // Get user progress per lesson if authenticated
    let lessonProgress: Record<string, { status: string; completedAt: string | null }> = {};
    if (authReq.userId) {
      const progress = await prisma.lessonProgress.findMany({
        where: {
          userId: authReq.userId,
          lesson: { moduleId: mod.id },
        },
      });
      for (const p of progress) {
        lessonProgress[p.lessonId] = {
          status: p.status,
          completedAt: p.completedAt?.toISOString() ?? null,
        };
      }
    }

    res.json({
      module: {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        tier: mod.tier,
        bloomLevel: mod.bloomLevel,
        order: mod.order,
        domain: mod.domain ? {
          id: mod.domain.id,
          name: mod.domain.name,
          trackId: mod.domain.trackId,
        } : null,
        lessons: mod.lessons.map((l) => ({
          ...l,
          progress: lessonProgress[l.id] ?? null,
          // Same rule as GET /lessons/:id, so the list never promises a lesson the page will refuse.
          locked:
            !!mod.domain &&
            !isTrialLesson({ order: l.order, module: { order: mod.order, domain: { order: mod.domain.order } } }) &&
            !authReq.trackAccess?.includes(mod.domain.trackId),
        })),
        assessment: mod.assessment,
      },
    });
  } catch (err) {
    console.error('Module get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
