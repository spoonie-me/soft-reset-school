// Access gates for assessment-bank exercises (no lesson) and for the
// assessment attempt route. Real handlers, fake Prisma, nothing leaves the process.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const h = vi.hoisted(() => ({
  prisma: {
    exercise: { findUnique: vi.fn() },
    competencyDomain: { findUnique: vi.fn() },
    gamification: { upsert: vi.fn(async () => ({ totalXp: 0, level: 1 })), update: vi.fn(), findUnique: vi.fn(async () => null) },
    activityLog: { create: vi.fn() },
    submission: { count: vi.fn(async () => 0), create: vi.fn(async () => ({ id: 's1' })) },
    moduleAssessment: { findUnique: vi.fn() },
    assessmentAttempt: { create: vi.fn(async () => ({ id: 'a1', completedAt: new Date() })) },
  },
  feedback: vi.fn(async () => ({ score: 100, isCorrect: true, feedback: 'ok', graded: true })),
}));

vi.mock('../../lib/db.js', () => ({ prisma: h.prisma }));
vi.mock('../../middleware/auth.js', () => ({ authMiddleware: vi.fn() }));
vi.mock('../../middleware/entitlements.js', () => ({ entitlementsMiddleware: vi.fn() }));
vi.mock('../../lib/claude.js', () => ({ getExerciseFeedback: h.feedback }));

import exercisesRouter from '../exercises';
import feedbackRouter from '../feedback';
import assessmentsRouter from '../assessments';

function call(router: any, path: string, req: Record<string, unknown>) {
  const layer = router.stack.find((l: any) => l.route?.path === path && l.route.methods.post);
  const handle = layer.route.stack[layer.route.stack.length - 1].handle;
  const res: any = { statusCode: 200, body: undefined };
  res.status = (c: number) => ((res.statusCode = c), res);
  res.json = (b: unknown) => ((res.body = b), res);
  return handle({ userId: 'u1', ...req }, res).then(() => res);
}

const domain = { id: 'd1', trackId: 'tA', order: 1, courseForSale: true };
const bankExercise = {
  id: 'e1', isActive: true, type: 'MULTIPLE_CHOICE', prompt: 'p', explanation: 'why', difficulty: 'easy',
  bloomLevel: 'apply', order: 1, xpReward: 10, lessonId: null, lesson: null, domainId: 'd1',
  config: JSON.stringify({ options: [{ text: 'a', correct: true }, { text: 'b' }], correctIndex: 0 }),
  assessment: { module: { order: 1, domain } },
};
const body = { answer: 0 };
const noAccess = { trackAccess: [], courseAccess: [] };
const withAccess = { trackAccess: ['tA'], courseAccess: [] };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  h.prisma.exercise.findUnique.mockResolvedValue(bankExercise);
  h.prisma.competencyDomain.findUnique.mockResolvedValue(domain);
});
afterEach(() => {
  delete process.env.COURSES_ENABLED;
});

describe.each([
  ['exercises submit', exercisesRouter, '/:exerciseId/submit'],
  ['feedback', feedbackRouter, '/:exerciseId'],
])('%s: assessment-bank exercise without a lesson', (_n, router, path) => {
  it('403 for a user without the track, and no grading happens', async () => {
    const res = await call(router, path, { params: { exerciseId: 'e1' }, body, ...noAccess });
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Track access required');
    expect(h.feedback).not.toHaveBeenCalled();
    expect(h.prisma.submission.create).not.toHaveBeenCalled();
  });

  it('the first-lesson trial rule does not open it (order 1/1/1 and course for sale)', async () => {
    process.env.COURSES_ENABLED = 'true';
    const res = await call(router, path, { params: { exerciseId: 'e1' }, body, ...noAccess });
    expect(res.statusCode).toBe(403);
  });

  it('403 when only the domain id is known and the user lacks the track', async () => {
    h.prisma.exercise.findUnique.mockResolvedValue({ ...bankExercise, assessment: null });
    const res = await call(router, path, { params: { exerciseId: 'e1' }, body, ...noAccess });
    expect(res.statusCode).toBe(403);
  });

  it('a user with the track gets through', async () => {
    const res = await call(router, path, { params: { exerciseId: 'e1' }, body, ...withAccess });
    expect(res.statusCode).not.toBe(403);
    expect(res.statusCode).toBeLessThan(400);
  });

  it('a user who bought the course gets through when courses are on', async () => {
    process.env.COURSES_ENABLED = 'true';
    const res = await call(router, path, { params: { exerciseId: 'e1' }, body, trackAccess: [], courseAccess: ['d1'] });
    expect(res.statusCode).toBeLessThan(400);
  });
});

describe('assessment attempt access', () => {
  const assessment = {
    id: 'as1', questionCount: 1, passScore: 70, module: { domainId: 'd1', domain },
    exercises: [{ id: 'e1', type: 'MULTIPLE_CHOICE', config: bankExercise.config }],
  };
  beforeEach(() => h.prisma.moduleAssessment.findUnique.mockResolvedValue(assessment));
  const attempt = (ent: object) =>
    call(assessmentsRouter, '/:assessmentId/attempt', { params: { assessmentId: 'as1' }, body: { answers: [{ exerciseId: 'e1', answer: 0 }] }, ...ent });

  it('403 without the track, with the same shape as the GET route, and nothing is saved', async () => {
    const res = await attempt(noAccess);
    expect(res.statusCode).toBe(403);
    expect(res.body).toMatchObject({ error: 'Track access required', trackId: 'tA' });
    expect(h.prisma.assessmentAttempt.create).not.toHaveBeenCalled();
  });

  it('with the track the attempt is recorded as before', async () => {
    h.prisma.assessmentAttempt.create.mockResolvedValue({ id: 'a1', completedAt: new Date() });
    const res = await attempt(withAccess).catch((e: unknown) => e as any);
    expect(h.prisma.assessmentAttempt.create).toHaveBeenCalled();
    expect(res.statusCode).not.toBe(403);
  });

  it('flag on: owning only the course is enough', async () => {
    process.env.COURSES_ENABLED = 'true';
    await attempt({ trackAccess: [], courseAccess: ['d1'] }).catch(() => {});
    expect(h.prisma.assessmentAttempt.create).toHaveBeenCalled();
  });

  it('flag off: owning only the course is not enough', async () => {
    const res = await attempt({ trackAccess: [], courseAccess: ['d1'] });
    expect(res.statusCode).toBe(403);
  });
});
