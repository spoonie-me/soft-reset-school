import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SEO, breadcrumbLd } from '@/components/SEO';

export function Employers() {
  const [form, setForm] = useState({ name: '', org: '', email: '', interest: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'employers' }),
      });
      if (!res.ok) throw new Error('request failed');
      setStatus('sent');
      (window as any).trackEvent?.('inquiry_submitted', { source: 'employers', interest: form.interest });
    } catch {
      setStatus('error');
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--bg-border)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)',
    color: 'var(--text-primary)',
    fontSize: '0.9375rem',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    marginBottom: 'var(--space-xs)',
  };

  return (
    <div>
      <SEO
        title="For Employers — accessibility audits and hire-train-place talent"
        description="Two ways to work with Soft Reset School: accessibility compliance audits ahead of the European Accessibility Act, and hiring graduates trained in AI-assisted software development and hands-on digital accessibility QA."
        canonical="/employers"
        jsonLd={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'For Employers', path: '/employers' },
        ])}
      />

      {/* Hero */}
      <section style={{ padding: 'var(--space-4xl) var(--space-xl)', maxWidth: 800, margin: '0 auto' }}>
        <p style={{ color: 'var(--signal)', fontFamily: 'var(--font-display)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          for employers
        </p>
        <h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 2.75rem)', marginBottom: 'var(--space-xl)', lineHeight: 1.1 }}>
          Compliance you actually need, talent you won't find elsewhere
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: 620 }}>
          Two separate things, both real: audits that get you compliant, and graduates whose expertise comes from lived experience an automated scanner can't replicate.
        </p>
      </section>

      {/* Two offerings */}
      <section style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="grid-2" style={{ display: 'grid', gap: 'var(--space-xl)' }}>
            <Card>
              <div style={{ width: 40, height: 4, background: 'var(--signal)', borderRadius: 2, marginBottom: 'var(--space-lg)' }} />
              <h2 style={{ color: 'var(--signal)', fontSize: '1.25rem', marginBottom: 'var(--space-md)' }}>Accessibility compliance audits</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-lg)' }}>
                The European Accessibility Act is now in force. If your product, LMS, or digital service serves EU users, WCAG 2.1 AA compliance isn't optional anymore — it's a market-access condition.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Audits are conducted by reviewers who bring both technical standards knowledge and lived assistive-technology experience — the combination that catches what an automated scanner misses.
              </p>
            </Card>
            <Card>
              <div style={{ width: 40, height: 4, background: 'var(--crystal)', borderRadius: 2, marginBottom: 'var(--space-lg)' }} />
              <h2 style={{ color: 'var(--crystal)', fontSize: '1.25rem', marginBottom: 'var(--space-md)' }}>Hire-train-place talent</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-lg)' }}>
                Four career tracks, each ending in a timed, multiple-choice certification exam and a publicly verifiable certificate: AI-assisted software development, AI automation consulting, AI-augmented medical coding, and hands-on digital accessibility QA. The curricula are young and growing — ask us exactly what a specific candidate has completed and verified before hiring, and we'll tell you honestly.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                We're building relationships with vocational-rehabilitation and workforce-development programs that may be able to offset placement costs depending on your jurisdiction — worth raising in the initial conversation, though nothing's formalized yet.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Why this talent pool */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>why this specific talent pool</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', marginBottom: 'var(--space-lg)' }}>
          Screen-reader fluency you can't fake by reading a WCAG checklist — our accessibility QA lessons put the learner behind the actual assistive technology, tabbing and listening themselves, not reading about someone else's experience with it. AI-assisted development that's actually about directing and reviewing AI output, catching what it gets confidently wrong — not prompting alone. These aren't soft-skill claims — they're the specific reason each track exists as a deliberately-scoped program rather than a generic bootcamp module. And every certificate we issue carries a public verification code, so you can check a candidate's credential in seconds instead of taking a CV's word for it.
        </p>
        <Link to="/about" style={{ color: 'var(--signal)', fontSize: '0.9375rem', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Read the full reasoning behind each track &rarr;</Link>
      </section>

      {/* Credential vouchers — the one thing with a published price */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-2xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-md)' }}>Credential vouchers — €99 per track, flat</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-md)' }}>
            Sponsor certification for your own returning employees, or for candidates you're considering. Vouchers cost exactly what individual learners pay — €99 per track credential — redeemable whenever the person is ready, no expiry. For a company, that's the cheapest return-to-work or upskilling instrument you'll price this year; for the learner, it's an employer saying "we'll back you" without a deadline attached.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Audit and placement pricing depends on scope — platform size, number of roles, timeline. We'd rather scope it with you directly than publish a number that doesn't fit your situation.
          </p>
        </div>
      </section>

      {/* Contact form */}
      <section id="contact" style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-sm)' }}>Start the conversation</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>
          Tell us what you're looking for and we'll follow up within one business day.
        </p>
        <Card>
          <form onSubmit={submitInquiry} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
              <div>
                <label htmlFor="em-name" style={labelStyle}>Your name *</label>
                <input id="em-name" style={inputStyle} required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Jane Smith" />
              </div>
              <div>
                <label htmlFor="em-org" style={labelStyle}>Organisation *</label>
                <input id="em-org" style={inputStyle} required value={form.org} onChange={(e) => update('org', e.target.value)} placeholder="Acme Corp" />
              </div>
            </div>
            <div>
              <label htmlFor="em-email" style={labelStyle}>Work email *</label>
              <input id="em-email" style={inputStyle} type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="jane@acme.com" />
            </div>
            <div>
              <label htmlFor="em-interest" style={labelStyle}>Interested in *</label>
              <select id="em-interest" style={inputStyle} required value={form.interest} onChange={(e) => update('interest', e.target.value)}>
                <option value="">Select…</option>
                <option value="Accessibility audit">Accessibility compliance audit</option>
                <option value="Hire-train-place">Hire-train-place placement</option>
                <option value="Credential vouchers">Credential vouchers for employees/candidates</option>
                <option value="Both">Both</option>
                <option value="Not sure yet">Not sure yet</option>
              </select>
            </div>
            <div>
              <label htmlFor="em-message" style={labelStyle}>Anything else we should know?</label>
              <textarea id="em-message" style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Platform size, roles you're hiring for, timeline…" />
            </div>
            {status === 'sent' ? (
              <p role="status" style={{ color: 'var(--crystal)', fontSize: '0.9375rem', margin: 0 }}>
                Got it — we'll reply within one business day. Thank you.
              </p>
            ) : (
              <Button variant="primary" type="submit" disabled={status === 'sending'} style={{ alignSelf: 'flex-start' }}>
                {status === 'sending' ? 'Sending…' : 'Send inquiry'}
              </Button>
            )}
            {status === 'error' && (
              <p role="alert" style={{ color: 'var(--rust)', fontSize: '0.875rem', margin: 0 }}>
                Something went wrong — please try again, or email us directly.
              </p>
            )}
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', margin: 0 }}>
              Or email us directly at{' '}
              <a href="mailto:hi@softreset.school" style={{ color: 'var(--signal)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>hi@softreset.school</a>
            </p>
          </form>
        </Card>
      </section>
    </div>
  );
}
