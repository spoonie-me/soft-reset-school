// Route-level tests for POST /checkout/session. There is no supertest in the
// repo, so the real route handler is pulled out of the router and called with
// a fake req/res. Prisma and Stripe are mocked, nothing leaves the process.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const h = vi.hoisted(() => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    competencyDomain: { findMany: vi.fn() },
    credentialPurchase: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
  },
  stripe: { checkout: { sessions: { list: vi.fn(), create: vi.fn() } } },
}));

vi.mock('../../lib/db.js', () => ({ prisma: h.prisma }));
vi.mock('../../middleware/auth.js', () => ({ authMiddleware: vi.fn() }));
vi.mock('../../lib/hardship-code.js', () => ({ verifyHardshipCode: vi.fn() }));
vi.mock('../../lib/stripe.js', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
  const actual = await vi.importActual<typeof import('../../lib/stripe.js')>('../../lib/stripe.js');
  return { ...actual, stripe: h.stripe, createCustomer: vi.fn(async () => ({ id: 'cus_new' })) };
});

import router from '../checkout';
import { checkoutIdempotencyKey } from '../../lib/stripe.js';

const T1 = 'ai-orchestrated-dev';
const T2 = 'ai-workflow-consulting';
const dom = (id: string, trackId = T1, courseForSale = true) => ({ id, seedKey: `seed-${id}`, trackId, name: `Name ${id}`, courseTitle: `Title ${id}`, courseForSale });
const ALL = [dom('d1'), dom('d2'), dom('d3', T2), dom('d4'), dom('dNo', T1, false), dom('dOld', 'fundamentals')];

function postSession(body: Record<string, unknown>) {
  const layer = (router as any).stack.find((l: any) => l.route?.path === '/session' && l.route.methods.post);
  const handle = layer.route.stack[layer.route.stack.length - 1].handle;
  const res: any = { statusCode: 200, body: undefined };
  res.status = (c: number) => ((res.statusCode = c), res);
  res.json = (b: unknown) => ((res.body = b), res);
  return handle({ userId: 'u1', body }, res).then(() => res);
}

const created = () => h.stripe.checkout.sessions.create.mock.calls[0][0];

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  h.prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.c', name: 'A', stripeCustomerId: 'cus_1' });
  h.prisma.competencyDomain.findMany.mockImplementation(async ({ where }: any) => ALL.filter((d) => where.OR[0].id.in.includes(d.id) || where.OR[1].seedKey.in.includes((d as any).seedKey)));
  h.prisma.credentialPurchase.findMany.mockResolvedValue([]);
  h.stripe.checkout.sessions.list.mockResolvedValue({ data: [] });
  h.stripe.checkout.sessions.create.mockResolvedValue({ url: 'https://stripe.test/s' });
});
afterEach(() => {
  delete process.env.COURSES_ENABLED;
});

describe('flag on: allowed carts', () => {
  beforeEach(() => {
    process.env.COURSES_ENABLED = 'true';
  });

  it('1 course costs 2900', async () => {
    const res = await postSession({ courseIds: ['d1'] });
    expect(res.statusCode).toBe(200);
    const s = created();
    expect(s.line_items).toHaveLength(1);
    expect(s.line_items[0].price_data.unit_amount).toBe(2900);
    expect(s.mode).toBe('payment');
    expect(s.metadata).toMatchObject({ userId: 'u1', kind: 'course', productId: 'course', courseIds: 'd1', courseTrackIds: T1, bundleId: '' });
    expect(s.success_url).toContain('courses=d1');
  });

  it('3 distinct courses cost 6900, even across tracks, and carry a bundle id', async () => {
    const res = await postSession({ courseIds: ['d1', 'd2', 'd3'] });
    expect(res.statusCode).toBe(200);
    const s = created();
    expect(s.line_items[0].price_data.unit_amount).toBe(6900);
    expect(s.metadata.courseIds).toBe('d1,d2,d3');
    expect(s.metadata.courseTrackIds).toBe(`${T1},${T1},${T2}`);
    expect(s.metadata.bundleId).not.toBe('');
    expect(s.success_url).toContain(encodeURIComponent('d1,d2,d3'));
  });

  it('a whole track costs 9900', async () => {
    const res = await postSession({ productId: 'track_credential', trackId: T1 });
    expect(res.statusCode).toBe(200);
    expect(created().line_items[0].price_data.unit_amount).toBe(9900);
    expect(created().metadata.kind).toBeUndefined();
  });
});

describe('flag on: rejected carts', () => {
  beforeEach(() => {
    process.env.COURSES_ENABLED = 'true';
  });

  it.each([
    ['empty cart', { courseIds: [] }],
    ['2 courses', { courseIds: ['d1', 'd2'] }],
    ['4 courses', { courseIds: ['d1', 'd2', 'd3', 'd4'] }],
    ['the same course twice', { courseIds: ['d1', 'd1', 'd2'] }],
    ['not a list', { courseIds: 'd1' }],
    ['a non-string id', { courseIds: [5] }],
    ['courses mixed with a track', { courseIds: ['d1'], productId: 'track_credential', trackId: T1 }],
    ['a track bundle', { productId: 'program_credential', trackIds: [T1, T2] }],
  ])('%s is a 400', async (_name, body) => {
    const res = await postSession(body as Record<string, unknown>);
    expect(res.statusCode).toBe(400);
    expect(h.stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('an unknown course is a 400', async () => {
    const res = await postSession({ courseIds: ['nope'] });
    expect(res.statusCode).toBe(400);
    expect(h.stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('a course that is not for sale is a 400', async () => {
    const res = await postSession({ courseIds: ['dNo'] });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('not for sale');
  });

  it('a course in a track that cannot be sold is a 400', async () => {
    const res = await postSession({ courseIds: ['dOld'] });
    expect(res.statusCode).toBe(400);
  });

  it('a course the user already owns is a 409', async () => {
    h.prisma.credentialPurchase.findMany.mockResolvedValue([{ productType: 'course', trackId: T1, domainId: 'd1' }]);
    const res = await postSession({ courseIds: ['d1'] });
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toContain('already own the course');
    expect(h.stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('a course whose whole track the user already owns is a 409', async () => {
    h.prisma.credentialPurchase.findMany.mockResolvedValue([{ productType: 'track_credential', trackId: T1, domainId: '' }]);
    const res = await postSession({ courseIds: ['d1'] });
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toContain('whole track');
  });

  it('the ownership query looks at course rows and exam rows only', async () => {
    await postSession({ courseIds: ['d1', 'd2', 'd3'] });
    const where = h.prisma.credentialPurchase.findMany.mock.calls[0][0].where;
    expect(where.OR[0]).toMatchObject({ productType: 'course', domainId: { in: ['d1', 'd2', 'd3'] } });
    expect(where.OR[1].productType.in).not.toContain('code_review');
    expect(where.OR[1].trackId.in.sort()).toEqual([T1, T2].sort());
  });

  it('an open checkout for the same course blocks a new one', async () => {
    h.stripe.checkout.sessions.list.mockResolvedValue({
      data: [{ url: 'https://stripe.test/open', metadata: { kind: 'course', courseIds: 'd1,d2' } }],
    });
    const res = await postSession({ courseIds: ['d2'] });
    expect(res.statusCode).toBe(409);
    expect(res.body.url).toBe('https://stripe.test/open');
  });

  it('an open checkout for a different course does not block', async () => {
    h.stripe.checkout.sessions.list.mockResolvedValue({
      data: [{ url: 'https://stripe.test/open', metadata: { kind: 'course', courseIds: 'd1' } }],
    });
    const res = await postSession({ courseIds: ['d2'] });
    expect(res.statusCode).toBe(200);
  });

  it('an open whole-track checkout blocks a course of that track', async () => {
    h.stripe.checkout.sessions.list.mockResolvedValue({
      data: [{ url: 'u', metadata: { productId: 'track_credential', trackIds: JSON.stringify([T1]) } }],
    });
    const res = await postSession({ courseIds: ['d1'] });
    expect(res.statusCode).toBe(409);
  });
});

describe('flag off: same as before', () => {
  it('ignores courseIds and asks for a product like origin/main', async () => {
    const res = await postSession({ courseIds: ['d1'] });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Invalid product ID.');
    expect(h.prisma.competencyDomain.findMany).not.toHaveBeenCalled();
  });

  it('ignores courseIds next to a valid track and sells the track at 9900', async () => {
    const res = await postSession({ productId: 'track_credential', trackId: T1, courseIds: ['d1'] });
    expect(res.statusCode).toBe(200);
    expect(created().line_items[0].price_data.unit_amount).toBe(9900);
    expect(created().metadata).toEqual({ userId: 'u1', productId: 'track_credential', trackIds: JSON.stringify([T1]), bundleId: '' });
    expect(h.prisma.competencyDomain.findMany).not.toHaveBeenCalled();
  });

  it('still sells track bundles at 14900 and 19900', async () => {
    await postSession({ productId: 'program_credential', trackIds: [T1, T2] });
    expect(created().line_items[0].price_data.unit_amount).toBe(14900);
    vi.clearAllMocks();
    h.prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.c', stripeCustomerId: 'cus_1' });
    h.prisma.credentialPurchase.findMany.mockResolvedValue([]);
    h.stripe.checkout.sessions.list.mockResolvedValue({ data: [] });
    h.stripe.checkout.sessions.create.mockResolvedValue({ url: 'x' });
    await postSession({ productId: 'program_credential', trackIds: [T1, T2, 'accessibility-qa-lived-experience'] });
    expect(created().line_items[0].price_data.unit_amount).toBe(19900);
  });
});

describe('idempotency key', () => {
  const opts = () => h.stripe.checkout.sessions.create.mock.calls[0][1];

  it('flag on: a course cart sends a key built from user and cart, same in any order', async () => {
    process.env.COURSES_ENABLED = 'true';
    await postSession({ courseIds: ['d2', 'd1', 'd3'] });
    const first = opts().idempotencyKey;
    const firstMeta = created().metadata;
    expect(first).toMatch(/^checkout_u1_[0-9a-f]{24}_\d+$/);
    vi.clearAllMocks();
    h.prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.c', stripeCustomerId: 'cus_1' });
    h.prisma.competencyDomain.findMany.mockImplementation(async ({ where }: any) => ALL.filter((d) => where.OR[0].id.in.includes(d.id) || where.OR[1].seedKey.in.includes((d as any).seedKey)));
    h.prisma.credentialPurchase.findMany.mockResolvedValue([]);
    h.stripe.checkout.sessions.list.mockResolvedValue({ data: [] });
    h.stripe.checkout.sessions.create.mockResolvedValue({ url: 'x' });
    await postSession({ courseIds: ['d3', 'd1', 'd2'] });
    expect(opts().idempotencyKey).toBe(first);
    // Same key must mean same parameters, or Stripe rejects the second request.
    expect(created().metadata).toEqual(firstMeta);
  });

  it('different carts or users give different keys; the minute bucket changes the key', () => {
    const now = 1_800_000_000_000;
    const a = checkoutIdempotencyKey('u1', [{ kind: 'course', id: 'd1' }], now);
    expect(checkoutIdempotencyKey('u1', [{ kind: 'course', id: 'd2' }], now)).not.toBe(a);
    expect(checkoutIdempotencyKey('u2', [{ kind: 'course', id: 'd1' }], now)).not.toBe(a);
    expect(checkoutIdempotencyKey('u1', [{ kind: 'track', id: 'd1' }], now)).not.toBe(a);
    expect(checkoutIdempotencyKey('u1', [{ kind: 'course', id: 'd1' }], now + 30_000)).toBe(
      checkoutIdempotencyKey('u1', [{ kind: 'course', id: 'd1' }], now + 1000),
    );
    expect(checkoutIdempotencyKey('u1', [{ kind: 'course', id: 'd1' }], now + 61_000)).not.toBe(a);
  });

  it('flag on: a track purchase sends a key too', async () => {
    process.env.COURSES_ENABLED = 'true';
    await postSession({ productId: 'track_credential', trackId: T1 });
    expect(opts().idempotencyKey).toMatch(/^checkout_u1_/);
  });

  it('flag off: no key and no options, exactly like main', async () => {
    await postSession({ productId: 'track_credential', trackId: T1 });
    expect(opts()).toBeUndefined();
  });
});

describe('flag on: seed keys from the static site', () => {
  it('accepts seed keys, charges for the database ids and puts database ids in the success URL', async () => {
    process.env.COURSES_ENABLED = 'true';
    const res = await postSession({ courseIds: ['seed-d2', 'seed-d1', 'seed-d3'] });
    expect(res.statusCode).toBe(200);
    expect(created().metadata.courseIds).toBe('d1,d2,d3');
    expect(created().success_url).toContain(encodeURIComponent('d1,d2,d3'));
    expect(created().line_items[0].price_data.unit_amount).toBe(6900);
  });

  it('the same course by seed key and by database id is a duplicate', async () => {
    process.env.COURSES_ENABLED = 'true';
    const res = await postSession({ courseIds: ['seed-d1', 'd1', 'd2'] });
    expect(res.statusCode).toBe(400);
  });
});
