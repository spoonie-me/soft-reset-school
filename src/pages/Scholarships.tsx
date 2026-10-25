import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SEO, breadcrumbLd } from '@/components/SEO';

const WHO_QUALIFIES = [
  { icon: '🩺', title: 'Living with chronic illness or disability', desc: 'Any diagnosis, any severity. You don\'t need to prove how sick you are — self-identification is enough.' },
  { icon: '💶', title: 'Cost is the barrier', desc: '€12/month is out of reach right now. That\'s the whole bar. No income documentation, no means test.' },
  { icon: '🌍', title: 'Anywhere in the world', desc: 'Scholarship seats aren\'t limited by country. Sponsor funding may occasionally target a region — we\'ll always say so up front.' },
];

const WHAT_YOU_GET = [
  'Full Pro access — all 4 tracks, every lesson, every exercise',
  'The same AI feedback, the same certificates, the same pacing model as a paying student',
  'No expiry pressure — a scholarship seat runs for a full year, renewable',
  'Nothing on your certificate or profile marks you as a scholarship student. It looks exactly like everyone else\'s.',
];

export function Scholarships() {
  const [form, setForm] = useState({ name: '', email: '', situation: '' });
  const [submitted, setSubmitted] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function submitApplication(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent('Bedcoders scholarship application');
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\nA bit about your situation:\n${form.situation}`
    );
    window.location.href = `mailto:hello@bedcoders.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
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
        title="Scholarships — Free Access to Bedcoders"
        description="Bedcoders scholarship seats give chronically ill and disabled learners full Pro access at no cost. No means test, no bureaucracy — just a short note about your situation."
        canonical="/scholarships"
        keywords="free coding course chronic illness, disability scholarship tech training, sponsored coding education, accessible AI literacy scholarship"
        jsonLd={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Scholarships', path: '/scholarships' },
        ])}
      />

      {/* Hero */}
      <section style={{ padding: 'var(--space-4xl) var(--space-xl)', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--signal)', fontFamily: 'var(--font-display)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Scholarships
        </p>
        <h1 style={{ fontSize: '2.75rem', marginBottom: 'var(--space-xl)', lineHeight: 1.1 }}>
          If €12/month is the thing standing between you and this, <span style={{ color: 'var(--signal)' }}>tell us</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: 620, margin: '0 auto var(--space-lg)' }}>
          Bedcoders scholarship seats are funded by sponsors and community donors so that cost never decides who gets to learn to code and build with AI. Full access, no cost, no bureaucracy.
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9375rem', maxWidth: 560, margin: '0 auto' }}>
          We're not going to ask for a doctor's letter or a bank statement. You know your situation. Tell us in your own words.
        </p>
      </section>

      {/* Who qualifies */}
      <section style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-2xl)' }}>Who qualifies</h2>
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-xl)' }}>
            {WHO_QUALIFIES.map((w) => (
              <Card key={w.title}>
                <span style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)', display: 'block' }}>{w.icon}</span>
                <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>{w.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{w.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 700, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-xl)' }}>What a scholarship seat includes</h2>
        <Card style={{ padding: 'var(--space-2xl)' }}>
          <ul style={{ display: 'grid', gap: 'var(--space-md)' }}>
            {WHAT_YOU_GET.map((item) => (
              <li key={item} style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span> {item}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* How it works */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-xl)' }}>How it works</h2>
          <ol style={{ display: 'grid', gap: 'var(--space-lg)', color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, paddingLeft: 'var(--space-xl)' }}>
            <li>Fill in the short form below — a couple of lines about your situation is enough. Take your time; there's no deadline.</li>
            <li>We read every application ourselves. No algorithm, no scoring rubric that filters you out for the wrong words.</li>
            <li>You'll hear back within a week, usually sooner. If a seat is open, you're in immediately.</li>
            <li>If seats are full when you apply, you go on the list for the next round instead of getting a rejection.</li>
          </ol>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-sm)' }}>Apply for a scholarship seat</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>
          No forms to upload, nothing to prove. Just tell us what's going on.
        </p>
        <Card>
          {submitted ? (
            <p style={{ color: 'var(--success)', fontSize: '0.9375rem', textAlign: 'center', padding: 'var(--space-lg) 0' }}>
              Your email client should have opened with your application ready to send. If it didn't, email us directly at{' '}
              <a href="mailto:hello@bedcoders.com" style={{ color: 'var(--signal)' }}>hello@bedcoders.com</a>.
            </p>
          ) : (
            <form onSubmit={submitApplication} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              <div>
                <label htmlFor="sch-name" style={labelStyle}>Your name *</label>
                <input id="sch-name" style={inputStyle} required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Alex Rivera" />
              </div>
              <div>
                <label htmlFor="sch-email" style={labelStyle}>Email *</label>
                <input id="sch-email" style={inputStyle} type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="alex@example.com" />
              </div>
              <div>
                <label htmlFor="sch-situation" style={labelStyle}>A bit about your situation *</label>
                <textarea
                  id="sch-situation"
                  style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
                  required
                  value={form.situation}
                  onChange={(e) => update('situation', e.target.value)}
                  placeholder="Whatever feels relevant — your condition, why cost is the barrier, what you're hoping to build. A few sentences is plenty."
                />
              </div>
              <Button variant="primary" type="submit" style={{ alignSelf: 'flex-start' }}>
                Send application
              </Button>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', margin: 0 }}>
                Prefer to write directly? Email{' '}
                <a href="mailto:hello@bedcoders.com" style={{ color: 'var(--signal)', textDecoration: 'none' }}>hello@bedcoders.com</a>
              </p>
            </form>
          )}
        </Card>
      </section>

      {/* Sponsor callout */}
      <section style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-xl)', borderTop: '1px solid var(--bg-border)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-lg)' }}>
          Scholarship seats exist because companies fund them.
        </p>
        <Link to="/sponsors"><Button variant="secondary">See how sponsorship works →</Button></Link>
      </section>
    </div>
  );
}
