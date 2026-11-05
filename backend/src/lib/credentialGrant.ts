// Pure(ish) purchase-recording logic for the Stripe webhook, split out so it
// can be tested against a fake Prisma client.

import type { Prisma } from '@prisma/client';

/** Product types that unlock a track's certification exam. `code_review` is a
 * separate service and must never count as exam entitlement. */
export const EXAM_CREDENTIAL_PRODUCTS = ['track_credential', 'program_credential'] as const;

export function isExamCredentialProduct(productType: string): boolean {
  return (EXAM_CREDENTIAL_PRODUCTS as readonly string[]).includes(productType);
}

export function uniqueTrackIds(trackIds: string[]): string[] {
  return [...new Set(trackIds)];
}

/** Product type stored on a course purchase row. */
export const COURSE_PRODUCT_TYPE = 'course';

/** One thing a Stripe session grants. domainId is '' for a track, the domain id for a course. */
export interface GrantItem {
  trackId: string;
  domainId: string;
}

export interface CourseRef {
  domainId: string;
  trackId: string;
}

/** Read the course cart out of Stripe session metadata (courseIds and
 * courseTrackIds are parallel comma lists). Returns null when the session is
 * not a course cart, and an empty list when it is one but unreadable. */
export function parseCourseItems(metadata: Record<string, string> | null | undefined): CourseRef[] | null {
  if (metadata?.kind !== 'course') return null;
  const ids = (metadata.courseIds ?? '').split(',').filter(Boolean);
  const tracks = (metadata.courseTrackIds ?? '').split(',').filter(Boolean);
  if (ids.length === 0 || ids.length !== tracks.length) return [];
  const seen = new Set<string>();
  const out: CourseRef[] = [];
  ids.forEach((domainId, i) => {
    if (seen.has(domainId)) return;
    seen.add(domainId);
    out.push({ domainId, trackId: tracks[i] });
  });
  return out;
}

interface PurchaseDb {
  credentialPurchase: {
    count(args: Prisma.CredentialPurchaseCountArgs): Promise<number>;
    findFirst(args: Prisma.CredentialPurchaseFindFirstArgs): Promise<{ stripeSessionId: string; amountCents: number } | null>;
    upsert(args: Prisma.CredentialPurchaseUpsertArgs): Promise<unknown>;
  };
}

/** True when every item in this Stripe session has already been recorded.
 * Keyed on session, track AND domain: a bundle session writes several rows,
 * so one row existing does not mean the whole session was processed. Plain
 * track ids are accepted for track sessions. */
export async function sessionFullyRecorded(
  db: PurchaseDb,
  sessionId: string,
  items: string[] | GrantItem[],
): Promise<boolean> {
  const isCourse = items.length > 0 && typeof items[0] !== 'string';
  if (!isCourse) {
    const tracks = uniqueTrackIds(items as string[]);
    if (tracks.length === 0) return false;
    const recorded = await db.credentialPurchase.count({
      where: { stripeSessionId: sessionId, trackId: { in: tracks } },
    });
    return recorded >= tracks.length;
  }
  const wanted = uniqueItems(items as GrantItem[]);
  const recorded = await db.credentialPurchase.count({
    where: {
      stripeSessionId: sessionId,
      OR: wanted.map((i) => ({ trackId: i.trackId, domainId: i.domainId })),
    },
  });
  return recorded >= wanted.length;
}

function uniqueItems(items: GrantItem[]): GrantItem[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = `${i.trackId}\u0000${i.domainId}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export interface GrantInput {
  userId: string;
  productId: string;
  trackIds: string[];
  /** Set for a course cart. Then trackIds is ignored and productId is 'course'. */
  courses?: CourseRef[];
  bundleId?: string;
  sessionId: string;
  amountTotal: number;
}

/** Record one row per track (or per course). Safe to re-run for the same
 * session (webhook retry): existing rows are left untouched. Returns the
 * track ids (course carts: the domain ids) that were already granted by a
 * DIFFERENT session (a duplicate charge needing manual refund). */
export async function recordPurchase(db: PurchaseDb, input: GrantInput): Promise<{ duplicateCharges: string[] }> {
  const items: GrantItem[] = input.courses
    ? uniqueItems(input.courses.map((c) => ({ trackId: c.trackId, domainId: c.domainId })))
    : uniqueTrackIds(input.trackIds).map((trackId) => ({ trackId, domainId: '' }));
  // Split exactly: per-item amounts must sum to the real charge.
  const base = Math.floor(input.amountTotal / items.length);
  const remainder = input.amountTotal - base * items.length;
  const duplicateCharges: string[] = [];

  for (const [i, item] of items.entries()) {
    const { trackId, domainId } = item;
    const perItemAmount = base + (i < remainder ? 1 : 0);
    const label = domainId ? `course ${domainId} (track ${trackId})` : `track ${trackId}`;
    // Look across both exam products: buying a track as track_credential AND
    // inside a program_credential is a double charge even though the rows
    // don't collide. code_review is a separate service, compared to itself.
    // A course is a duplicate when the same course exists, or when the whole
    // track is already owned. A different course of the same track is not.
    const examProducts = [...EXAM_CREDENTIAL_PRODUCTS];
    const existing = await db.credentialPurchase.findFirst({
      where: domainId
        ? {
            userId: input.userId,
            stripeSessionId: { not: input.sessionId },
            OR: [
              { productType: COURSE_PRODUCT_TYPE, domainId },
              { trackId, productType: { in: examProducts } },
            ],
          }
        : {
            userId: input.userId,
            trackId,
            productType: { in: isExamCredentialProduct(input.productId) ? examProducts : [input.productId] },
            stripeSessionId: { not: input.sessionId },
          },
    });
    if (existing) {
      duplicateCharges.push(domainId || trackId);
      console.error(
        `[webhooks] DUPLICATE CHARGE detected for user ${input.userId}, ${label}: ` +
          `existing session ${existing.stripeSessionId} (amountCents=${existing.amountCents}) ` +
          `vs new session ${input.sessionId} (amountCents=${perItemAmount}). Manual refund/review required.`,
      );
    }
    await db.credentialPurchase.upsert({
      where: {
        userId_trackId_productType_domainId: { userId: input.userId, trackId, productType: input.productId, domainId },
      },
      create: {
        userId: input.userId,
        trackId,
        domainId,
        productType: input.productId,
        bundleId: input.bundleId,
        stripeSessionId: input.sessionId,
        amountCents: perItemAmount,
      },
      update: {}, // keep the original record, incl. its session id
    });
  }
  return { duplicateCharges };
}
