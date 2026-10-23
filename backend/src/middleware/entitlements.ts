// @ts-nocheck
import type { Response, NextFunction } from 'express';
import { prisma } from '../lib/db.js';
import type { AuthRequest } from './auth.js';
import { EXAM_CREDENTIAL_PRODUCTS } from '../lib/credentialGrant.js';

// ──────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────

export interface EntitledRequest extends AuthRequest {
  /** Track IDs the current user can access lesson/exercise CONTENT for.
   * As of the 2026-08-04 pricing model (PRD.md §4.5), all lesson content
   * is free to read for every logged-in user — this is intentionally
   * populated with every known track slug, not gated by any purchase.
   * Kept as a list (not a bare `true`) so downstream `.includes(trackId)`
   * checks in lessons/exercises/feedback/assessments routes keep working
   * unmodified. */
  trackAccess: string[];
  /** Track IDs the current user has paid a one-time Credential fee for —
   * this is the ONLY thing gated by payment now. Used by exams.ts to gate
   * certification-exam access and certificate issuance. */
  credentialAccess: string[];
}

// ──────────────────────────────────────────
// GENERAL ENTITLEMENTS MIDDLEWARE
// ──────────────────────────────────────────

/**
 * Sets `req.trackAccess` (all tracks, content is free — see PRD.md §4.5)
 * and `req.credentialAccess` (tracks this user has paid a one-time
 * Credential fee for, from CredentialPurchase — gates exams/certificates).
 *
 * Must be mounted after `authMiddleware`.
 */
export async function entitlementsMiddleware(
  req: EntitledRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.userId;

    const allTracks = await prisma.track.findMany({ select: { slug: true } });
    req.trackAccess = allTracks.map((t) => t.slug);

    if (!userId) {
      req.credentialAccess = [];
      next();
      return;
    }

    const purchases = await prisma.credentialPurchase.findMany({
      // Only exam credentials unlock exams — a code_review purchase must not.
      where: { userId, productType: { in: [...EXAM_CREDENTIAL_PRODUCTS] } },
      select: { trackId: true },
    });
    req.credentialAccess = purchases.map((p) => p.trackId);
    next();
  } catch (error) {
    console.error('Entitlements middleware error:', error);
    // Fail closed rather than crashing the request
    req.trackAccess = [];
    req.credentialAccess = [];
    next();
  }
}

// ──────────────────────────────────────────
// PER-TRACK GATE
// ──────────────────────────────────────────

/**
 * Returns middleware that blocks access unless the user has the given
 * track unlocked, **or** the requested content is in the first module
 * of that track (free tier preview).
 *
 * Usage:
 * ```ts
 * router.get('/tracks/:trackId/lessons/:lessonId',
 *   authMiddleware,
 *   entitlementsMiddleware,
 *   requireTrackAccess('params.trackId'),  // reads trackId from req.params
 *   handler,
 * );
 * ```
 *
 * Pass a literal track ID string or `'params.<name>'` to read it from
 * `req.params` at runtime.
 */
export function requireTrackAccess(trackIdOrParam: string) {
  return async (req: EntitledRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Resolve track ID — either literal or from route params
      const trackId = trackIdOrParam.startsWith('params.')
        ? req.params[trackIdOrParam.slice(7)]
        : trackIdOrParam;

      if (!trackId) {
        res.status(400).json({ error: 'Track ID is required' });
        return;
      }

      // Full paid access — allow through
      if (req.trackAccess?.includes(trackId)) {
        next();
        return;
      }

      // Free tier: allow access to the first module of any track.
      // Check if the requested lesson/module belongs to order=1 within its domain.
      const moduleId = req.params.moduleId;
      const lessonId = req.params.lessonId ?? req.params.id;

      if (lessonId) {
        const lesson = await prisma.lesson.findUnique({
          where: { id: lessonId },
          include: {
            module: {
              include: { domain: true },
            },
          },
        });

        if (lesson?.module?.domain?.trackId === trackId && lesson.module.order === 1) {
          next();
          return;
        }
      } else if (moduleId) {
        const mod = await prisma.module.findUnique({
          where: { id: moduleId },
          include: { domain: true },
        });

        if (mod?.domain?.trackId === trackId && mod.order === 1) {
          next();
          return;
        }
      }

      res.status(403).json({
        error: 'Track access required',
        message: 'Upgrade your plan to access this content.',
        trackId,
      });
    } catch (error) {
      console.error('requireTrackAccess error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
