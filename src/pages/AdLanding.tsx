import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SEO } from '@/components/SEO';

const SLUG_CONFIG: Record<string, { trackId: string; label: string; headline: string; sub: string }> = {
  '/go/coding': {
    trackId: 'fundamentals',
    label: 'Code from Bed',
    headline: 'Start coding from your couch.',
    sub: 'The Code from Bed track covers variables, functions, control flow, and your first web app — built with Claude. Zero to deployed, no CS degree required.',
  },
  '/go/ai': {
    trackId: 'ai',
    label: 'AI Literacy Certification',
    headline: 'Learn AI like a pro.',
    sub: 'Master prompt engineering, Claude API, hallucinations, and LLM limits. The AI Literacy track takes you from curious to capable in 4 weeks.',
  },
  '/go/agents': {
    trackId: 'advanced',
    label: 'AI Agents Certification',
    headline: 'Build agents that work.',
    sub: 'The AI Agents track covers tool use, memory, planning, and production deployment. Build autonomous systems that solve real problems.',
  },
};

const OUTCOMES = [
  { icon: '🛏️', text: 'Remote developer shipping AI-powered tools for clients' },
  { icon: '⚡', text: 'Freelancer who automates workflows using Claude API' },
  { icon: '🚀', text: 'Product builder who deploys agents without a CS degree' },
  { icon: '🤖', text: 'AI-literate professional who can challenge and guide AI teams' },
];

const TRUST = [
  { stat: '190+', label: 'practice exercises' },
  { stat: '4', label: 'career tracks' },
  { stat: '€99', label: 'one-time, no subscription' },
];

const INCLUDES = [
  '60+ structured lessons — Claude API, prompt engineering, agents, tool-building',
  '200+ AI-graded exercises with real-time written feedback on every answer',
  'Certification exam — sit it when you\'re ready, no deadline, no re-purchase',
  'Verifiable certificate with public verification code — share on LinkedIn',
];

async function startCheckout(trackId: string, slug: string) {
  const g = (window as any).gtag;
  if (typeof g === 'function') {
    g('event', 'begin_checkout', {
      currency: 'EUR',
      value: 99.0,
      items: [{ item_id: 'track_credential', item_name: 'Soft Reset School Track Credential', item_category: 'credential', price: 99.0, quantity: 1 }],
    });
  }
  if (typeof window !== 'undefined' && (window as any).trackEvent) {
    (window as any).trackEvent('ad_cta_click', { page: slug.replace('/go/', 'go_'), track: trackId });
  }

  try {
    const res = await fetch('/api/checkout/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'track_credential', trackId }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(`Error: ${err.error || 'Checkout failed'}`);
      return;
    }
    const { url } = await res.json();
    if (url) window.location.href = url;
  } catch {
    alert('Failed to start checkout. Please try again.');
  }
}

export function AdLanding() {
  const [loading, setLoading] = useState(false);
  const { pathname } = useLocation();
  const cfg = SLUG_CONFIG[pathname] ?? SLUG_CONFIG['/go/coding'];

  const handleCTA = async () => {
    setLoading(true);
    await startCheckout(cfg.trackId, pathname);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
      <SEO
        title={`${cfg.label} — Soft Reset School`}
        description={cfg.sub}
        noIndex
      />
      {/* Minimal brand bar */}
      <div style={{ borderBottom: '1px solid var(--bg-border)', padding: '14px var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--signal)', letterSpacing: '0.06em' }}>
          SOFT RESET SCHOOL
        </span>
        <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none' }}>
          Sign in
        </Link>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(48px, 8vw, 96px) var(--space-xl) var(--space-3xl)' }}>
        <p style={{ color: 'var(--signal)', fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 'var(--space-lg)' }}>
          {cfg.label}
        </p>

        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.15, fontWeight: 700, marginBottom: 'var(--space-xl)', color: 'var(--text-primary)' }}>
          {cfg.headline}<br />
          <span style={{ color: 'var(--signal)' }}>No CS degree required.</span>
        </h1>

        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-3xl)', maxWidth: 560 }}>
          {cfg.sub}
        </p>

        {/* CTA block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', maxWidth: 400 }}>
          <button
            onClick={handleCTA}
            disabled={loading}
            style={{
              background: 'var(--signal)',
              color: 'var(--bg-void)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '16px 32px',
              fontSize: '1.0625rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.15s',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.02em',
            }}
          >
            {loading ? 'Redirecting…' : 'Get certified — €99, once'}
          </button>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            One-time payment, no subscription, nothing renews. <Link to="/signup" style={{ color: 'var(--signal)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Try lesson 1 free</Link>, no card.
          </p>
        </div>

        {/* Trust stats */}
        <div style={{ display: 'flex', gap: 'var(--space-2xl)', marginTop: 'var(--space-3xl)', flexWrap: 'wrap' }}>
          {TRUST.map((t) => (
            <div key={t.stat}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{t.stat}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--bg-border)' }} />

      {/* Where this takes you */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.375rem', marginBottom: 'var(--space-xl)', color: 'var(--text-primary)' }}>
          Where this takes you
        </h2>
        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
          {OUTCOMES.map((o) => (
            <div
              key={o.text}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-md)',
                padding: 'var(--space-md) var(--space-lg)',
                border: '1px solid var(--bg-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
              }}
            >
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{o.icon}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5 }}>{o.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--bg-border)' }} />

      {/* What's included */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.375rem', marginBottom: 'var(--space-xl)', color: 'var(--text-primary)' }}>
          What's included
        </h2>
        <ul style={{ display: 'grid', gap: 'var(--space-md)', listStyle: 'none', padding: 0, margin: 0 }}>
          {INCLUDES.map((item) => (
            <li key={item} style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
              <span style={{ color: 'var(--signal)', flexShrink: 0, fontWeight: 700, marginTop: 1 }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--bg-border)' }} />

      {/* Final CTA */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-lg)', color: 'var(--text-primary)' }}>
          Ready to make the move?
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)', maxWidth: 480, margin: '0 auto var(--space-xl)' }}>
          €99, one-time. Every lesson in the track, the certification exam and a permanent, publicly verifiable certificate. Try lesson 1 free first.
        </p>
        <button
          onClick={handleCTA}
          disabled={loading}
          style={{
            background: 'var(--signal)',
            color: 'var(--bg-void)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '16px 40px',
            fontSize: '1.0625rem',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.02em',
          }}
        >
          {loading ? 'Redirecting…' : 'Get certified — €99, once'}
        </button>
        <p style={{ marginTop: 'var(--space-md)', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
          Questions? <a href="mailto:hi@softreset.school" style={{ color: 'var(--signal)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>hi@softreset.school</a>
        </p>
      </div>

      {/* Footer strip */}
      <div style={{ borderTop: '1px solid var(--bg-border)', padding: 'var(--space-xl)', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          © {new Date().getFullYear()} Soft Reset School &nbsp;·&nbsp;
          <Link to="/privacy" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>Privacy</Link>
          &nbsp;·&nbsp;
          <Link to="/terms" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>Terms</Link>
          &nbsp;·&nbsp;
          <Link to="/imprint" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>Imprint</Link>
        </p>
      </div>
    </div>
  );
}
