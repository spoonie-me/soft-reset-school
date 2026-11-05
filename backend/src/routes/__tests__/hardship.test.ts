// POST /checkout/hardship: one code unlocks one track once, in total.
// Stateful fake Prisma that enforces the schema's unique key
// (stripeSessionId, trackId, domainId). Nothing leaves the process.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => {
  const state = { rows: [] as any[], user: 'u1', gate: null as null | Promise<void> };
  return { state, verify: vi.fn() };
});

const matches = (r: any, where: any) =>
  Object.entries(where).every(([k, v]: [string, any]) => (v && typeof v === 'object' && 'in' in v ? v.in.includes(r[k]) : r[k] === v));

vi.mock('../../lib/db.js', () => {
  const cp = {
    findFirst: vi.fn(async ({ where }: any) => h.state.rows.find((r) => matches(r, where)) ?? null),
    create: vi.fn(async ({ data }: any) => {
      if (h.state.rows.some((r) => r.stripeSessionId === data.stripeSessionId && r.trackId === data.trackId)) {
        throw Object.assign(new Error('unique'), { code: 'P2002' });
      }
      h.state.rows.push({ domainId: '', ...data });
    }),
  };
  // Serialises transactions that take the same advisory lock, like Postgres does.
  let chain: Promise<unknown> = Promise.resolve();
  const prisma: any = {
    user: { findUnique: vi.fn(async () => ({ id: h.state.user })) },
    credentialPurchase: cp,
    $executeRaw: vi.fn(async () => 0),
    $transaction: vi.fn((fn: any) => {
      const run = chain.then(() => fn(prisma));
      chain = run.catch(() => {});
      return run;
    }),
  };
  return { prisma };
});
vi.mock('../../middleware/auth.js', () => ({ authMiddleware: vi.fn() }));
vi.mock('../../lib/hardship-code.js', () => ({ verifyHardshipCode: h.verify }));
vi.mock('../../lib/stripe.js', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
  const actual = await vi.importActual<typeof import('../../lib/stripe.js')>('../../lib/stripe.js');
  return { ...actual, stripe: {}, createCustomer: vi.fn() };
});

import router from '../checkout';
import { CREDENTIAL_SELLABLE_TRACKS } from '../../lib/stripe.js';

const [T1, T2] = CREDENTIAL_SELLABLE_TRACKS as readonly string[];

function redeem(userId: string, trackId: string, code = 'c') {
  const layer = (router as any).stack.find((l: any) => l.route?.path === '/hardship' && l.route.methods.post);
  const handle = layer.route.stack[layer.route.stack.length - 1].handle;
  const res: any = { statusCode: 200, body: undefined };
  res.status = (c: number) => ((res.statusCode = c), res);
  res.json = (b: unknown) => ((res.body = b), res);
  h.state.user = userId;
  return handle({ userId, body: { trackId, code } }, res).then(() => res);
}

beforeEach(() => {
  h.state.rows = [];
  h.verify.mockReturnValue('nonce1');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('hardship code redemption', () => {
  it('grants one track on first use', async () => {
    const res = await redeem('u1', T1);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ granted: true });
    expect(h.state.rows).toHaveLength(1);
  });

  it('the same code cannot unlock a second track for the same user', async () => {
    await redeem('u1', T1);
    const res = await redeem('u1', T2);
    expect(res.statusCode).toBe(409);
    expect(h.state.rows).toHaveLength(1);
  });

  it('the same code cannot be used by another user', async () => {
    await redeem('u1', T1);
    const res = await redeem('u2', T1);
    expect(res.statusCode).toBe(409);
    expect(h.state.rows).toHaveLength(1);
  });

  it('a retry by the same user for the same track is idempotent', async () => {
    await redeem('u1', T1);
    const res = await redeem('u1', T1);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ granted: true });
    expect(h.state.rows).toHaveLength(1);
  });

  it('two simultaneous redemptions of one code for different tracks: only one wins', async () => {
    const [a, b] = await Promise.all([redeem('u1', T1), redeem('u2', T2)]);
    expect([a.statusCode, b.statusCode].sort()).toEqual([200, 409]);
    expect(h.state.rows).toHaveLength(1);
  });

  it('a different code still works for a track the user does not own', async () => {
    await redeem('u1', T1);
    h.verify.mockReturnValue('nonce2');
    expect((await redeem('u1', T2)).statusCode).toBe(200);
    expect(h.state.rows).toHaveLength(2);
  });
});
