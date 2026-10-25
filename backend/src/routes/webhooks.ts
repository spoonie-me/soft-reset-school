// @ts-nocheck
import { Router } from 'express';
import type { Request, Response } from 'express';
import { stripe, CREDENTIAL_PRODUCTS } from '../lib/stripe.js';
import { prisma } from '../lib/db.js';
import { sendPurchaseConfirmation, sendCheckoutReminder } from '../lib/email.js';
import { postWelcomeToTrack } from '../lib/discord.js';
import { TRACK_NAMES } from '../lib/trackNames.js';

const router = Router();

// Stripe webhook — must use raw body
router.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    res.status(400).json({ error: 'Missing signature or webhook secret' });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      (req as Request & { rawBody?: Buffer }).rawBody ?? req.body,
      sig,
      webhookSecret,
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  try {
    switch (event.type) {
      // One-time Credential purchase — replaces the old subscription
      // activation path (2026-08-04, PRD.md §4.5). Every checkout session
      // here is mode:'payment', not mode:'subscription'.
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object;
        const sessionId = session.id;

        // Delayed payment methods (e.g. SEPA debit) complete the session
        // before the money arrives. Don't unlock anything until it's paid;
        // checkout.session.async_payment_succeeded fires when it is.
        if (session.payment_status === 'unpaid') {
          console.log(`Webhook: session ${sessionId} completed but unpaid, waiting for async payment.`);
          break;
        }

        // Idempotency: skip if we've already recorded this Stripe session
        const alreadyProcessed = await prisma.credentialPurchase.findFirst({
          where: { stripeSessionId: sessionId },
        });
        if (alreadyProcessed) {
          console.log(`Webhook: session ${sessionId} already processed, skipping.`);
          break;
        }

        const customerId = session.customer as string;
        const productId = session.metadata?.productId as keyof typeof CREDENTIAL_PRODUCTS | undefined;
        const trackIds: string[] = session.metadata?.trackIds ? JSON.parse(session.metadata.trackIds) : [];
        const bundleId: string | undefined = session.metadata?.bundleId || undefined;

        if (!productId || trackIds.length === 0) {
          console.warn(`Webhook: checkout.session.completed missing productId/trackIds in metadata, sessionId ${sessionId}`);
          break;
        }

        const metadataUserId = session.metadata?.userId;
        let user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
        if (!user && metadataUserId) {
          user = await prisma.user.findUnique({ where: { id: metadataUserId } });
        }
        if (!user) {
          console.error(`Webhook: user not found for customer ${customerId}, sessionId ${sessionId} — acknowledging to prevent infinite retries`);
          res.json({ received: true, warning: 'User not found' });
          return;
        }

        const amountTotal = session.amount_total ?? 0;
        // Split evenly across tracks in a bundle so per-track amounts sum to
        // the real charge — good enough for reporting, not a refund engine.
        const perTrackAmount = Math.round(amountTotal / trackIds.length);

        for (const trackId of trackIds) {
          const existingPurchase = await prisma.credentialPurchase.findUnique({
            where: { userId_trackId: { userId: user.id, trackId } },
          });

          if (existingPurchase && existingPurchase.stripeSessionId !== sessionId) {
            // A DIFFERENT Stripe session already granted this track — the
            // idempotency check above only catches redelivery of the SAME
            // session, so this means two concurrent checkout sessions for
            // the same user+track both completed and both charged the
            // user. The update branch below would silently overwrite
            // existingPurchase.stripeSessionId, losing all trace of the
            // duplicate charge. Log it clearly (both session ids, both
            // amounts) so it's visible/alertable, then proceed with the
            // upsert so processing doesn't stall.
            console.error(
              `[webhooks] DUPLICATE CHARGE detected for user ${user.id}, track ${trackId}: ` +
              `existing session ${existingPurchase.stripeSessionId} (amountCents=${existingPurchase.amountCents}) ` +
              `vs new session ${sessionId} (amountCents=${perTrackAmount}). Manual refund/review required.`,
            );
          }

          await prisma.credentialPurchase.upsert({
            where: { userId_trackId: { userId: user.id, trackId } },
            create: {
              userId: user.id,
              trackId,
              productType: productId,
              bundleId,
              stripeSessionId: sessionId,
              amountCents: perTrackAmount,
            },
            update: {
              // Re-delivery of the same webhook event (Stripe retries) is a
              // no-op here. A genuine duplicate-session case (different
              // stripeSessionId) is logged above before this runs.
              stripeSessionId: sessionId,
            },
          });
        }
        console.log(`Credential purchase recorded for user ${user.id}: ${productId}, tracks: ${trackIds.join(', ')}`);

        // Send purchase confirmation email (non-blocking)
        try {
          const productLabel = CREDENTIAL_PRODUCTS[productId]?.label ?? productId;
          await sendPurchaseConfirmation(user.email, {
            name: user.name ?? undefined,
            plan: productLabel,
            tracks: trackIds.map((t) => TRACK_NAMES[t] ?? t),
            amount: `€${(amountTotal / 100).toFixed(2)}`,
          });
        } catch (emailErr) {
          console.error('Failed to send purchase confirmation email:', emailErr);
        }

        // Post a welcome embed to each purchased track's Discord channel
        // (non-blocking, no-ops safely if DISCORD_BOT_TOKEN/DISCORD_GUILD_ID
        // aren't set — see backend/src/lib/discord.ts). Content itself is
        // free/ungated now, so this is specifically about the Credential
        // cohort, not lesson access.
        try {
          await Promise.all(
            trackIds.map((trackId) => postWelcomeToTrack(user.email, trackId)),
          );
        } catch (discordErr) {
          console.error('Failed to post Discord welcome message:', discordErr);
        }
        break;
      }

      // A checkout the learner started but never paid (Stripe expires it after
      // 24h). One gentle reminder, only to people who opted in to emails.
      // This endpoint also receives other projects' sessions on the shared
      // Stripe account, so anything without our metadata is ignored.
      case 'checkout.session.expired': {
        const session = event.data.object;
        const productId = session.metadata?.productId;
        const userId = session.metadata?.userId;
        if (session.payment_status === 'paid' || !userId || !productId || !(productId in CREDENTIAL_PRODUCTS)) break;

        let trackIds: string[] = [];
        try {
          trackIds = session.metadata?.trackIds ? JSON.parse(session.metadata.trackIds) : [];
        } catch {
          break;
        }
        if (trackIds.length === 0) break;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.marketingOptIn) break;

        // Bought another way since (hardship code, a later session)? Nothing to remind about.
        const owned = await prisma.credentialPurchase.count({
          where: { userId: user.id, trackId: { in: trackIds } },
        });
        if (owned > 0) break;

        try {
          await sendCheckoutReminder(user.email, {
            name: user.name ?? undefined,
            tracks: trackIds.map((t) => TRACK_NAMES[t] ?? t),
            amount: `€${((session.amount_total ?? 0) / 100).toFixed(2)}`,
          });
        } catch (emailErr) {
          console.error('Failed to send checkout reminder:', emailErr);
        }
        break;
      }

      default:
        // No-op for unhandled events — no more subscription lifecycle
        // events to listen for (customer.subscription.updated/deleted)
        // since there's no recurring subscription anymore.
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    res.status(500).json({ error: 'Webhook processing failed' });
    return;
  }

  res.json({ received: true });
});

export default router;
