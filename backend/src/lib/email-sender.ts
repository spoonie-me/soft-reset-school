import { Resend } from 'resend';
import { prisma } from './db.js';
import { getSequence } from './email-sequences.js';

// A missing key must not crash the whole API at import time (the Resend client throws
// on construction); sends will simply fail and be logged. Same approach as lib/email.ts.
const resend = new Resend(process.env.RESEND_API_KEY || 'dummy');

export async function sendSequenceEmail(subscriberId: string) {
  const subscriber = await prisma.emailSubscriber.findUnique({
    where: { id: subscriberId },
  });

  if (!subscriber || subscriber.status !== 'active' || !subscriber.sequenceId) return;

  const sequence = getSequence(subscriber.sequenceId);
  if (!sequence) return;

  const step = sequence.steps.find(s => s.step === subscriber.sequenceStep);
  if (!step) {
    // Sequence complete — clear nextSendAt
    await prisma.emailSubscriber.update({
      where: { id: subscriberId },
      data: { nextSendAt: null },
    });
    return;
  }

  const html = step.html.replace(/\{\{EMAIL\}\}/g, encodeURIComponent(subscriber.email));

  const { data, error } = await resend.emails.send({
    from: `${sequence.fromName} <${sequence.fromEmail}>`,
    to: subscriber.email,
    subject: step.subject,
    html,
  });

  if (error) {
    console.error(`Failed to send email to ${subscriber.email}:`, error);
    return;
  }

  // Log the send
  await prisma.emailSent.create({
    data: {
      subscriberId,
      sequenceId: subscriber.sequenceId,
      stepNumber: subscriber.sequenceStep,
      subject: step.subject,
      resendId: data?.id,
    },
  });

  // Advance to next step
  const nextStep = sequence.steps.find(s => s.step === subscriber.sequenceStep + 1);
  const nextSendAt = nextStep
    ? new Date(Date.now() + nextStep.delayDays * 24 * 60 * 60 * 1000)
    : null;

  await prisma.emailSubscriber.update({
    where: { id: subscriberId },
    data: {
      sequenceStep: subscriber.sequenceStep + 1,
      nextSendAt,
    },
  });

  console.log(`✅ Sent "${step.subject}" to ${subscriber.email} (step ${subscriber.sequenceStep})`);
}

export async function processEmailQueue() {
  const due = await prisma.emailSubscriber.findMany({
    where: {
      status: 'active',
      sequenceId: { not: null },
      nextSendAt: { lte: new Date() },
    },
    take: 50, // process max 50 per run to avoid Resend rate limits
  });

  console.log(`Processing ${due.length} queued emails...`);

  for (const subscriber of due) {
    await sendSequenceEmail(subscriber.id);
    // Small delay between sends
    await new Promise(r => setTimeout(r, 200));
  }

  return due.length;
}

export async function addSubscriber(
  email: string,
  sequenceId: string,
  options: { name?: string; source?: string; tags?: string[] } = {}
) {
  const sequence = getSequence(sequenceId);
  if (!sequence) throw new Error(`Unknown sequence: ${sequenceId}`);

  const firstStep = sequence.steps[0];
  const nextStep = sequence.steps[1];

  // Upsert — if they already exist, just update their sequence
  const subscriber = await prisma.emailSubscriber.upsert({
    where: { email },
    update: {
      sequenceId,
      sequenceStep: 0,
      status: 'active',
      nextSendAt: new Date(), // send immediately
    },
    create: {
      email,
      name: options.name,
      source: options.source ?? 'general',
      sequenceId,
      sequenceStep: 0,
      status: 'active',
      nextSendAt: new Date(), // send immediately
      tags: JSON.stringify(options.tags ?? []),
    },
  });

  return subscriber;
}
