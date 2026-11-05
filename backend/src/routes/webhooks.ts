// @ts-nocheck
import { Router } from 'express';
import type { Request, Response } from 'express';
import { stripe, CREDENTIAL_PRODUCTS, COURSE_PRODUCT, courseCartPriceCents } from '../lib/stripe.js';
import { prisma } from '../lib/db.js';
import { sendPurchaseConfirmation, sendCheckoutReminder } from '../lib/email.js';
import { postWelcomeToTrack } from '../lib/discord.js';
import { recordPurchase, sessionFullyRecorded, parseCourseItems, COURSE_PRODUCT_TYPE } from '../lib/credentialGrant.js';
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

        const customerId = session.customer as string;
        const productId = session.metadata?.productId as keyof typeof CREDENTIAL_PRODUCTS | undefined;
        const trackIds: string[] = session.metadata?.trackIds ? JSON.parse(session.metadata.trackIds) : [];
        const bundleId: string | undefined = session.metadata?.bundleId || undefined;

        // Course cart (checkout.ts, flag on). Always honoured once paid, even
        // if the flag was switched off after the session was created.
        const courses = parseCourseItems(session.metadata);
        if (courses && courses.length === 0) {
          console.warn(`Webhook: course session ${sessionId} has unreadable courseIds/courseTrackIds, needs manual review`);
          break;
        }

        if (!courses && (!productId || trackIds.length === 0)) {
          console.warn(`Webhook: checkout.session.completed missing productId/trackIds in metadata, sessionId ${sessionId}`);
          break;
        }

        // Idempotency: skip only if EVERY track (or course) of this session is recorded.
        // (A bundle writes several rows; one row existing means a partial run.)
        if (await sessionFullyRecorded(prisma, sessionId, courses ?? trackIds)) {
          console.log(`Webhook: session ${sessionId} already processed, skipping.`);
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

        const amountTotal = courses
          ? (session.amount_total ?? courseCartPriceCents(courses.length) ?? 0)
          : (session.amount_total ?? CREDENTIAL_PRODUCTS[productId]?.priceInCents ?? 0);
        await recordPurchase(prisma, {
          userId: user.id,
          productId: courses ? COURSE_PRODUCT_TYPE : productId,
          trackIds,
          courses: courses ?? undefined,
          bundleId,
          sessionId,
          amountTotal,
        });
        console.log(
          courses
            ? `Course purchase recorded for user ${user.id}: ${courses.map((c) => c.domainId).join(', ')}`
            : `Credential purchase recorded for user ${user.id}: ${productId}, tracks: ${trackIds.join(', ')}`,
        );

        // Send purchase confirmation email (non-blocking)
        try {
          let names = trackIds.map((t) => TRACK_NAMES[t] ?? t);
          if (courses) {
            const rows = await prisma.competencyDomain.findMany({
              where: { id: { in: courses.map((c) => c.domainId) } },
              select: { id: true, name: true, courseTitle: true },
            });
            names = courses.map((c) => {
              const r = rows.find((x) => x.id === c.domainId);
              return r?.courseTitle ?? r?.name ?? c.domainId;
            });
          }
          const productLabel = courses ? COURSE_PRODUCT.label : (CREDENTIAL_PRODUCTS[productId]?.label ?? productId);
          await sendPurchaseConfirmation(user.email, {
            name: user.name ?? undefined,
            plan: productLabel,
            tracks: names,
            amount: `€${(amountTotal / 100).toFixed(2)}`,
            ...(courses ? { courses: true } : {}),
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
            (courses ? [...new Set(courses.map((c) => c.trackId))] : trackIds).map((trackId) => postWelcomeToTrack(user.email, trackId)),
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
          // domainId '' = a track row. A course row must not cancel a track reminder.
          where: { userId: user.id, trackId: { in: trackIds }, domainId: '' },
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
