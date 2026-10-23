import { describe, it, expect, vi } from 'vitest';

const findMany = vi.fn();
vi.mock('../../lib/db.js', () => ({
  prisma: {
    track: { findMany: async () => [{ slug: 'ai' }] },
    credentialPurchase: { findMany: (...a: unknown[]) => findMany(...a) },
  },
}));

import { entitlementsMiddleware } from '../entitlements';

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
