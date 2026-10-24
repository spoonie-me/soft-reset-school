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
        title="For Employers — hire-train-place talent and certification seats"
        description="Hire graduates trained in AI-assisted software development, AI automation consulting, AI-augmented medical coding and digital accessibility QA, or sponsor certification seats for your own people. €99 per seat, no expiry."
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
          Talent you won't find elsewhere, seats for your own people
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: 620 }}>
          Two ways to work with us: hire graduates whose expertise comes from lived experience, or back your own returning employees and candidates with a certification seat.
        </p>
      </section>

      {/* Hire-train-place talent */}
      <section style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
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
      </section>

      {/* Why this talent pool */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>why this specific talent pool</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', marginBottom: 'var(--space-lg)' }}>
          Screen-reader fluency you can't fake by reading a WCAG checklist — our accessibility QA lessons put the learner behind the actual assistive technology, tabbing and listening themselves, not reading about someone else's experience with it. AI-assisted development that's actually about directing and reviewing AI output, catching what it gets confidently wrong — not prompting alone. These aren't soft-skill claims — they're the specific reason each track exists as a deliberately-scoped program rather than a generic bootcamp module. And every certificate we issue carries a public verification code, so you can check a candidate's credential in seconds instead of taking a CV's word for it.
        </p>
        <Link to="/about" style={{ color: 'var(--signal)', fontSize: '0.9375rem', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Read the full reasoning behind each track &rarr;</Link>
      </section>

      {/* Seats — the one thing with a published price */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-2xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-md)' }}>Seats — €99 per track, flat</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-md)' }}>
            One seat is one person's credential for one track. A seat unlocks every lesson in the track, plus the exam and certificate. It costs exactly what an individual learner pays — €99 — and is redeemable whenever the person is ready, with no expiry. For a company, that's the cheapest return-to-work or upskilling instrument you'll price this year; for the learner, it's an employer saying "we'll back you" without a deadline attached.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Buying for a team? See <Link to="/for-teams" style={{ color: 'var(--signal)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>team seats</Link>, or tell us how many below.
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
                <option value="Hire-train-place">Hire-train-place talent</option>
                <option value="Seats">Certification seats for employees/candidates</option>
                <option value="Both">Both</option>
                <option value="Not sure yet">Not sure yet</option>
              </select>
            </div>
            <div>
              <label htmlFor="em-message" style={labelStyle}>Anything else we should know?</label>
              <textarea id="em-message" style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Roles you're hiring for, number of seats, tracks, timeline…" />
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
