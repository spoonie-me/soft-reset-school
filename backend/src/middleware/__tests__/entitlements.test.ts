import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const findMany = vi.fn();
vi.mock('../../lib/db.js', () => ({
  prisma: {
    user: { findUnique: async () => ({ createdAt: new Date() }) },
    track: { findMany: async () => [{ slug: 'ai' }] },
    credentialPurchase: { findMany: (...a: unknown[]) => findMany(...a) },
  },
}));

vi.mock('../../lib/stripe.js', () => ({ CREDENTIAL_SELLABLE_TRACKS: [] }));

import { entitlementsMiddleware } from '../entitlements';

beforeEach(() => {
  findMany.mockReset();
});
afterEach(() => {
  delete process.env.COURSES_ENABLED;
});

describe('entitlementsMiddleware credentialAccess', () => {
  it('queries only exam-credential products, so code_review never unlocks an exam', async () => {
    findMany.mockResolvedValue([{ trackId: 'ai' }]);
    const req: any = { userId: 'u1' };
    const next = vi.fn();
    await entitlementsMiddleware(req, {} as any, next);

    const where = findMany.mock.calls[0][0].where;
    expect(where.userId).toBe('u1');
    expect(where.productType.in).toEqual(['track_credential', 'program_credential']);
    expect(where.productType.in).not.toContain('code_review');
    expect(req.credentialAccess).toEqual(['ai']);
    expect(next).toHaveBeenCalled();
  });
});

describe('entitlementsMiddleware courseAccess', () => {
  it('flag off: no course query, courseAccess empty, track access unchanged', async () => {
    findMany.mockResolvedValue([{ trackId: 'ai' }]);
    const req: any = { userId: 'u1' };
    await entitlementsMiddleware(req, {} as any, vi.fn());

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(req.courseAccess).toEqual([]);
    expect(req.trackAccess).toEqual(['ai']);
    expect(req.credentialAccess).toEqual(['ai']);
  });

  it('flag on: loads course purchases into courseAccess, never into credentialAccess or trackAccess', async () => {
    process.env.COURSES_ENABLED = 'true';
    findMany
      .mockResolvedValueOnce([]) // exam credentials
      .mockResolvedValueOnce([{ domainId: 'd1' }, { domainId: 'd2' }, { domainId: 'd1' }]); // courses
    const req: any = { userId: 'u1' };
    await entitlementsMiddleware(req, {} as any, vi.fn());

    expect(findMany).toHaveBeenCalledTimes(2);
    const where = findMany.mock.calls[1][0].where;
    expect(where).toMatchObject({ userId: 'u1', productType: 'course', domainId: { not: '' } });
    expect(req.courseAccess).toEqual(['d1', 'd2']);
    expect(req.credentialAccess).toEqual([]);
    expect(req.trackAccess).toEqual(['ai']);
  });

  it('flag on: the exam query still excludes course purchases', async () => {
    process.env.COURSES_ENABLED = 'true';
    findMany.mockResolvedValue([]);
    await entitlementsMiddleware({ userId: 'u1' } as any, {} as any, vi.fn());
    expect(findMany.mock.calls[0][0].where.productType.in).not.toContain('course');
  });

  it('signed out: all lists empty', async () => {
    const req: any = {};
    await entitlementsMiddleware(req, {} as any, vi.fn());
    expect(req.trackAccess).toEqual([]);
    expect(req.courseAccess).toEqual([]);
  });

  it('fails closed on error, courseAccess empty', async () => {
    findMany.mockImplementation(async () => {
      throw new Error('db down');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const req: any = { userId: 'u1' };
    await entitlementsMiddleware(req, {} as any, vi.fn());
    expect(req.trackAccess).toEqual([]);
    expect(req.courseAccess).toEqual([]);
  });
});
