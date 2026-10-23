import { Router } from 'express';
import { Resend } from 'resend';
import { prisma } from '../lib/db.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = Router();

const INQUIRY_INBOX = 'hi@softreset.school';

// POST /api/inquiries — employer / team / organisation inquiry.
//
// Replaces the old mailto: form submission, which silently did nothing for
// anyone without a configured desktop mail client (i.e. most people) and
// lost the lead. The inquiry is stored first (AuditLog, same no-migration
// pattern as /api/story), then emailed to the inbox — so even if Resend
// fails, the lead survives in the database.
router.post('/', apiLimiter, async (req, res) => {
  try {
    const { name, org, email, interest, message, source } = req.body as Record<string, string>;

    if (!name || !org || !email || !interest) {
      res.status(400).json({ error: 'Missing required fields: name, org, email, interest' });
      return;
    }
    if (String(email).length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    const clip = (v: unknown, n: number) => String(v ?? '').slice(0, n);
    const payload = {
      name: clip(name, 200),
      org: clip(org, 200),
      email: clip(email, 320),
      interest: clip(interest, 100),
      message: clip(message, 5000),
      source: clip(source || 'employers', 50),
    };

    await prisma.auditLog.create({
      data: {
        userId: null,
        action: 'inquiry_submitted',
        resource: 'inquiry',
        resourceId: payload.source,
        status: 'new',
        changes: JSON.stringify(payload),
      },
    });

    // Best-effort notification email — the lead is already stored above.
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const esc = (s: string) =>
          s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        await resend.emails.send({
          from: 'Soft Reset School <hi@softreset.school>',
          to: INQUIRY_INBOX,
          replyTo: payload.email,
          subject: `Inquiry — ${payload.org} (${payload.interest})`,
          html: `
            <h2>New ${esc(payload.source)} inquiry</h2>
            <p><strong>Name:</strong> ${esc(payload.name)}<br/>
            <strong>Organisation:</strong> ${esc(payload.org)}<br/>
            <strong>Email:</strong> ${esc(payload.email)}<br/>
            <strong>Interested in:</strong> ${esc(payload.interest)}</p>
            <p>${esc(payload.message || '(no message)')}</p>
          `,
        });
      } catch (mailErr) {
        console.error('Inquiry email failed (lead stored in AuditLog):', mailErr);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Inquiry submit error:', err);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

export default router;
