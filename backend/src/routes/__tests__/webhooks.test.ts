// Route-level tests for POST /webhooks/stripe. The real handler runs with a
// stateful fake Prisma that enforces the schema's unique keys. Stripe, email
// and Discord are mocked, nothing leaves the process.
import { describe, it, expect, vi, beforeEach } from 'vitest';

type Row = { userId: string; trackId: string; productType: string; domainId: string; stripeSessionId: string; amountCents: number; bundleId?: string };

const h = vi.hoisted(() => {
  const state = { rows: [] as any[], event: null as any };
  return { state, sendPurchaseConfirmation: vi.fn(), sendCheckoutReminder: vi.fn(), postWelcomeToTrack: vi.fn() };
});

function matches(r: any, where: any): boolean {
  return Object.entries(where).every(([k, v]: [string, any]) => {
    if (k === 'OR') return v.some((w: any) => matches(r, w));
    if (v && typeof v === 'object') {
      if ('in' in v) return v.in.includes(r[k]);
      if ('not' in v) return r[k] !== v.not;
    }
    return r[k] === v;
  });
}

vi.mock('../../lib/db.js', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(async () => ({ id: 'u1', email: 'a@b.c', name: 'A', marketingOptIn: true })),
      findUnique: vi.fn(async () => ({ id: 'u1', email: 'a@b.c', name: 'A', marketingOptIn: true })),
    },
    competencyDomain: {
      findMany: vi.fn(async ({ where }: any) =>
        [{ id: 'd1', name: 'N1', courseTitle: 'Course One' }, { id: 'd2', name: 'N2', courseTitle: null }].filter((d) => where.id.in.includes(d.id)),
      ),
    },
    credentialPurchase: {
      count: vi.fn(async ({ where }: any) => h.state.rows.filter((r) => matches(r, where)).length),
      findFirst: vi.fn(async ({ where }: any) => h.state.rows.find((r) => matches(r, where)) ?? null),
      upsert: vi.fn(async ({ where, create }: any) => {
        const k = where.userId_trackId_productType_domainId;
        if (!k) throw new Error('bad compound key ' + Object.keys(where));
        if (h.state.rows.some((r) => r.userId === k.userId && r.trackId === k.trackId && r.productType === k.productType && r.domainId === k.domainId)) return;
        if (h.state.rows.some((r) => r.stripeSessionId === create.stripeSessionId && r.trackId === create.trackId && r.domainId === create.domainId)) {
          throw new Error('unique stripeSessionId_trackId_domainId');
        }
        h.state.rows.push({ domainId: '', ...create });
      }),
    },
  },
}));
vi.mock('../../lib/email.js', () => ({ sendPurchaseConfirmation: h.sendPurchaseConfirmation, sendCheckoutReminder: h.sendCheckoutReminder }));
vi.mock('../../lib/discord.js', () => ({ postWelcomeToTrack: h.postWelcomeToTrack }));
vi.mock('../../lib/stripe.js', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
  const actual = await vi.importActual<typeof import('../../lib/stripe.js')>('../../lib/stripe.js');
  return { ...actual, stripe: { webhooks: { constructEvent: () => h.state.event } } };
});

import router from '../webhooks';

async function deliver(session: Record<string, unknown>, type = 'checkout.session.completed') {
  h.state.event = { type, data: { object: { payment_status: 'paid', customer: 'cus_1', ...session } } };
  const layer = (router as any).stack.find((l: any) => l.route?.path === '/stripe');
  const res: any = { statusCode: 200, body: undefined };
  res.status = (c: number) => ((res.statusCode = c), res);
  res.json = (b: unknown) => ((res.body = b), res);
  await layer.route.stack[layer.route.stack.length - 1].handle({ headers: { 'stripe-signature': 's' }, body: Buffer.from('{}') }, res);
  return res;
}

const courseSession = (id: string, ids: string[], tracks: string[], amount: number) => ({
  id,
  amount_total: amount,
  metadata: {
    userId: 'u1',
    productId: 'course',
    kind: 'course',
    courseIds: ids.join(','),
    courseTrackIds: tracks.join(','),
    trackIds: JSON.stringify([...new Set(tracks)]),
    bundleId: ids.length > 1 ? 'b1' : '',
  },
});
const trackSession = (id: string, trackId: string, amount: number) => ({
  id,
  amount_total: amount,
  metadata: { userId: 'u1', productId: 'track_credential', trackIds: JSON.stringify([trackId]), bundleId: '' },
});

beforeEach(() => {
  h.state.rows = [];
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
});

describe('webhook grants', () => {
  it('1 course: one course row, course title in the email, no exam wording', async () => {
    const res = await deliver(courseSession('cs_1', ['d1'], ['t1'], 2900));
    expect(res.statusCode).toBe(200);
    expect(h.state.rows).toEqual([expect.objectContaining({ productType: 'course', domainId: 'd1', trackId: 't1', amountCents: 2900 })]);
    const mail = h.sendPurchaseConfirmation.mock.calls[0][1];
    expect(mail).toMatchObject({ plan: 'Course', tracks: ['Course One'], amount: '€29.00', courses: true });
    expect(h.postWelcomeToTrack).toHaveBeenCalledWith('a@b.c', 't1');
  });

  it('3 courses: three rows, amount split to the charge, one Discord post per track', async () => {
    await deliver(courseSession('cs_3', ['d1', 'd2', 'd3'], ['t1', 't1', 't2'], 6900));
    expect(h.state.rows.map((r: Row) => r.domainId).sort()).toEqual(['d1', 'd2', 'd3']);
    expect(h.state.rows.reduce((n: number, r: Row) => n + r.amountCents, 0)).toBe(6900);
    expect(h.postWelcomeToTrack).toHaveBeenCalledTimes(2);
  });

  it('a whole track: a track row with an empty domainId and the old email', async () => {
    await deliver(trackSession('cs_t', 't1', 9900));
    expect(h.state.rows).toEqual([expect.objectContaining({ productType: 'track_credential', domainId: '', amountCents: 9900 })]);
    expect(h.sendPurchaseConfirmation.mock.calls[0][1]).not.toHaveProperty('courses');
  });

  it('works whether or not the flag is on (a paid session is always honoured)', async () => {
    delete process.env.COURSES_ENABLED;
    await deliver(courseSession('cs_1', ['d1'], ['t1'], 2900));
    expect(h.state.rows).toHaveLength(1);
  });

  it('delivering the same event twice writes nothing the second time and sends no second email', async () => {
    const s = courseSession('cs_3', ['d1', 'd2', 'd3'], ['t1', 't1', 't2'], 6900);
    await deliver(s);
    await deliver(s);
    expect(h.state.rows).toHaveLength(3);
    expect(h.sendPurchaseConfirmation).toHaveBeenCalledTimes(1);
  });

  it('the async_payment_succeeded event is handled the same way', async () => {
    await deliver(courseSession('cs_a', ['d1'], ['t1'], 2900), 'checkout.session.async_payment_succeeded');
    expect(h.state.rows).toHaveLength(1);
  });

  it('an unpaid session grants nothing', async () => {
    await deliver({ ...courseSession('cs_u', ['d1'], ['t1'], 2900), payment_status: 'unpaid' });
    expect(h.state.rows).toHaveLength(0);
  });

  it('two different courses of one track on different days: both granted, no duplicate alert', async () => {
    await deliver(courseSession('cs_day1', ['d1'], ['t1'], 2900));
    await deliver(courseSession('cs_day2', ['d2'], ['t1'], 2900));
    expect(h.state.rows).toHaveLength(2);
    expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining('DUPLICATE CHARGE'));
  });

  it('the same course paid twice: second charge is flagged, original row kept', async () => {
    await deliver(courseSession('cs_day1', ['d1'], ['t1'], 2900));
    await deliver(courseSession('cs_day2', ['d1'], ['t1'], 2900));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('DUPLICATE CHARGE'));
    expect(h.state.rows).toHaveLength(1);
    expect(h.state.rows[0].stripeSessionId).toBe('cs_day1');
  });

  it('a course session with unreadable ids grants nothing', async () => {
    const s = courseSession('cs_bad', ['d1', 'd2'], ['t1'], 2900);
    await deliver(s);
    expect(h.state.rows).toHaveLength(0);
  });

  it('a track session still works exactly as before: duplicate track charge flagged', async () => {
    await deliver(trackSession('cs_t1', 't1', 9900));
    await deliver(trackSession('cs_t2', 't1', 9900));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('DUPLICATE CHARGE'));
    expect(h.state.rows).toHaveLength(1);
  });
});

describe('expired checkout reminder', () => {
  const expired = (trackId: string) => ({ ...trackSession('cs_exp', trackId, 9900), payment_status: 'unpaid' });

  it('a course row of the same track does not cancel the reminder', async () => {
    h.state.rows = [{ userId: 'u1', trackId: 'tA', productType: 'course', domainId: 'd1', stripeSessionId: 's0', amountCents: 2900 }];
    await deliver(expired('tA'), 'checkout.session.expired');
    expect(h.sendCheckoutReminder).toHaveBeenCalledTimes(1);
  });

  it('a track row still cancels it', async () => {
    h.state.rows = [{ userId: 'u1', trackId: 'tA', productType: 'track_credential', domainId: '', stripeSessionId: 's0', amountCents: 9900 }];
    await deliver(expired('tA'), 'checkout.session.expired');
    expect(h.sendCheckoutReminder).not.toHaveBeenCalled();
  });
});
