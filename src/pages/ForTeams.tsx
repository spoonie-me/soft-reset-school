import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SEO, breadcrumbLd } from '@/components/SEO';

const WHO_FOR = [
  { title: 'Employers', color: 'var(--signal)', desc: 'Fund retraining for people coming back after illness, burnout, caring or a career break, at a pace they can sustain.' },
  { title: 'Nonprofits & rehab agencies', color: 'var(--gold)', desc: 'Pay for a block of seats and hand them to the people you support. Each one is a concrete, countable outcome.' },
  { title: 'Occupational health & return-to-work programmes', color: 'var(--rust)', desc: 'Offer a structured, flexible route back that does not depend on a fixed timetable.' },
];

const HOW_IT_WORKS = [
  { title: 'Tell us how many seats', desc: 'Use the form below. A seat is one person, one track.' },
  { title: 'We send single-use codes', desc: 'You get one code per seat, by email, with an invoice. Hand them out however suits you.' },
  { title: 'People redeem when ready', desc: 'A code unlocks the whole track, the exam and the certificate. No expiry, no deadline, no monthly billing.' },
  { title: 'Ask us for a progress summary', desc: 'On request we send a plain summary of how many seats were redeemed and certificates earned. There is no self-service dashboard yet.' },
];

export function ForTeams() {
  const [form, setForm] = useState({ name: '', org: '', email: '', size: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitDemo(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          org: form.org,
          email: form.email,
          interest: `Organisation seats (${form.size || 'unspecified'} seats)`,
          message: form.message,
          source: 'for-teams',
        }),
      });
      if (!res.ok) throw new Error('request failed');
      setStatus('sent');
      (window as any).trackEvent?.('inquiry_submitted', { source: 'for-teams' });
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
        title="Seats for organisations | Soft Reset School"
        description="Fund seats for people returning to work. €99 per track, single-use codes by email, no subscription. For employers, nonprofits, rehab agencies and return-to-work programmes."
        canonical="/for-teams"
        keywords="return to work programme training, fund retraining seats, vocational rehabilitation courses, career break retraining for employers"
        jsonLd={[
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'For Organisations', path: '/for-teams' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Soft Reset School seats for organisations',
            provider: { '@type': 'Organization', name: 'Soft Reset School', url: 'https://softreset.school/' },
            description: 'Single-use codes that unlock one Soft Reset School track, its exam and certificate, for people an organisation supports.',
            areaServed: 'Worldwide',
            offers: {
              '@type': 'Offer',
              name: 'Track seat',
              price: '99.00',
              priceCurrency: 'EUR',
              availability: 'https://schema.org/InStock',
            },
          },
        ]}
      />
      {/* Hero */}
      <section style={{ padding: 'var(--space-4xl) var(--space-xl)', maxWidth: 900, margin: '0 auto' }}>
        <p style={{ color: 'var(--signal)', fontFamily: 'var(--font-display)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          For organisations
        </p>
        <h1 style={{ fontSize: '2.75rem', marginBottom: 'var(--space-xl)', lineHeight: 1.1 }}>
          Fund a way back to work, <span style={{ color: 'var(--signal)' }}>at a pace people can keep.</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: 'var(--space-2xl)', maxWidth: 640 }}>
          Buy seats for the people you support. Each seat is €99 for one track, once. We handle it by email, so there is no software to set up.
        </p>
        <div className="hero-cta" style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <a href="#demo"><Button variant="primary" size="lg">Ask about seats</Button></a>
          <Link to="/pricing"><Button variant="secondary" size="lg">See individual pricing</Button></Link>
        </div>
      </section>

      {/* Who it's for */}
      <section style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-2xl)' }}>Who it's for</h2>
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-xl)' }}>
            {WHO_FOR.map((w) => (
              <Card key={w.title}>
                <div style={{ width: 32, height: 3, background: w.color, borderRadius: 2, marginBottom: 'var(--space-md)' }} />
                <h3 style={{ fontSize: '1rem', color: w.color, marginBottom: 'var(--space-md)' }}>{w.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{w.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-sm)' }}>Seats and partnerships</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>
          No subscription and no per-seat monthly billing. The first lesson of every track is a free trial, so people can try before a seat is used.
        </p>
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-xl)' }}>
          <Card>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '1.75rem', marginBottom: 'var(--space-xs)' }}>€99</p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-md)' }}>per seat, once, any number of seats</p>
            <p style={{ color: 'var(--text-secondary)' }}>Every lesson in the track, the exam and a permanent, publicly verifiable certificate. Same price an individual pays.</p>
          </Card>
          <Card>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '1.75rem', marginBottom: 'var(--space-xs)' }}>On request</p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-md)' }}>ongoing partnership</p>
            <p style={{ color: 'var(--text-secondary)' }}>For organisations that want to keep a pool of seats topped up through the year, with a regular summary of progress. Tell us what you need and we will propose a price.</p>
          </Card>
        </div>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: 'var(--space-xl)' }}>
          A data processing agreement is available on request.
        </p>
      </section>

      {/* How it works */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-2xl)' }}>How it works</h2>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-lg)' }}>
            {HOW_IT_WORKS.map((f, i) => (
              <li key={f.title}>
                <h4 style={{ marginBottom: 'var(--space-xs)', fontSize: '0.9375rem' }}>{i + 1}. {f.title}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Demo form */}
      <section id="demo" style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-sm)' }}>Ask about seats</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>
          Tell us about your organisation and how many seats you need. We will reply by email.
        </p>
        <Card>
          <form onSubmit={submitDemo} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
              <div>
                <label htmlFor="ft-name" style={labelStyle}>Your name *</label>
                <input id="ft-name" style={inputStyle} required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Dr. Jane Smith" />
              </div>
              <div>
                <label htmlFor="ft-org" style={labelStyle}>Organisation *</label>
                <input id="ft-org" style={inputStyle} required value={form.org} onChange={(e) => update('org', e.target.value)} placeholder="NHS Greater Manchester" />
              </div>
            </div>
            <div>
              <label htmlFor="ft-email" style={labelStyle}>Work email *</label>
              <input id="ft-email" style={inputStyle} type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="jane@nhs.net" />
            </div>
            <div>
              <label htmlFor="ft-size" style={labelStyle}>Team size *</label>
              <select id="ft-size" style={inputStyle} required value={form.size} onChange={(e) => update('size', e.target.value)}>
                <option value="">Select…</option>
                <option value="5-20">5–20 seats</option>
                <option value="21-100">21–100 seats</option>
                <option value="100+">100+ seats</option>
              </select>
            </div>
            <div>
              <label htmlFor="ft-message" style={labelStyle}>Anything else we should know?</label>
              <textarea id="ft-message" style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Your goals, timeline, specific tracks you need…" />
            </div>
            {status === 'sent' ? (
              <p role="status" style={{ color: 'var(--crystal)', fontSize: '0.9375rem', margin: 0 }}>
                Got it — we'll reply within one business day. Thank you.
              </p>
            ) : (
              <Button variant="primary" type="submit" disabled={status === 'sending'} style={{ alignSelf: 'flex-start' }}>
                {status === 'sending' ? 'Sending…' : 'Send demo request'}
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
