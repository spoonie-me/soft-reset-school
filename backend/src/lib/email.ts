import { Resend } from 'resend';

// ─── Resend Client ─────────────────────────────────────────────────────────
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set — emails will be logged only');
    }
    _resend = new Resend(process.env.RESEND_API_KEY || 'dummy');
  }
  return _resend;
}

// softreset.school must be verified in the Resend dashboard (Domains -> add
// softreset.school -> add the DKIM + SPF records to DNS). Until it is, set
// RESEND_FROM_EMAIL=onboarding@resend.dev, which only delivers to the Resend
// account owner.
const FROM = process.env.RESEND_FROM_EMAIL ?? 'hi@softreset.school';
const FROM_NAME = process.env.RESEND_FROM_NAME ?? 'Soft Reset School';
const APP_URL = () => process.env.FRONTEND_URL ?? 'https://softreset.school';

// ─── HTML escape helper — prevents stored XSS when user data is in email HTML ──
function esc(str: string | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ─── Shared email template ───────────────────────────────────────────────
function emailLayout(body: string, footerNote?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0e0f;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;">
  <div style="margin-bottom:24px;">
    <span style="color:#00d9ff;font-family:'DM Mono',monospace;font-size:20px;font-weight:500;letter-spacing:-0.02em;">soft reset school</span>
  </div>
  <div style="background:#0f1315;border:1px solid #1a2023;border-radius:8px;padding:32px;">
    ${body}
  </div>
  <div style="margin-top:24px;color:#6b7076;font-size:12px;line-height:1.5;">
    ${footerNote ?? ''}
    <p style="margin-top:16px;">Soft Reset School &middot; Learn at the pace your body allows</p>
    <p><a href="${APP_URL()}/privacy" style="color:#6b7076;">Privacy</a> &middot; <a href="${APP_URL()}/terms" style="color:#6b7076;">Terms</a></p>
  </div>
</div>
</body>
</html>`;
}

function btn(text: string, url: string, color = '#00d9ff'): string {
  return `<a href="${url}" style="display:inline-block;padding:14px 28px;background:${color};color:#0a0e0f;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin:8px 0;">${text}</a>`;
}

// ─── Transactional Emails ─────────────────────────────────────────────────

export async function sendVerificationEmail(to: string, token: string) {
  const verifyUrl = `${APP_URL()}/verify?token=${token}`;
  await getResend().emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to,
    subject: 'Verify your Soft Reset School account',
    html: emailLayout(`
      <h1 style="color:#ffffff;font-size:22px;margin:0 0 8px;">Welcome to Soft Reset School</h1>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.6;margin:0 0 24px;">Click below to verify your email address and start learning:</p>
      ${btn('Verify email', verifyUrl)}
      <p style="color:#6b7076;font-size:13px;margin-top:24px;">If you didn't create this account, ignore this email.</p>
    `),
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${APP_URL()}/reset-password?token=${token}`;
  await getResend().emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to,
    subject: 'Reset your Soft Reset School password',
    html: emailLayout(`
      <h1 style="color:#ffffff;font-size:22px;margin:0 0 8px;">Password reset</h1>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.6;margin:0 0 24px;">Click below to reset your password. This link expires in 1 hour.</p>
      ${btn('Reset password', resetUrl)}
      <p style="color:#6b7076;font-size:13px;margin-top:24px;">If you didn't request this, your account is safe — just ignore this email.</p>
    `),
  });
}

// ─── Welcome / Onboarding Sequence ──────────────────────────────────────

export async function sendWelcomeEmail(to: string, name?: string) {
  const greeting = name ? `Hi ${esc(name)}` : 'Welcome';
  await getResend().emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to,
    subject: 'Welcome to Soft Reset School — start coding from wherever you are',
    html: emailLayout(`
      <h1 style="color:#ffffff;font-size:22px;margin:0 0 8px;">${greeting} 👋</h1>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.7;margin:0 0 16px;">
        You just joined a community of coders who learn on their own terms — from bed, from the sofa, at their own pace.
      </p>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Lesson 1 of every track is yours to try for free. A full track is <strong style="color:#ffffff;">€99 once</strong>: every lesson, the exam and the certificate, with no subscription.
      </p>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Here's what to do first:
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:10px 0;color:#00d9ff;font-size:14px;width:28px;vertical-align:top;font-family:'DM Mono',monospace;">1.</td>
          <td style="padding:10px 0;color:#b3b8bb;font-size:14px;">Start with <strong style="color:#fff;">Code from Bed</strong> — the free first lesson is waiting for you</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#00d9ff;font-size:14px;width:28px;vertical-align:top;font-family:'DM Mono',monospace;">2.</td>
          <td style="padding:10px 0;color:#b3b8bb;font-size:14px;">Complete your first lesson — it's short and picks up right where you leave off</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#00d9ff;font-size:14px;width:28px;vertical-align:top;font-family:'DM Mono',monospace;">3.</td>
          <td style="padding:10px 0;color:#b3b8bb;font-size:14px;">Take your time with it — when you're ready, unlock the full track to go deeper</td>
        </tr>
      </table>
      ${btn('Go to your dashboard', `${APP_URL()}/dashboard`)}
    `),
  });
}

export async function sendOnboardingDay2(to: string, name?: string) {
  await getResend().emails.send({
    from: `Roi from Soft Reset School <${FROM}>`,
    to,
    subject: 'Quick tip: how to get the most from Soft Reset School',
    html: emailLayout(`
      <h1 style="color:#ffffff;font-size:22px;margin:0 0 8px;">Getting started${name ? `, ${esc(name)}` : ''}</h1>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Most learners tell us the first lesson felt surprisingly doable. That's by design — each module builds on the last, starting simple before going deeper.
      </p>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.7;margin:0 0 16px;">
        A few things that make Soft Reset School different:
      </p>
      <ul style="color:#b3b8bb;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 24px;">
        <li><strong style="color:#fff;">AI feedback</strong> — every exercise gets personalised feedback, not just "correct/incorrect"</li>
        <li><strong style="color:#fff;">10 exercise types</strong> — from coding challenges to matching, drag-to-order to case studies</li>
        <li><strong style="color:#fff;">Real certificates</strong> — pass the final exam and get a verifiable PDF certificate</li>
        <li><strong style="color:#fff;">Your pace</strong> — no deadlines, no expiry. Learn from bed if you need to</li>
      </ul>
      ${btn('Continue learning', `${APP_URL()}/dashboard`)}
    `),
  });
}

// REMOVED 2026-10-25: sendOnboardingDay5. It was never sent, and it advertised
// Pro Monthly / Pro Annual / per-seat plans and "cancel anytime", none of which
// exist any more (a track is a one-time €99 purchase). If a follow-up to the
// free lesson is wanted, write it fresh against the current pricing.

// ─── Retention / Re-engagement ──────────────────────────────────────────
//
// REMOVED 2026-08-05: sendStreakReminder ("You're on a N-day streak! Don't
// break it.") and sendInactivityEmail ("It's been N days since you logged
// in"). Neither was ever wired up, but both contradicted an explicit,
// repeated product promise — the landing page says "No streaks to break. No
// 'you missed 3 days' emails", the track catalog repeats it, and a blog post
// titled "The streak myth" says the platform tracks XP, not streaks.
//
// For a learner with ME/CFS, an email on day three of a crash saying "don't
// break it" arrives at the exact moment they are least able to act and most
// likely to feel shame about it. Do not reintroduce either of these, or any
// nudge whose trigger is the learner's absence. If re-engagement email is
// wanted later, trigger it on something the learner did, never on a gap.


// ─── Purchase / Payment ─────────────────────────────────────────────────

export async function sendPurchaseConfirmation(to: string, data: {
  name?: string;
  plan: string;
  tracks: string[];
  amount: string;
}) {
  const trackList = data.tracks.map(t => `<li style="padding:4px 0;color:#b3b8bb;font-size:14px;"><span style="color:#1fca7a;">&#10003;</span> ${t}</li>`).join('');
  await getResend().emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to,
    subject: `Purchase confirmed — welcome to Soft Reset School`,
    html: emailLayout(`
      <h1 style="color:#ffffff;font-size:22px;margin:0 0 8px;">You're in! 🎉</h1>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.7;margin:0 0 16px;">
        ${data.name ? `Thanks ${esc(data.name)}! ` : ''}Your purchase is confirmed. Here's what you now have access to:
      </p>
      <div style="background:#141428;border:1px solid #1a2023;border-radius:8px;padding:20px;margin:0 0 24px;">
        <p style="color:#00d9ff;font-size:13px;font-family:'DM Mono',monospace;margin:0 0 12px;">${data.plan.toUpperCase()} &middot; ${data.amount}</p>
        <ul style="list-style:none;padding:0;margin:0;">${trackList}</ul>
      </div>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.7;margin:0 0 8px;">What's next:</p>
      <ul style="color:#b3b8bb;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 24px;">
        <li>Every lesson in your purchased tracks is now unlocked</li>
        <li>The certification exam is open whenever you feel ready, with no deadline</li>
        <li>Pass the exam to earn your verifiable certificate</li>
      </ul>
      ${btn('Start learning', `${APP_URL()}/dashboard`)}
      <p style="color:#6b7076;font-size:13px;margin-top:16px;">Need a receipt? Check your Stripe email or visit your <a href="${APP_URL()}/dashboard" style="color:#00d9ff;">dashboard</a>.</p>
    `),
  });
}

export async function sendCertificateEarned(to: string, data: {
  name?: string;
  trackName: string;
  score: number;
  verifyCode: string;
}) {
  const verifyUrl = `${APP_URL()}/verify/${data.verifyCode}`;
  await getResend().emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to,
    subject: `🏆 Certificate earned: ${data.trackName}`,
    html: emailLayout(`
      <h1 style="color:#ffffff;font-size:22px;margin:0 0 8px;">Congratulations${data.name ? `, ${esc(data.name)}` : ''}! 🏆</h1>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.7;margin:0 0 16px;">
        You passed the <strong style="color:#fff;">${esc(data.trackName)}</strong> certification exam with a score of <strong style="color:#ffc107;">${data.score}%</strong>.
      </p>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Your certificate is ready to download. It includes a unique verification code that anyone can use to confirm your achievement.
      </p>
      <div style="background:#141428;border:1px solid #1a2023;border-radius:8px;padding:20px;margin:0 0 24px;text-align:center;">
        <p style="color:#6b7076;font-size:12px;font-family:'DM Mono',monospace;margin:0 0 8px;">VERIFICATION CODE</p>
        <p style="color:#ffc107;font-size:18px;font-family:'DM Mono',monospace;letter-spacing:0.1em;margin:0;">${esc(data.verifyCode)}</p>
        <p style="margin:12px 0 0;"><a href="${verifyUrl}" style="color:#00d9ff;font-size:13px;">Verify online</a></p>
      </div>
      ${btn('Download certificate', `${APP_URL()}/dashboard`)}
      <p style="color:#6b7076;font-size:13px;margin-top:16px;">Share your achievement on LinkedIn or add it to your CV. The verification link never expires.</p>
    `),
  });
}

/**
 * One gentle note after a checkout session expires unpaid. Triggered by something
 * the learner did (they started a checkout), never by absence, and only sent to
 * people who opted in to emails when they signed up. Nothing was charged.
 */
export async function sendCheckoutReminder(to: string, data: {
  name?: string;
  tracks: string[];
  amount: string;
}) {
  const trackList = data.tracks.map(t => `<li style="padding:4px 0;color:#b3b8bb;font-size:14px;">${esc(t)}</li>`).join('');
  await getResend().emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to,
    subject: `Your track is still here whenever you're ready`,
    headers: { 'List-Unsubscribe': `<mailto:${FROM}?subject=stop>` },
    html: emailLayout(`
      <h1 style="color:#ffffff;font-size:22px;margin:0 0 8px;">No rush${data.name ? `, ${esc(data.name)}` : ''}</h1>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.7;margin:0 0 16px;">
        You started checking out earlier and didn't finish. That's completely fine, and nothing was charged.
      </p>
      <div style="background:#141428;border:1px solid #1a2023;border-radius:8px;padding:20px;margin:0 0 24px;">
        <ul style="list-style:none;padding:0;margin:0 0 8px;">${trackList}</ul>
        <p style="color:#6b7076;font-size:13px;margin:0;">${esc(data.amount)} once &middot; every lesson, the exam and the certificate &middot; no subscription</p>
      </div>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.7;margin:0 0 16px;">
        If it's the right moment, it's here. If not, the first lesson of every track stays free.
      </p>
      ${btn('See the track', `${APP_URL()}/pricing`)}
      <p style="color:#b3b8bb;font-size:14px;line-height:1.7;margin:16px 0 0;">
        If the price is the problem, reply to this email for a hardship code. No reason needed.
      </p>
    `, `<p>This is the one reminder you get for that checkout. You're receiving it because you opted in to emails when you signed up. Reply "stop" and I'll turn them off.</p>`),
  });
}
