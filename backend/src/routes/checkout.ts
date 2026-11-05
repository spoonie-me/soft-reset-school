import { Router } from 'express';
import type { Response } from 'express';
import crypto from 'crypto';
import {
  stripe,
  createCustomer,
  CREDENTIAL_PRODUCTS,
  PROGRAM_PRICES_IN_CENTS,
  CREDENTIAL_SELLABLE_TRACKS,
  COURSE_PRODUCT,
  COURSE_TRACK_PRICE_CENTS,
  courseCartPriceCents,
  checkoutIdempotencyKey,
  bundleIdFromKey,
} from '../lib/stripe.js';
import { prisma } from '../lib/db.js';
import { verifyHardshipCode } from '../lib/hardship-code.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { EXAM_CREDENTIAL_PRODUCTS, COURSE_PRODUCT_TYPE } from '../lib/credentialGrant.js';
import { coursesEnabled } from '../lib/flags.js';

const router = Router();

// ─── Course carts (only while COURSES_ENABLED is "true") ──────────────────
//
// { courseIds: [<domain ids>] } with exactly 1 course (EUR 29) or exactly 3
// distinct courses (EUR 69). A whole track is still { productId:
// 'track_credential', trackId } (EUR 99). Everything else is a 400.

const MAX_ID_LENGTH = 100;

async function createCourseCheckout(authReq: AuthRequest, res: Response, body: Record<string, unknown>) {
  const { productId, trackId, trackIds, courseIds } = body;
  if (productId !== undefined || trackId !== undefined || trackIds !== undefined) {
    res.status(400).json({ error: 'A cart is either courses or one track, not both.' });
    return;
  }
  if (
    !Array.isArray(courseIds) ||
    courseIds.some((c) => typeof c !== 'string' || !c || c.length > MAX_ID_LENGTH)
  ) {
    res.status(400).json({ error: 'courseIds must be a list of course ids.' });
    return;
  }
  // The public site is static, so it sends each course's seed key (for example
  // "ai-orch-dev-foundations"). The database id is accepted too. Everything
  // from here on uses the database id.
  const requested = courseIds as string[];
  if (new Set(requested).size !== requested.length) {
    res.status(400).json({ error: 'Each course can only be listed once.' });
    return;
  }
  const unitAmount = courseCartPriceCents(requested.length);
  if (unitAmount === null) {
    res.status(400).json({ error: 'Buy 1 course, any 3 courses, or a whole track.' });
    return;
  }

  const found = await prisma.competencyDomain.findMany({
    where: { OR: [{ id: { in: requested } }, { seedKey: { in: requested } }] },
    select: { id: true, seedKey: true, trackId: true, name: true, courseTitle: true, courseForSale: true },
  });
  const byKey = new Map<string, (typeof found)[number]>();
  for (const d of found) {
    byKey.set(d.id, d);
    if (d.seedKey) byKey.set(d.seedKey, d);
  }
  const courses = requested.map((key) => byKey.get(key));
  if (courses.some((c) => !c)) {
    res.status(400).json({ error: 'One of these courses does not exist.' });
    return;
  }
  // Sorted by database id so the same cart in any order builds the same session (idempotency key).
  const picked = [...(courses as NonNullable<(typeof courses)[number]>[])].sort((a, b) => (a.id < b.id ? -1 : 1));
  const ids = picked.map((c) => c.id);
  if (new Set(ids).size !== ids.length) {
    res.status(400).json({ error: 'Each course can only be listed once.' });
    return;
  }
  const notForSale = picked.find(
    (c) => !c.courseForSale || !(CREDENTIAL_SELLABLE_TRACKS as readonly string[]).includes(c.trackId),
  );
  if (notForSale) {
    res.status(400).json({ error: `"${notForSale.courseTitle ?? notForSale.name}" is not for sale yet.` });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: authReq.userId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const cartTracks = [...new Set(picked.map((c) => c.trackId))];
  const owned = await prisma.credentialPurchase.findMany({
    where: {
      userId: user.id,
      OR: [
        { productType: COURSE_PRODUCT_TYPE, domainId: { in: ids } },
        { productType: { in: [...EXAM_CREDENTIAL_PRODUCTS] }, trackId: { in: cartTracks } },
      ],
    },
    select: { productType: true, trackId: true, domainId: true },
  });
  if (owned.length > 0) {
    const ownedCourse = picked.find((c) => owned.some((o) => o.domainId === c.id));
    const ownedTrack = owned.find((o) => o.domainId === '');
    res.status(409).json({
      error: ownedCourse
        ? `You already own the course "${ownedCourse.courseTitle ?? ownedCourse.name}".`
        : `You already own the whole track (${ownedTrack?.trackId}), which includes these courses.`,
    });
    return;
  }

  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await createCustomer(user.email, user.name ?? undefined);
    stripeCustomerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } });
  }

  // One open session at a time per course. An open track session that covers
  // one of these tracks also blocks (paying for both would be a double charge).
  const openSessions = await stripe.checkout.sessions.list({ customer: stripeCustomerId, status: 'open', limit: 20 });
  const duplicateSession = openSessions.data.find((s) => {
    if (s.metadata?.kind === 'course') {
      return (s.metadata.courseIds ?? '').split(',').some((c) => ids.includes(c));
    }
    const sTrackIds: string[] = s.metadata?.trackIds ? JSON.parse(s.metadata.trackIds) : [];
    return sTrackIds.some((t) => cartTracks.includes(t));
  });
  if (duplicateSession) {
    res.status(409).json({
      error: 'A checkout session for this course is already in progress.',
      message: 'You already have an active checkout for this. Complete or cancel it before starting a new one.',
      url: duplicateSession.url,
    });
    return;
  }

  const idempotencyKey = checkoutIdempotencyKey(user.id, ids.map((id) => ({ kind: 'course', id })));
  const titles = picked.map((c) => c.courseTitle ?? c.name);
  const appUrl = process.env.APP_URL ?? 'https://softreset.school';
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: picked.length === 1
            ? `Soft Reset School - Course: ${titles[0]}`
            : `Soft Reset School - ${picked.length} courses`,
          description: picked.length === 1 ? COURSE_PRODUCT.description : titles.join(', '),
        },
        unit_amount: unitAmount,
        tax_behavior: 'inclusive',
      },
      quantity: 1,
    }],
    success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&credential=course&courses=${encodeURIComponent(ids.join(','))}`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    allow_promotion_codes: true,
    automatic_tax: { enabled: true },
    customer_update: { address: 'auto', name: 'auto' },
    tax_id_collection: { enabled: true },
    metadata: {
      userId: user.id,
      productId: COURSE_PRODUCT_TYPE,
      kind: 'course',
      courseIds: ids.join(','),
      courseTrackIds: picked.map((c) => c.trackId).join(','),
      trackIds: JSON.stringify(cartTracks),
      bundleId: picked.length > 1 ? bundleIdFromKey(idempotencyKey) : '',
    },
  }, { idempotencyKey });

  res.json({ url: session.url });
}

// ─── Create Checkout Session — one-time Credential purchase ─────────────
//
// Replaces the old subscription checkout (2026-08-04, PRD.md §4.5). Body
// shape depends on productId:
//   { productId: 'track_credential', trackId: 'ai-orchestrated-dev' }
//   { productId: 'program_credential', trackIds: [<2 or 3 track ids>] }

router.post('/session', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { productId, trackId, trackIds } = req.body as {
      productId: keyof typeof CREDENTIAL_PRODUCTS;
      trackId?: string;
      trackIds?: string[];
    };

    // Flag on only. With the flag off courseIds is never read.
    if (coursesEnabled() && req.body?.courseIds != null) {
      await createCourseCheckout(authReq, res, req.body);
      return;
    }

    if (!productId || !(productId in CREDENTIAL_PRODUCTS)) {
      res.status(400).json({ error: 'Invalid product ID.' });
      return;
    }
    if (coursesEnabled() && productId === 'program_credential') {
      res.status(400).json({ error: 'Track bundles are not sold. Buy 1 course, any 3 courses, or a whole track.' });
      return;
    }

    // Validate the track(s) being purchased are actually sellable.
    const requestedTracks: string[] = productId === 'program_credential' ? (trackIds ?? []) : [trackId ?? ''];
    if (requestedTracks.length === 0 || requestedTracks.some((t) => !t)) {
      res.status(400).json({ error: 'trackId (or trackIds for a program bundle) is required.' });
      return;
    }
    if (productId === 'program_credential' && !(requestedTracks.length in PROGRAM_PRICES_IN_CENTS)) {
      res.status(400).json({ error: 'A Program Credential bundles 2 or 3 tracks.' });
      return;
    }
    if (new Set(requestedTracks).size !== requestedTracks.length) {
      res.status(400).json({ error: 'Each track can only be listed once.' });
      return;
    }
    const unitAmount =
      productId === 'program_credential'
        ? PROGRAM_PRICES_IN_CENTS[requestedTracks.length]
        : coursesEnabled()
          ? COURSE_TRACK_PRICE_CENTS
          : CREDENTIAL_PRODUCTS.track_credential.priceInCents;
    const invalidTrack = requestedTracks.find((t) => !(CREDENTIAL_SELLABLE_TRACKS as readonly string[]).includes(t));
    if (invalidTrack) {
      res.status(400).json({ error: `Track "${invalidTrack}" doesn't have a Credential available yet.` });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: authReq.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Refuse to sell a credential the user already owns.
    const alreadyOwned = await prisma.credentialPurchase.findMany({
      // code_review purchases don't count as owning the credential.
      where: { userId: user.id, trackId: { in: requestedTracks }, productType: { in: [...EXAM_CREDENTIAL_PRODUCTS] } },
      select: { trackId: true },
    });
    if (alreadyOwned.length > 0) {
      res.status(400).json({
        error: `You already have a Credential for: ${alreadyOwned.map((c) => c.trackId).join(', ')}.`,
      });
      return;
    }

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await createCustomer(user.email, user.name ?? undefined);
      stripeCustomerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } });
    }

    // Guard against two concurrent Checkout Sessions for the same user +
    // track: if either completes we've charged them once; if both
    // complete, webhooks.ts's idempotency check (keyed only on
    // stripeSessionId) can't catch the second charge since it's a
    // different session id. Block a new session while the user already has
    // an open (unexpired, not yet completed) one covering any of the same
    // tracks.
    const openSessions = await stripe.checkout.sessions.list({
      customer: stripeCustomerId,
      status: 'open',
      limit: 20,
    });
    const duplicateSession = openSessions.data.find((s) => {
      const sTrackIds: string[] = s.metadata?.trackIds ? JSON.parse(s.metadata.trackIds) : [];
      return sTrackIds.some((t) => requestedTracks.includes(t));
    });
    if (duplicateSession) {
      res.status(409).json({
        error: 'A checkout session for this track is already in progress.',
        message: 'You already have an active checkout for this Credential. Complete or cancel it before starting a new one.',
        url: duplicateSession.url,
      });
      return;
    }

    const appUrl = process.env.APP_URL ?? 'https://softreset.school';
    const bundleId = productId === 'program_credential' ? crypto.randomUUID() : '';

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment', // one-time, not subscription
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: productId === 'program_credential'
              ? `Soft Reset School - Program Credential (${requestedTracks.length} tracks)`
              : 'Soft Reset School - Track Credential',
            description: CREDENTIAL_PRODUCTS[productId].description,
          },
          unit_amount: unitAmount,
          tax_behavior: 'inclusive',
        },
        quantity: 1,
      }],
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&credential=${productId}&tracks=${encodeURIComponent(requestedTracks.join(','))}`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
      customer_update: { address: 'auto', name: 'auto' },
      tax_id_collection: { enabled: true },
      metadata: {
        userId: user.id,
        productId,
        trackIds: JSON.stringify(requestedTracks),
        bundleId,
      },
    // Flag on only: collapse two simultaneous identical requests into one session.
    }, coursesEnabled()
      ? { idempotencyKey: checkoutIdempotencyKey(user.id, requestedTracks.map((id) => ({ kind: 'track', id }))) }
      : undefined);

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout session error:', err?.message ?? err);
    const detail = err?.type === 'StripeInvalidRequestError' ? err.message : undefined;
    res.status(500).json({ error: 'Failed to create checkout session', detail });
  }
});

// ─── Get Current Credentials Owned ───────────────────────────────────────

router.get('/credentials', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;

    const purchases = await prisma.credentialPurchase.findMany({
      where: { userId: authReq.userId },
      select: { trackId: true, productType: true, domainId: true, purchasedAt: true },
    });

    res.json({ credentials: purchases });
  } catch (err) {
    console.error('Get credentials error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Hardship codes ──────────────────────────────────────────────────────
//
// The credential stays €99 so it means the same thing to every employer.
// Anyone who can't pay asks hi@softreset.school for a code, no reason
// needed. A code unlocks one track once. See lib/hardship-code.ts.

router.post('/hardship', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { trackId, code } = req.body as { trackId: string; code: string };

    if (!trackId || !(CREDENTIAL_SELLABLE_TRACKS as readonly string[]).includes(trackId)) {
      res.status(400).json({ error: 'Invalid track.' });
      return;
    }
    const nonce = verifyHardshipCode(code);
    if (!nonce) {
      res.status(400).json({ error: "That code isn't valid. Check it for typos, or email hi@softreset.school." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: authReq.userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // One code = one track, once, in total. The unique key is (stripeSessionId,
    // trackId, domainId), so on its own it only stops the same track twice and
    // one code could still unlock every track. So look the code up first, and
    // hold a per-code advisory lock so two simultaneous redemptions of one code
    // run one after the other (the second then sees the first's row).
    const sessionId = `hardship_code_${nonce}`;
    const outcome = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${sessionId}))`;

      const used = await tx.credentialPurchase.findFirst({ where: { stripeSessionId: sessionId } });
      if (used) {
        // A retry by the same user for the same track stays a success.
        return used.userId === user.id && used.trackId === trackId ? 'granted' : 'code_used';
      }

      const existing = await tx.credentialPurchase.findFirst({
        where: { userId: user.id, trackId, productType: { in: [...EXAM_CREDENTIAL_PRODUCTS] } },
      });
      if (existing) return 'has_credential';

      await tx.credentialPurchase.create({
        data: {
          userId: user.id,
          trackId,
          productType: 'track_credential',
          stripeSessionId: sessionId,
          amountCents: 0,
        },
      });
      return 'granted';
    }).catch((err: unknown) => {
      // Backstop: the unique key fired anyway (same code, same track).
      if ((err as { code?: string }).code === 'P2002') return 'code_used';
      throw err;
    });

    if (outcome === 'has_credential') {
      res.status(400).json({ error: 'You already have a Credential for this track.' });
      return;
    }
    if (outcome === 'code_used') {
      res.status(409).json({ error: 'That code has already been used.' });
      return;
    }
    res.json({ granted: true });
  } catch (err) {
    console.error('Hardship code error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
