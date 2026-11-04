// Pure(ish) purchase-recording logic for the Stripe webhook, split out so it
// can be tested against a fake Prisma client.

/** Product types that unlock a track's certification exam. `code_review` is a
 * separate service and must never count as exam entitlement. */
export const EXAM_CREDENTIAL_PRODUCTS = ['track_credential', 'program_credential'] as const;

export function isExamCredentialProduct(productType: string): boolean {
  return (EXAM_CREDENTIAL_PRODUCTS as readonly string[]).includes(productType);
}

export function uniqueTrackIds(trackIds: string[]): string[] {
  return [...new Set(trackIds)];
}

interface PurchaseDb {
  credentialPurchase: {
    count(args: unknown): Promise<number>;
    findFirst(args: unknown): Promise<{ stripeSessionId: string; amountCents: number } | null>;
    upsert(args: unknown): Promise<unknown>;
  };
}

/** True when every track in this Stripe session has already been recorded.
 * Keyed on session AND track: a bundle session writes several rows, so one
 * row existing does not mean the whole session was processed. */
export async function sessionFullyRecorded(db: PurchaseDb, sessionId: string, trackIds: string[]): Promise<boolean> {
  const tracks = uniqueTrackIds(trackIds);
  if (tracks.length === 0) return false;
  const recorded = await db.credentialPurchase.count({
    where: { stripeSessionId: sessionId, trackId: { in: tracks } },
  });
  return recorded >= tracks.length;
}

export interface GrantInput {
  userId: string;
  productId: string;
  trackIds: string[];
  bundleId?: string;
  sessionId: string;
  amountTotal: number;
}

/** Record one row per track. Safe to re-run for the same session (webhook
 * retry): existing rows are left untouched. Returns tracks that were already
 * granted by a DIFFERENT session (a duplicate charge needing manual refund). */
export async function recordPurchase(db: PurchaseDb, input: GrantInput): Promise<{ duplicateCharges: string[] }> {
  const tracks = uniqueTrackIds(input.trackIds);
  // Split exactly: per-track amounts must sum to the real charge.
  const base = Math.floor(input.amountTotal / tracks.length);
  const remainder = input.amountTotal - base * tracks.length;
  const duplicateCharges: string[] = [];

  for (const [i, trackId] of tracks.entries()) {
    const perTrackAmount = base + (i < remainder ? 1 : 0);
    const key = { userId_trackId_productType: { userId: input.userId, trackId, productType: input.productId } };
    // Look across both exam products: buying a track as track_credential AND
    // inside a program_credential is a double charge even though the rows
    // don't collide. code_review is a separate service, compared to itself.
    const existing = await db.credentialPurchase.findFirst({
      where: {
        userId: input.userId,
        trackId,
        productType: { in: isExamCredentialProduct(input.productId) ? [...EXAM_CREDENTIAL_PRODUCTS] : [input.productId] },
        stripeSessionId: { not: input.sessionId },
      },
    });
    if (existing) {
      duplicateCharges.push(trackId);
      console.error(
        `[webhooks] DUPLICATE CHARGE detected for user ${input.userId}, track ${trackId}: ` +
          `existing session ${existing.stripeSessionId} (amountCents=${existing.amountCents}) ` +
          `vs new session ${input.sessionId} (amountCents=${perTrackAmount}). Manual refund/review required.`,
      );
    }
    await db.credentialPurchase.upsert({
      where: key,
      create: {
        userId: input.userId,
        trackId,
        productType: input.productId,
        bundleId: input.bundleId,
        stripeSessionId: input.sessionId,
        amountCents: perTrackAmount,
      },
      update: {}, // keep the original record, incl. its session id
    });
  }
  return { duplicateCharges };
}
