import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SEO } from '@/components/SEO';

const TRACKS = [
  { id: 'fundamentals', name: 'Code from Bed', icon: '🛏️' },
  { id: 'ai', name: 'AI Literacy', icon: '🤖' },
  { id: 'tools', name: 'Build Cool Tools', icon: '⚡' },
  { id: 'advanced', name: 'AI Agents', icon: '🚀' },
];

export function WelcomeArchitect() {
  const { user } = useAuth();

  // Track page view
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).trackEvent) {
      (window as any).trackEvent('welcome_architect_view');
    }
  }, []);

  return (
    <div style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 1000, margin: '0 auto' }}>
      <SEO title="Welcome — Bedcoders Architect" description="All four tracks unlocked." noIndex />
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>✓</div>
        <h1 style={{ marginBottom: 'var(--space-lg)', color: 'var(--success)' }}>Welcome, Architect</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: 700, margin: '0 auto' }}>
          Your lifetime enrollment to all 4 tracks is now active. You have complete career mastery access — forever. No expiry, no recurring fees.
        </p>
      </div>

      {/* All tracks available */}
      <div style={{ marginBottom: 'var(--space-3xl)' }}>
        <h3 style={{ textAlign: 'center', marginBottom: 'var(--space-lg)', color: 'var(--text-secondary)' }}>Your complete toolkit</h3>
        <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
          {TRACKS.map((track) => (
            <Card key={track.id} style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>{track.icon}</div>
              <h4 style={{ marginBottom: 'var(--space-sm)' }}>{track.name}</h4>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-lg)' }}>
                97 lessons · 190+ exercises
              </p>
              <Link to={`/track/${track.id}`} style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="sm" style={{ width: '100%' }}>Start</Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {/* What you get */}
      <Card style={{ marginBottom: 'var(--space-3xl)', padding: 'var(--space-2xl)' }}>
        <h3 style={{ marginBottom: 'var(--space-lg)' }}>Your complete enrollment includes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
          {[
            { icon: '📚', label: '97 lessons', desc: 'Comprehensive curriculum across all 4 tracks' },
            { icon: '✍️', label: '190+ exercises', desc: 'AI-graded feedback, progressive difficulty' },
            { icon: '🎓', label: '4 certification exams', desc: 'Earn credentials in each track' },
            { icon: '🌀', label: 'Crash-day kind', desc: 'Cancel any month, your progress waits. No streak penalties.' },
            { icon: '🔄', label: 'Always current', desc: 'New material and tracks included while subscribed' },
            { icon: '💼', label: 'Career portfolio', desc: 'Showcase your full credentials' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>{item.label}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* CTA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-3xl)' }}>
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <Button variant="primary" style={{ width: '100%' }}>Go to dashboard</Button>
        </Link>
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <Button variant="secondary" style={{ width: '100%' }}>Explore all tracks</Button>
        </Link>
      </div>

      {/* Reassurance */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-2xl)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 'var(--space-md)' }}>
          As an Architect, you own the complete suite. Learn the modules that interest you first, then circle back to others whenever you're ready. Your 4 certificates, once earned, are yours forever. This is your lifetime investment in your builder career.
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
