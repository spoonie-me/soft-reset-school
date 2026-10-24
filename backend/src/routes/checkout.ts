import { Router } from 'express';
import crypto from 'crypto';
import { stripe, createCustomer, CREDENTIAL_PRODUCTS, PROGRAM_PRICES_IN_CENTS, CREDENTIAL_SELLABLE_TRACKS } from '../lib/stripe.js';
import { prisma } from '../lib/db.js';
import { verifyHardshipCode } from '../lib/hardship-code.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

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

    if (!productId || !(productId in CREDENTIAL_PRODUCTS)) {
      res.status(400).json({ error: 'Invalid product ID.' });
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
      where: { userId: user.id, trackId: { in: requestedTracks } },
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
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&credential=${productId}`,
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
    });

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
      select: { trackId: true, productType: true, purchasedAt: true },
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

    const existing = await prisma.credentialPurchase.findUnique({
      where: { userId_trackId: { userId: user.id, trackId } },
    });
    if (existing) {
      res.status(400).json({ error: 'You already have a Credential for this track.' });
      return;
    }

    try {
      await prisma.credentialPurchase.create({
        data: {
          userId: user.id,
          trackId,
          productType: 'track_credential',
          stripeSessionId: `hardship_code_${nonce}`,
          amountCents: 0,
        },
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        res.status(400).json({ error: 'That code has already been used.' });
        return;
      }
      throw err;
    }
    res.json({ granted: true });
  } catch (err) {
    console.error('Hardship code error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
