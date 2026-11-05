import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordPurchase, sessionFullyRecorded, uniqueTrackIds, isExamCredentialProduct, parseCourseItems } from '../credentialGrant';

type Row = {
  userId: string;
  trackId: string;
  productType: string;
  domainId: string;
  bundleId?: string;
  stripeSessionId: string;
  amountCents: number;
};

// Tiny where-matcher for the shapes credentialGrant uses: plain equality,
// { in }, { not } and OR.
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

// In-memory stand-in that enforces the SAME unique indexes as the schema:
//   (stripeSessionId, trackId, domainId) and (userId, trackId, productType, domainId).
// The upsert only accepts the real compound key name, as Prisma would.
function fakeDb(initial: Partial<Row>[] = []) {
  const rows: Row[] = initial.map((r) => ({ domainId: '', ...r }) as Row);
  return {
    rows,
    credentialPurchase: {
      count: async ({ where }: any) => rows.filter((r) => matches(r, where)).length,
      findFirst: async ({ where }: any) => rows.find((r) => matches(r, where)) ?? null,
      upsert: async ({ where, create }: any) => {
        const k = where.userId_trackId_productType_domainId;
        if (!k) throw new Error('Unknown compound key: ' + Object.keys(where).join(','));
        if (rows.some((r) => r.userId === k.userId && r.trackId === k.trackId && r.productType === k.productType && r.domainId === k.domainId)) return; // update: {}
        if (rows.some((r) => r.stripeSessionId === create.stripeSessionId && r.trackId === create.trackId && r.domainId === create.domainId)) {
          throw new Error('Unique constraint failed: stripeSessionId_trackId_domainId');
        }
        rows.push({ domainId: '', ...create });
      },
    },
  };
}

const bundle = {
  userId: 'u1',
  productId: 'program_credential',
  trackIds: ['fundamentals', 'ai', 'tools'],
  bundleId: 'b1',
  sessionId: 'cs_1',
  amountTotal: 14900,
};

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Program Credential bundle', () => {
  it('grants all 3 tracks from one Stripe session (regression: used to grant only 1)', async () => {
    const db = fakeDb();
    await recordPurchase(db, bundle);
    expect(db.rows.map((r) => r.trackId).sort()).toEqual(['ai', 'fundamentals', 'tools']);
    expect(db.rows.reduce((n, r) => n + r.amountCents, 0)).toBe(14900);
  });

  it('is idempotent when the webhook is redelivered', async () => {
    const db = fakeDb();
    await recordPurchase(db, bundle);
    expect(await sessionFullyRecorded(db, 'cs_1', bundle.trackIds)).toBe(true);
    await recordPurchase(db, bundle);
    expect(db.rows).toHaveLength(3);
  });

  it('completes a partially processed session instead of skipping it', async () => {
    const db = fakeDb([
      { userId: 'u1', trackId: 'fundamentals', productType: 'program_credential', stripeSessionId: 'cs_1', amountCents: 4967 },
    ]);
    expect(await sessionFullyRecorded(db, 'cs_1', bundle.trackIds)).toBe(false);
    await recordPurchase(db, bundle);
    expect(db.rows).toHaveLength(3);
  });

  it('flags a second session for an already-granted track as a duplicate charge, keeping the original', async () => {
    const db = fakeDb();
    await recordPurchase(db, { ...bundle, productId: 'track_credential', trackIds: ['ai'], amountTotal: 6900 });
    const res = await recordPurchase(db, { ...bundle, productId: 'track_credential', trackIds: ['ai'], sessionId: 'cs_2', amountTotal: 6900 });
    expect(res.duplicateCharges).toEqual(['ai']);
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0].stripeSessionId).toBe('cs_1');
  });
});

describe('duplicate charge across products', () => {
  it('flags a bundle that re-sells a track already bought as a single credential', async () => {
    const db = fakeDb();
    await recordPurchase(db, { ...bundle, productId: 'track_credential', trackIds: ['ai'], sessionId: 'cs_single', amountTotal: 6900 });
    const res = await recordPurchase(db, bundle);
    expect(res.duplicateCharges).toEqual(['ai']);
  });

  it('does not flag a code_review next to a credential', async () => {
    const db = fakeDb();
    await recordPurchase(db, { ...bundle, productId: 'track_credential', trackIds: ['ai'], sessionId: 'cs_c', amountTotal: 6900 });
    const res = await recordPurchase(db, { ...bundle, productId: 'code_review', trackIds: ['ai'], sessionId: 'cs_r', amountTotal: 2500 });
    expect(res.duplicateCharges).toEqual([]);
  });
});

describe('code_review', () => {
  it('is not an exam credential product', () => {
    expect(isExamCredentialProduct('track_credential')).toBe(true);
    expect(isExamCredentialProduct('program_credential')).toBe(true);
    expect(isExamCredentialProduct('code_review')).toBe(false);
  });

  it('can coexist with a later credential for the same track', async () => {
    const db = fakeDb();
    await recordPurchase(db, { ...bundle, productId: 'code_review', trackIds: ['ai'], sessionId: 'cs_r', amountTotal: 2500 });
    await recordPurchase(db, { ...bundle, productId: 'track_credential', trackIds: ['ai'], sessionId: 'cs_c', amountTotal: 6900 });
    expect(db.rows.map((r) => r.productType).sort()).toEqual(['code_review', 'track_credential']);
  });
});

const course = (domainId: string, trackId = 't1') => ({ domainId, trackId });
const courseCart = (courses: { domainId: string; trackId: string }[], sessionId: string, amountTotal: number) => ({
  userId: 'u1',
  productId: 'course',
  trackIds: [],
  courses,
  bundleId: courses.length > 1 ? 'b-courses' : undefined,
  sessionId,
  amountTotal,
});

describe('course purchases', () => {
  it('grants 1 course for 2900', async () => {
    const db = fakeDb();
    const res = await recordPurchase(db, courseCart([course('d1')], 'cs_c1', 2900));
    expect(res.duplicateCharges).toEqual([]);
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0]).toMatchObject({ productType: 'course', domainId: 'd1', trackId: 't1', amountCents: 2900 });
  });

  it('grants 3 courses (even across tracks) and splits 6900 exactly', async () => {
    const db = fakeDb();
    await recordPurchase(db, courseCart([course('d1'), course('d2'), course('d3', 't2')], 'cs_c3', 6900));
    expect(db.rows.map((r) => r.domainId).sort()).toEqual(['d1', 'd2', 'd3']);
    expect(db.rows.map((r) => r.amountCents)).toEqual([2300, 2300, 2300]);
    // An amount that does not divide evenly still sums to the charge.
    const db2 = fakeDb();
    await recordPurchase(db2, courseCart([course('d1'), course('d2'), course('d3')], 'cs_odd', 6901));
    expect(db2.rows.reduce((n, r) => n + r.amountCents, 0)).toBe(6901);
  });

  it('grants a whole track with a track row (domainId empty)', async () => {
    const db = fakeDb();
    await recordPurchase(db, { ...bundle, productId: 'track_credential', trackIds: ['t1'], sessionId: 'cs_t', amountTotal: 9900 });
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0]).toMatchObject({ productType: 'track_credential', domainId: '', amountCents: 9900 });
  });

  it('is idempotent when the same event is delivered twice', async () => {
    const db = fakeDb();
    const cart = [course('d1'), course('d2'), course('d3')];
    await recordPurchase(db, courseCart(cart, 'cs_c3', 6900));
    expect(await sessionFullyRecorded(db, 'cs_c3', cart)).toBe(true);
    const again = await recordPurchase(db, courseCart(cart, 'cs_c3', 6900));
    expect(again.duplicateCharges).toEqual([]);
    expect(db.rows).toHaveLength(3);
  });

  it('a session with only some courses recorded is not fully recorded, and is completed', async () => {
    const cart = [course('d1'), course('d2')];
    const db = fakeDb([{ userId: 'u1', trackId: 't1', productType: 'course', domainId: 'd1', stripeSessionId: 'cs_x', amountCents: 3450 }]);
    expect(await sessionFullyRecorded(db, 'cs_x', cart)).toBe(false);
    await recordPurchase(db, courseCart(cart, 'cs_x', 6900));
    expect(db.rows).toHaveLength(2);
  });

  it('a second, different course of the same track on another day is not a duplicate', async () => {
    const db = fakeDb();
    await recordPurchase(db, courseCart([course('d1')], 'cs_day1', 2900));
    const res = await recordPurchase(db, courseCart([course('d2')], 'cs_day2', 2900));
    expect(res.duplicateCharges).toEqual([]);
    expect(db.rows).toHaveLength(2);
  });

  it('the same course paid twice in two sessions is flagged and the original is kept', async () => {
    const db = fakeDb();
    await recordPurchase(db, courseCart([course('d1')], 'cs_day1', 2900));
    const res = await recordPurchase(db, courseCart([course('d1')], 'cs_day2', 2900));
    expect(res.duplicateCharges).toEqual(['d1']);
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0].stripeSessionId).toBe('cs_day1');
  });

  it('a course bought after the whole track is flagged (already owned)', async () => {
    const db = fakeDb();
    await recordPurchase(db, { ...bundle, productId: 'track_credential', trackIds: ['t1'], sessionId: 'cs_t', amountTotal: 9900 });
    const res = await recordPurchase(db, courseCart([course('d1')], 'cs_c', 2900));
    expect(res.duplicateCharges).toEqual(['d1']);
  });

  it('a track bought after some courses is not a duplicate', async () => {
    const db = fakeDb();
    await recordPurchase(db, courseCart([course('d1')], 'cs_c', 2900));
    const res = await recordPurchase(db, { ...bundle, productId: 'track_credential', trackIds: ['t1'], sessionId: 'cs_t', amountTotal: 9900 });
    expect(res.duplicateCharges).toEqual([]);
    expect(db.rows).toHaveLength(2);
  });

  it('the same course listed twice in a cart is granted once', async () => {
    const db = fakeDb();
    await recordPurchase(db, courseCart([course('d1'), course('d1')], 'cs_c', 2900));
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0].amountCents).toBe(2900);
  });
});

describe('parseCourseItems', () => {
  it('returns null for a non-course session', () => {
    expect(parseCourseItems({ productId: 'track_credential' })).toBeNull();
    expect(parseCourseItems(undefined)).toBeNull();
  });
  it('reads parallel lists and drops repeats', () => {
    expect(parseCourseItems({ kind: 'course', courseIds: 'a,b,a', courseTrackIds: 't1,t2,t1' })).toEqual([
      { domainId: 'a', trackId: 't1' },
      { domainId: 'b', trackId: 't2' },
    ]);
  });
  it('returns an empty list when unreadable', () => {
    expect(parseCourseItems({ kind: 'course', courseIds: 'a,b', courseTrackIds: 't1' })).toEqual([]);
    expect(parseCourseItems({ kind: 'course' })).toEqual([]);
  });
});

describe('uniqueTrackIds', () => {
  it('collapses duplicates', () => {
    expect(uniqueTrackIds(['ai', 'ai', 'tools'])).toEqual(['ai', 'tools']);
  });
});
