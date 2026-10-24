import { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { SEO } from '@/components/SEO';

/**
 * /welcome — LinkedIn Ads conversion landing page.
 *
 * Flow:
 *   1. LinkedIn ad → https://softreset.school/welcome?utm_source=linkedin&utm_medium=cpc&utm_campaign=launch
 *   2. User sees the value prop + CTA to sign up
 *   3. After signup → /dashboard (standard flow)
 *   4. LinkedIn pixel fires on /welcome page load = "landing" event
 *   5. LinkedIn pixel fires on /signup-success page = "conversion" event
 *
 * The URL https://softreset.school/welcome is the one you paste into
 * LinkedIn Campaign Manager as your ad destination.
 *
 * The URL https://softreset.school/signup-success is the one you set as
 * your Conversion URL in LinkedIn Campaign Manager → Conversions.
 */

export function Welcome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Persist UTM params for attribution
  useEffect(() => {
    const utm: Record<string, string> = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => {
      const val = searchParams.get(key);
      if (val) utm[key] = val;
    });
    if (Object.keys(utm).length > 0) {
      sessionStorage.setItem('med_utm', JSON.stringify(utm));
    }
  }, [searchParams]);

  // If already logged in, send to dashboard
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-2xl) var(--space-lg)' }}>
      <SEO
        title="Welcome — start coding from bed"
        description="A coding school built for chronic illness. Short, resumable lessons, no streak penalties, ship real AI tools — all content free, pay only for a €99 Credential when you're ready."
        canonical="/welcome"
      />
      {/* Hero */}
      <section style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
        <span style={{
          display: 'inline-block',
          background: 'var(--accent)',
          color: 'var(--bg-void)',
          padding: '4px 14px',
          borderRadius: 20,
          fontSize: '0.8125rem',
          fontWeight: 600,
          marginBottom: 'var(--space-md)',
          letterSpacing: '0.02em',
        }}>
          Free to start — no card required
        </span>
        <h1 style={{ fontSize: '2.5rem', lineHeight: 1.15, marginBottom: 'var(--space-md)' }}>
          Code from Bed.<br />
          <span style={{ color: 'var(--accent)' }}>Build with AI. Ship Real Tools.</span>
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto var(--space-lg)' }}>
          Learn Claude API, prompt engineering, AI agents, and tool-building.
          4 tracks, 190+ hands-on exercises, AI-powered feedback,
          and verifiable certificates you can share on LinkedIn.
        </p>
        <div className="hero-cta" style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/signup"
            className="btn btn-primary btn-lg"
            style={{ fontSize: '1.1rem', padding: '16px 40px' }}
          >
            Start Learning Free
          </Link>
          <Link
            to="/pricing"
            className="btn btn-secondary btn-lg"
            style={{ fontSize: '1.1rem', padding: '16px 40px' }}
          >
            View Pricing
          </Link>
        </div>
      </section>

      {/* Social proof */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 'var(--space-lg)',
        textAlign: 'center',
        margin: 'var(--space-2xl) 0',
        padding: 'var(--space-xl) 0',
        borderTop: '1px solid var(--bg-border)',
        borderBottom: '1px solid var(--bg-border)',
      }} className="grid-4">
        {[
          { num: '4', label: 'Career Tracks' },
          { num: '190+', label: 'Exercises' },
          { num: '97', label: 'Lessons' },
          { num: '100%', label: 'Online' },
        ].map((s) => (
          <div key={s.label}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>{s.num}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Tracks */}
      <section style={{ marginBottom: 'var(--space-2xl)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>Choose Your Track</h2>
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
          {[
            { icon: '🛏️', title: 'Code from Bed', desc: 'Variables, functions, and your first web app — built with Claude. Zero to deployed.' },
            { icon: '🤖', title: 'AI Literacy for Humans', desc: 'How LLMs work, prompt engineering, Claude API, hallucinations, and ethics.' },
            { icon: '⚡', title: 'Build Cool Tools Fast', desc: 'CLI tools, web apps, APIs, Stripe integration — ship in days, not months.' },
            { icon: '🚀', title: 'AI Agents that Work', desc: 'Tool use, memory, planning, multi-step reasoning. Deploy agents to production.' },
          ].map((track) => (
            <div key={track.title} style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)',
              borderRadius: 12,
              padding: 'var(--space-xl)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>{track.icon}</div>
              <h3 style={{ marginBottom: 'var(--space-sm)', fontSize: '1.1rem' }}>{track.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{track.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Student discount callout */}
      <section style={{
        background: 'var(--bg-elevated)',
        border: '2px solid var(--accent)',
        borderRadius: 12,
        padding: 'var(--space-xl)',
        textAlign: 'center',
        marginBottom: 'var(--space-2xl)',
      }}>
        <h3 style={{ marginBottom: 'var(--space-sm)' }}>Money is not the gate</h3>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Every lesson is free to read. If you want the credential and €99 isn't
          possible right now, ask for a hardship code. No reason needed and nobody
          reviews your situation. Many people here left education or work because they
          got ill; that is exactly who this is for.
        </p>
      </section>

      {/* Final CTA */}
      <section style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
        <h2 style={{ marginBottom: 'var(--space-md)' }}>Ready to Start?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
          Every lesson in every track is free to read. No credit card needed.
        </p>
        <Link
          to="/signup"
          className="btn btn-primary btn-lg"
          style={{ fontSize: '1.1rem', padding: '16px 48px' }}
        >
          Create Free Account
        </Link>
      </section>
    </div>
  );
}
