import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SEO, breadcrumbLd } from '@/components/SEO';

const WHY_IT_WORKS = [
  { icon: '🎯', title: 'Direct, measurable impact', desc: 'Every seat you fund goes to one named scholarship recipient. You know exactly how many people your sponsorship reached — not a vague CSR line item.' },
  { icon: '♿', title: 'Disability inclusion, not just diversity messaging', desc: 'Bedcoders exists specifically for chronically ill and disabled people who\'ve been priced or paced out of tech re-entry. Sponsoring it is a concrete accessibility commitment, not a statement.' },
  { icon: '🖥️', title: 'Hardware + skills, not just funding', desc: 'For hardware partners: a scholarship seat plus the device it runs on solves the two real barriers to tech re-entry at once — cost of learning, and cost of the machine to learn on.' },
];

const OTHER_SPONSORS = [
  { name: 'Boehringer Ingelheim', angle: 'Chronic illness treatment R&D meets workforce re-entry for the patients it treats.' },
  { name: 'Takeda', angle: 'Rare disease and chronic condition focus aligns directly with the Bedcoders learner base.' },
];

export function Sponsors() {
  const [form, setForm] = useState({ name: '', org: '', email: '', seats: '', message: '' });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function submitInquiry(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Sponsorship inquiry — ${form.org || 'unnamed org'}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nOrganisation: ${form.org}\nEmail: ${form.email}\nSeats interested in funding: ${form.seats}\n\n${form.message}`
    );
    window.location.href = `mailto:hello@bedcoders.com?subject=${subject}&body=${body}`;
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
        title="Sponsor Scholarships — Bedcoders for Companies"
        description="Fund Bedcoders scholarship seats for chronically ill and disabled learners. A concrete, measurable disability-inclusion commitment — hardware and skills together solve tech re-entry."
        canonical="/sponsors"
        keywords="corporate CSR disability inclusion, sponsor coding scholarships, disability tech workforce funding, accessible tech education sponsorship"
        jsonLd={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Sponsors', path: '/sponsors' },
        ])}
      />

      {/* Hero */}
      <section style={{ padding: 'var(--space-4xl) var(--space-xl)', maxWidth: 900, margin: '0 auto' }}>
        <p style={{ color: 'var(--signal)', fontFamily: 'var(--font-display)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          For sponsors
        </p>
        <h1 style={{ fontSize: '2.75rem', marginBottom: 'var(--space-xl)', lineHeight: 1.1 }}>
          Fund the seats. <span style={{ color: 'var(--signal)' }}>We'll fill them.</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: 640, margin: '0 auto var(--space-2xl)' }}>
          Bedcoders scholarships exist because companies sponsor them. Every seat is full Pro access — all 4 tracks, AI feedback, certificates — for a chronically ill or disabled learner who couldn't otherwise afford €12/month.
        </p>
        <a href="#inquire"><Button variant="primary" size="lg">Start a sponsorship</Button></a>
      </section>

      {/* Dell flagship case study */}
      <section style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '0.8125rem', marginBottom: 'var(--space-md)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Flagship example
          </p>
          <h2 style={{ marginBottom: 'var(--space-xl)' }}>Dell: hardware and access, together</h2>
          <Card style={{ padding: 'var(--space-2xl)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: 'var(--space-lg)' }}>
              Bedcoders founder Roi Shternin is a Dell Precision Ambassador — one of two health voices among 24 global ambassadors, representing the intersection of chronic illness and technical work firsthand.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: 'var(--space-lg)' }}>
              That relationship makes the sponsorship case direct: Dell Precision hardware is built for demanding technical work; Bedcoders scholarships remove the cost barrier to learning that work in the first place. Paired together, they address both obstacles disabled developers face re-entering tech — the machine, and the education to use it.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: 0 }}>
              A Dell-sponsored cohort could pair funded scholarship seats with Precision hardware access for recipients who need it — a bundled commitment other hardware and technology partners can also plug into.
            </p>
          </Card>
        </div>
      </section>

      {/* Why it works */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-2xl)' }}>Why this works as a CSR commitment</h2>
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-xl)' }}>
          {WHY_IT_WORKS.map((w) => (
            <Card key={w.title}>
              <span style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)', display: 'block' }}>{w.icon}</span>
              <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>{w.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{w.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing tiers */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-sm)' }}>Sponsor a cohort</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>Fund by the seat, the cohort, or the year. Every model funds full Pro access at €12/seat/month.</p>
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-xl)' }}>
            {[
              { tier: '10 seats', price: '€1,440', note: 'per year — a starter cohort' },
              { tier: '50 seats', price: '€7,200', note: 'per year — a named cohort', highlight: true },
              { tier: '100+ seats', price: 'Custom', note: 'branded scholarship program' },
            ].map((t) => (
              <Card key={t.tier} style={t.highlight ? { borderColor: 'var(--signal)' } : {}}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '1.75rem', marginBottom: 'var(--space-xs)' }}>{t.price}</p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-md)' }}>{t.note}</p>
                <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{t.tier}</p>
              </Card>
            ))}
          </div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: 'var(--space-xl)' }}>
            Every sponsored seat funds one full year of Pro access for a scholarship recipient selected through our existing application process.
          </p>
        </div>
      </section>

      {/* Other sponsors slot-in */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 700, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>Built for more than one sponsor</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-xl)', lineHeight: 1.6 }}>
          The same structure — fund seats, we run the program — fits pharma and health sponsors just as naturally as hardware partners:
        </p>
        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
          {OTHER_SPONSORS.map((s) => (
            <Card key={s.name} style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'baseline', padding: 'var(--space-lg)' }}>
              <strong style={{ color: 'var(--text-primary)', flexShrink: 0, minWidth: 160 }}>{s.name}</strong>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{s.angle}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* Inquiry form */}
      <section id="inquire" style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-sm)' }}>Start a sponsorship conversation</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>
          Tell us who you are and roughly how many seats you're considering. We'll follow up within a business day.
        </p>
        <Card>
          <form onSubmit={submitInquiry} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
              <div>
                <label htmlFor="sp-name" style={labelStyle}>Your name *</label>
                <input id="sp-name" style={inputStyle} required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Jordan Lee" />
              </div>
              <div>
                <label htmlFor="sp-org" style={labelStyle}>Organisation *</label>
                <input id="sp-org" style={inputStyle} required value={form.org} onChange={(e) => update('org', e.target.value)} placeholder="Acme Corp" />
              </div>
            </div>
            <div>
              <label htmlFor="sp-email" style={labelStyle}>Work email *</label>
              <input id="sp-email" style={inputStyle} type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="jordan@acme.com" />
            </div>
            <div>
              <label htmlFor="sp-seats" style={labelStyle}>Seats you're considering</label>
              <select id="sp-seats" style={inputStyle} value={form.seats} onChange={(e) => update('seats', e.target.value)}>
                <option value="">Select…</option>
                <option value="10">~10 seats</option>
                <option value="50">~50 seats</option>
                <option value="100+">100+ seats</option>
                <option value="not-sure">Not sure yet</option>
              </select>
            </div>
            <div>
              <label htmlFor="sp-message" style={labelStyle}>Anything else we should know?</label>
              <textarea id="sp-message" style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Budget cycle, region focus, hardware bundling interest…" />
            </div>
            <Button variant="primary" type="submit" style={{ alignSelf: 'flex-start' }}>
              Send inquiry
            </Button>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', margin: 0 }}>
              Or email directly at{' '}
              <a href="mailto:hello@bedcoders.com" style={{ color: 'var(--signal)', textDecoration: 'none' }}>hello@bedcoders.com</a>
            </p>
          </form>
        </Card>
      </section>

      <section style={{ textAlign: 'center', padding: '0 var(--space-xl) var(--space-3xl)' }}>
        <Link to="/scholarships" style={{ color: 'var(--signal)', fontSize: '0.9375rem' }}>See what a scholarship seat includes →</Link>
      </section>
    </div>
  );
}
