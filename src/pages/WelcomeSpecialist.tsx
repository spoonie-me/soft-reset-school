import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SEO } from '@/components/SEO';

export function WelcomeSpecialist() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const track = searchParams.get('track') || 'fundamentals';

  const trackNames: Record<string, string> = {
    fundamentals: '🛏️ Code from Bed',
    ai: '🤖 AI Literacy for Humans',
    tools: '⚡ Build Cool Tools Fast',
    advanced: '🚀 AI Agents that Work',
  };

  const trackName = trackNames[track] || track;

  // Track page view
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).trackEvent) {
      (window as any).trackEvent('welcome_specialist_view', { track });
    }
  }, [track]);

  return (
    <div style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 800, margin: '0 auto' }}>
      <SEO title="Welcome — Bedcoders Specialist" description="You're in." noIndex />
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>✓</div>
        <h1 style={{ marginBottom: 'var(--space-lg)', color: 'var(--success)' }}>Welcome, Specialist</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: 600, margin: '0 auto' }}>
          Your lifetime enrollment to <strong>{trackName}</strong> is now active. You own this track forever — no expiry, no recurring fees.
        </p>
      </div>

      {/* What you get */}
      <Card style={{ marginBottom: 'var(--space-3xl)', padding: 'var(--space-2xl)' }}>
        <h3 style={{ marginBottom: 'var(--space-lg)' }}>What's included in your enrollment</h3>
        <ul style={{ display: 'grid', gap: 'var(--space-md)' }}>
          {[
            { icon: '📚', label: '50+ lessons', desc: 'Master every module at your pace' },
            { icon: '✍️', label: '200+ exercises', desc: 'AI-graded feedback on every submission' },
            { icon: '🎓', label: 'Certification exam', desc: 'Verify your mastery with a certificate' },
            { icon: '🌀', label: 'Crash-day kind', desc: 'Cancel any month, your progress waits. No streak penalties.' },
            { icon: '🔄', label: 'Always current', desc: 'Curriculum updates included while subscribed' },
          ].map((item) => (
            <li key={item.label} style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>{item.label}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* CTA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-3xl)' }}>
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <Button variant="primary" style={{ width: '100%' }}>Go to dashboard</Button>
        </Link>
        <Link to={`/track/${track}`} style={{ textDecoration: 'none' }}>
          <Button variant="secondary" style={{ width: '100%' }}>Start learning</Button>
        </Link>
      </div>

      {/* Reassurance */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-2xl)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 'var(--space-md)' }}>
          Your lifetime enrollment means you can learn at your own pace, come back anytime, and revisit material whenever you need it. Your certificate, once earned, is yours forever.
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
          Questions? Contact <a href="mailto:hi@softreset.school" style={{ color: 'var(--signal)' }}>hi@softreset.school</a>
        </p>
      </div>

      {/* If user not logged in */}
      {!user && (
        <div style={{ marginTop: 'var(--space-3xl)', textAlign: 'center', padding: 'var(--space-2xl)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            Please sign in or create an account to access your enrollment.
          </p>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button variant="primary">Sign in</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
