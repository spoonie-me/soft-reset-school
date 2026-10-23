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

// IMPORTANT: bedcoders.com must be verified in Resend dashboard before switching back.
// Until then, use onboarding@resend.dev (Resend's pre-verified domain) so emails deliver.
// To verify: Resend → Domains → Add bedcoders.com → add DKIM + SPF records to DNS.
const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
const FROM_NAME = process.env.RESEND_FROM_NAME ?? 'Soft Reset School';
const APP_URL = () => process.env.FRONTEND_URL ?? 'https://bedcoders.com';

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
    <span style="color:#00d9ff;font-family:'DM Mono',monospace;font-size:20px;font-weight:500;letter-spacing:-0.02em;">bedcoders</span>
  </div>
  <div style="background:#0f1315;border:1px solid #1a2023;border-radius:8px;padding:32px;">
    ${body}
  </div>
  <div style="margin-top:24px;color:#6b7076;font-size:12px;line-height:1.5;">
    ${footerNote ?? ''}
    <p style="margin-top:16px;">Bedcoders &middot; A coding school for people who learn lying down</p>
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
    subject: 'Verify your Bedcoders account',
    html: emailLayout(`
      <h1 style="color:#ffffff;font-size:22px;margin:0 0 8px;">Welcome to Bedcoders</h1>
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
    subject: 'Reset your Bedcoders password',
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
    subject: 'Welcome to Bedcoders — start coding from wherever you are',
    html: emailLayout(`
      <h1 style="color:#ffffff;font-size:22px;margin:0 0 8px;">${greeting} 👋</h1>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.7;margin:0 0 16px;">
        You just joined a community of coders who learn on their own terms — from bed, from the sofa, at their own pace.
      </p>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Your free tier gives you access to the <strong style="color:#ffffff;">first module of every track</strong>, including lessons, knowledge checks, and sample graded exercises.
      </p>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.7;margin:0 0 24px;">
        Here's what to do first:
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:10px 0;color:#00d9ff;font-size:14px;width:28px;vertical-align:top;font-family:'DM Mono',monospace;">1.</td>
          <td style="padding:10px 0;color:#b3b8bb;font-size:14px;">Start with <strong style="color:#fff;">Code from Bed</strong> — the free first module is waiting for you</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#00d9ff;font-size:14px;width:28px;vertical-align:top;font-family:'DM Mono',monospace;">2.</td>
          <td style="padding:10px 0;color:#b3b8bb;font-size:14px;">Complete your first lesson — it's short and picks up right where you leave off</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#00d9ff;font-size:14px;width:28px;vertical-align:top;font-family:'DM Mono',monospace;">3.</td>
          <td style="padding:10px 0;color:#b3b8bb;font-size:14px;">Explore the free module — when you're ready, unlock the full track to go deeper</td>
        </tr>
      </table>
      ${btn('Go to your dashboard', `${APP_URL()}/dashboard`)}
    `),
  });
}

export async function sendOnboardingDay2(to: string, name?: string) {
  await getResend().emails.send({
    from: `Roi from Bedcoders <${FROM}>`,
    to,
    subject: 'Quick tip: how to get the most from Bedcoders',
    html: emailLayout(`
      <h1 style="color:#ffffff;font-size:22px;margin:0 0 8px;">Getting started${name ? `, ${esc(name)}` : ''}</h1>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Most learners tell us the first lesson felt surprisingly doable. That's by design — each module builds on the last, starting simple before going deeper.
      </p>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.7;margin:0 0 16px;">
        A few things that make Bedcoders different:
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

export async function sendOnboardingDay5(to: string, name?: string) {
  await getResend().emails.send({
    from: `Roi from Bedcoders <${FROM}>`,
    to,
    subject: `${name ? esc(name) + ', y' : 'Y'}ou've explored the free tier — here's what's next`,
    html: emailLayout(`
      <h1 style="color:#ffffff;font-size:22px;margin:0 0 8px;">Ready for more?</h1>
      <p style="color:#b3b8bb;font-size:15px;line-height:1.7;margin:0 0 16px;">
        You've had a few days to explore the first module. If you liked what you saw, the full tracks go much deeper — graded exercises, module assessments, AI feedback on every submission, and certification exams.
      </p>
      <div style="background:#141428;border:1px solid #1a2023;border-radius:8px;padding:20px;margin:0 0 24px;">
        <p style="color:#ffc107;font-size:13px;font-family:'DM Mono',monospace;letter-spacing:0.06em;text-transform:uppercase;margin:0 0 8px;">Pricing</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#fff;font-size:14px;">Pro Monthly</td><td style="padding:6px 0;color:#b3b8bb;font-size:14px;text-align:right;">&euro;12/month</td></tr>
          <tr><td style="padding:6px 0;color:#fff;font-size:14px;">Pro Annual <span style="color:#d4563b;font-size:12px;">(save 17%)</span></td><td style="padding:6px 0;color:#b3b8bb;font-size:14px;text-align:right;">&euro;120/year</td></tr>
          <tr><td style="padding:6px 0;color:#fff;font-size:14px;">For Teams</td><td style="padding:6px 0;color:#b3b8bb;font-size:14px;text-align:right;">from &euro;15/seat/month</td></tr>
        </table>
      </div>
      ${btn('View pricing', `${APP_URL()}/pricing`)}
      <p style="color:#6b7076;font-size:13px;margin-top:16px;">Cancel anytime. All plans unlock all 4 learning tracks.</p>
    `),
  });
}

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
    subject: `Purchase confirmed — welcome to Bedcoders`,
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
        <li>All modules are now unlocked in your purchased tracks</li>
        <li>Complete every module to unlock the certification exam</li>
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
