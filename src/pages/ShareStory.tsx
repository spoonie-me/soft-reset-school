import { useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SEO } from '@/components/SEO';

const TRACKS = [
  { id: 'fundamentals', name: '🛏️ Code from Bed' },
  { id: 'ai', name: '🤖 AI Literacy for Humans' },
  { id: 'tools', name: '⚡ Build Cool Tools Fast' },
  { id: 'advanced', name: '🚀 AI Agents that Work' },
];

export function ShareStory() {
  const [form, setForm] = useState({ name: '', role: '', track: '', outcome: '', quote: '', email: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
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

  if (status === 'success') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-4xl) var(--space-xl)', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>🎉</div>
        <h1 style={{ marginBottom: 'var(--space-md)' }}>Thank you!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          We've received your story. We review all submissions and will reach out if we'd like to feature yours on the site.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <SEO
        title="Share your Soft Reset School story"
        description="Tell us how learning to code from bed changed something for you. We feature student stories on the site (with your permission) — bed-built careers, late starts, comebacks."
        canonical="/share-story"
      />
      <div style={{ width: 40, height: 4, background: 'var(--signal)', borderRadius: 2, marginBottom: 'var(--space-lg)' }} />
      <h1 style={{ marginBottom: 'var(--space-sm)' }}>Share your Soft Reset School story</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3xl)', lineHeight: 1.6 }}>
        Did Soft Reset School help you get back to work or build something real? We'd love to hear what changed for you.
        Real stories help others make the leap.
      </p>

      <Card>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
            <div>
              <label style={labelStyle}>Your name *</label>
              <input style={inputStyle} required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Sarah E." />
            </div>
            <div>
              <label style={labelStyle}>Current role *</label>
              <input style={inputStyle} required value={form.role} onChange={(e) => update('role', e.target.value)} placeholder="Freelance Developer, Remote" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Which track did you complete? *</label>
            <select style={inputStyle} required value={form.track} onChange={(e) => update('track', e.target.value)}>
              <option value="">Choose a track…</option>
              {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>What changed for you? * <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(one sentence)</span></label>
            <input style={inputStyle} required value={form.outcome} onChange={(e) => update('outcome', e.target.value)} placeholder="Shipped my first AI-powered tool in 3 weeks." />
          </div>

          <div>
            <label style={labelStyle}>Your testimonial * <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(2–3 sentences)</span></label>
            <textarea
              style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
              required
              value={form.quote}
              onChange={(e) => update('quote', e.target.value)}
              placeholder="Tell us specifically what clicked, what you learned, how it helped you land the role…"
            />
          </div>

          <div>
            <label style={labelStyle}>Email <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional — for follow-up only, never published)</span></label>
            <input style={inputStyle} type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />
          </div>

          {status === 'error' && (
            <p style={{ color: 'var(--rust)', fontSize: '0.875rem' }}>Something went wrong. Please try again or email hi@softreset.school.</p>
          )}

          <Button variant="primary" type="submit" disabled={status === 'loading'} style={{ alignSelf: 'flex-start' }}>
            {status === 'loading' ? 'Submitting…' : 'Submit your story'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
