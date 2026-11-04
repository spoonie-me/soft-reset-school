import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordPurchase, sessionFullyRecorded, uniqueTrackIds, isExamCredentialProduct } from '../credentialGrant';

type Row = { userId: string; trackId: string; productType: string; bundleId?: string; stripeSessionId: string; amountCents: number };

// In-memory stand-in that enforces the SAME unique indexes as the schema:
//   (stripeSessionId, trackId) and (userId, trackId, productType).
function fakeDb(initial: Row[] = []) {
  const rows: Row[] = [...initial];
  const find = (k: { userId: string; trackId: string; productType: string }) =>
    rows.find((r) => r.userId === k.userId && r.trackId === k.trackId && r.productType === k.productType);
  return {
    rows,
    credentialPurchase: {
      count: async ({ where }: any) =>
        rows.filter((r) => r.stripeSessionId === where.stripeSessionId && where.trackId.in.includes(r.trackId)).length,
      findFirst: async ({ where }: any) =>
        rows.find(
          (r) =>
            r.userId === where.userId &&
            r.trackId === where.trackId &&
            where.productType.in.includes(r.productType) &&
            r.stripeSessionId !== where.stripeSessionId.not,
        ) ?? null,
      upsert: async ({ where, create }: any) => {
        if (find(where.userId_trackId_productType)) return; // update: {}
        if (rows.some((r) => r.stripeSessionId === create.stripeSessionId && r.trackId === create.trackId)) {
          throw new Error('Unique constraint failed: stripeSessionId_trackId');
        }
        rows.push(create);
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

describe('uniqueTrackIds', () => {
  it('collapses duplicates', () => {
    expect(uniqueTrackIds(['ai', 'ai', 'tools'])).toEqual(['ai', 'tools']);
  });
});
