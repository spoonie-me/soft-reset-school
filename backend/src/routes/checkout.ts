import { Router } from 'express';
import crypto from 'crypto';
import { stripe, createCustomer, CREDENTIAL_PRODUCTS, PROGRAM_PRICES_IN_CENTS, CREDENTIAL_SELLABLE_TRACKS } from '../lib/stripe.js';
import { prisma } from '../lib/db.js';
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

// ─── Pay-what-you-can hardship path ──────────────────────────────────────
//
// PRD.md §4.5: "pay-what-you-can down to €0, no proof required, no
// application." The €0 case grants the Credential purchase record
// directly, no Stripe session. Any amount > €0 goes through a real Stripe
// Checkout session at that custom amount via price_data (Stripe's fixed
// Price objects don't support "any amount").

router.post('/hardship', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { trackId, amountCents } = req.body as { trackId: string; amountCents: number };

    if (!trackId || !(CREDENTIAL_SELLABLE_TRACKS as readonly string[]).includes(trackId)) {
      res.status(400).json({ error: 'Invalid track.' });
      return;
    }
    if (typeof amountCents !== 'number' || amountCents < 0 || amountCents > CREDENTIAL_PRODUCTS.track_credential.priceInCents) {
      res.status(400).json({ error: 'Invalid amount.' });
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

    if (amountCents === 0) {
      // No payment to process — grant directly. stripeSessionId must stay
      // unique, so synthesize one that's clearly not a real Stripe id.
      await prisma.credentialPurchase.create({
        data: {
          userId: user.id,
          trackId,
          productType: 'track_credential',
          stripeSessionId: `hardship_${user.id}_${trackId}_${Date.now()}`,
          amountCents: 0,
        },
      });
      res.json({ granted: true });
      return;
    }

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await createCustomer(user.email, user.name ?? undefined);
      stripeCustomerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } });
    }

    const appUrl = process.env.APP_URL ?? 'https://softreset.school';

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: `Soft Reset School - Track Credential (pay-what-you-can) - ${trackId}` },
          unit_amount: amountCents,
          // Stripe owns tax_behavior on fixed Prices, but price_data is set
          // per-session — this is the one place the code can (and must) say
          // the €-amount already includes VAT, same as the standard price.
          tax_behavior: 'inclusive',
        },
        quantity: 1,
      }],
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&credential=track_credential`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      automatic_tax: { enabled: true },
      customer_update: { address: 'auto', name: 'auto' },
      tax_id_collection: { enabled: true },
      metadata: {
        userId: user.id,
        productId: 'track_credential',
        trackIds: JSON.stringify([trackId]),
        bundleId: '',
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Hardship checkout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
