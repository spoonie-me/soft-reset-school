import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SEO, breadcrumbLd } from '@/components/SEO';

const FEATURES = [
  { icon: '📊', title: 'Admin dashboard', desc: 'Track learner progress, completion rates, and domain mastery across your entire team in one view.' },
  { icon: '📧', title: 'Bulk onboarding', desc: 'Invite your team via CSV upload or individual email links. Seats activate instantly.' },
  { icon: '🎯', title: 'Custom learning paths', desc: 'Configure which tracks are available to each team. Mix and match fundamentals, AI literacy, tools, and agents.' },
  { icon: '📜', title: 'Volume certificate issuance', desc: 'All certificates are verifiable and yours to keep. Buy Credential vouchers in bulk instead of one at a time.' },
  { icon: '🔒', title: 'GDPR-compliant DPA', desc: 'Data Processing Agreement provided for all team plans. EU and UK GDPR ready.' },
  { icon: '🤝', title: 'Dedicated support', desc: 'Priority email support and onboarding call for teams of 20+.' },
];

const WHO_FOR = [
  { title: 'Remote & Distributed Teams', color: 'var(--signal)', desc: 'Upskill your team in AI literacy, prompt engineering, and agent building — asynchronously, at their own pace.' },
  { title: 'Bootcamps & Coding Schools', color: 'var(--gold)', desc: 'Supplement your curriculum with practical AI tool-building content. Students get verifiable certificates they can show employers.' },
  { title: 'Tech Consultancies', color: 'var(--rust)', desc: 'Onboard new hires faster. Ensure every consultant can use Claude API, prompt effectively, and build AI-powered tools.' },
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
          interest: `Team vouchers (${form.size || 'unspecified'} seats)`,
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
        title="Teams & Organisations — Credential Vouchers | Soft Reset School"
        description="Get your team building with AI. Free content, flat €99 Credential vouchers, admin dashboard, progress reporting, GDPR-compliant DPA, and bulk onboarding. Built for distributed teams, bootcamps, and tech consultancies."
        canonical="/for-teams"
        keywords="team coding training, AI training for teams, bulk credential vouchers, GDPR DPA coding course, prompt engineering team training, Claude API team license, AI literacy enterprise training"
        jsonLd={[
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'For Teams', path: '/for-teams' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Soft Reset School for Teams',
            provider: { '@type': 'Organization', name: 'Soft Reset School', url: 'https://softreset.school/' },
            description:
              'Credential vouchers for the Soft Reset School career tracks. Admin dashboard, bulk onboarding, GDPR-compliant DPA.',
            areaServed: 'Worldwide',
            offers: [
              {
                '@type': 'Offer',
                name: '5–20 seats',
                price: '15.00',
                priceCurrency: 'EUR',
                priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  price: '15.00',
                  priceCurrency: 'EUR',
                  unitCode: 'MON',
                  referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'C62' },
                },
                availability: 'https://schema.org/InStock',
              },
              {
                '@type': 'Offer',
                name: '21–100 seats',
                price: '12.00',
                priceCurrency: 'EUR',
                priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  price: '12.00',
                  priceCurrency: 'EUR',
                  unitCode: 'MON',
                  referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'C62' },
                },
                availability: 'https://schema.org/InStock',
              },
            ],
          },
        ]}
      />
      {/* Hero */}
      <section style={{ padding: 'var(--space-4xl) var(--space-xl)', maxWidth: 900, margin: '0 auto' }}>
        <p style={{ color: 'var(--signal)', fontFamily: 'var(--font-display)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          For teams & organisations
        </p>
        <h1 style={{ fontSize: '2.75rem', marginBottom: 'var(--space-xl)', lineHeight: 1.1 }}>
          Get your team building with <span style={{ color: 'var(--signal)' }}>AI</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: 'var(--space-2xl)', maxWidth: 640 }}>
          Volume pricing, admin dashboard, progress reporting, and GDPR-compliant onboarding — built for teams that want to actually ship AI-powered tools.
        </p>
        <div className="hero-cta" style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <a href="#demo"><Button variant="primary" size="lg">Book a demo</Button></a>
          <Link to="/pricing"><Button variant="secondary" size="lg">See pricing</Button></Link>
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
        <h2 style={{ marginBottom: 'var(--space-sm)' }}>Credential vouchers</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>
          No subscription, no per-seat monthly billing. The first lesson of every track is a free trial — buy a block of vouchers (every lesson in the track, the certification exam and a permanent, publicly verifiable certificate) at the same flat €99/track individual learners pay. Redeem a voucher whenever a team member is ready, no expiry.
        </p>
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-xl)' }}>
          {[
            { seats: '5–20 vouchers', price: '€99', note: 'per voucher, flat' },
            { seats: '21–100 vouchers', price: '€99', note: 'per voucher, flat', highlight: true },
            { seats: '100+ vouchers', price: 'Custom', note: 'volume conversation' },
          ].map((tier) => (
            <Card key={tier.seats} style={tier.highlight ? { borderColor: 'var(--signal)' } : {}}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '1.75rem', marginBottom: 'var(--space-xs)' }}>{tier.price}</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-md)' }}>{tier.note}</p>
              <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{tier.seats}</p>
            </Card>
          ))}
        </div>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: 'var(--space-xl)' }}>
          All team plans include an admin dashboard, bulk onboarding, and a GDPR-compliant Data Processing Agreement.
        </p>
      </section>

      {/* Features */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-2xl)' }}>What you get</h2>
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-xl)' }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <h4 style={{ marginBottom: 'var(--space-xs)', fontSize: '0.9375rem' }}>{f.title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo form */}
      <section id="demo" style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-sm)' }}>Book a demo</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>
          Tell us about your team and we'll be in touch within one business day.
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
