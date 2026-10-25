import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SEO } from '@/components/SEO';

const CARRY_OVER = [
  { icon: '🗣️', skill: 'Self-advocacy', from: 'You already know how to name what you need and ask for it clearly.', to: 'Same skill, new use: telling us when a lesson\'s too much, or asking for the accommodation you need to keep going.' },
  { icon: '🔋', skill: 'Pacing & spoon budgeting', from: 'You already track energy and plan around it instead of ignoring it.', to: 'Bedcoders lessons are built in short, single-sitting chunks for exactly this reason — no lesson assumes a full-energy day.' },
  { icon: '🩺', skill: 'Reading your own patterns', from: 'You know how to notice what a bad day looks like before it becomes a crash.', to: 'Use that same noticing here: pause before you\'re out of spoons, not after.' },
];

export function FromSpooniversity() {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).trackEvent) {
      (window as any).trackEvent('from_spooniversity_view');
    }
  }, []);

  return (
    <div style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 800, margin: '0 auto' }}>
      <SEO title="Coming from Spooniversity — Bedcoders" description="A short bridge for Spooniversity students starting Bedcoders." noIndex />

      <div style={{ textAlign: 'center', marginBottom: 'var(--space-3xl)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-lg)' }}>🛏️→💻</div>
        <h1 style={{ marginBottom: 'var(--space-lg)' }}>You're not starting from zero</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: 600, margin: '0 auto' }}>
          Everything Spooniversity taught you about advocating for yourself and pacing around a chronic illness is exactly the skillset Bedcoders is built around. This isn't a cold start — it's the same pacing model, pointed at a technical track.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-lg)', marginBottom: 'var(--space-3xl)' }}>
        {CARRY_OVER.map((c) => (
          <Card key={c.skill} style={{ padding: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{c.icon}</span>
              <div>
                <h4 style={{ marginBottom: 'var(--space-sm)', fontSize: '0.9375rem' }}>{c.skill}</h4>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-xs)' }}>{c.from}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{c.to}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 'var(--space-3xl)', padding: 'var(--space-2xl)', background: 'var(--bg-elevated)' }}>
        <h3 style={{ marginBottom: 'var(--space-lg)' }}>What's different here</h3>
        <ul style={{ display: 'grid', gap: 'var(--space-md)' }}>
          {[
            'Spooniversity built your self-advocacy and system-navigation skills. Bedcoders is the technical track — coding, AI literacy, the Claude API, agents.',
            'Same crash-day-kind rules: cancel any month, your progress waits, no streak penalties.',
            'Start with one free lesson in any track before deciding anything.',
          ].map((item) => (
            <li key={item} style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span> {item}
            </li>
          ))}
        </ul>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
        <Link to="/signup" style={{ textDecoration: 'none' }}>
          <Button variant="primary" style={{ width: '100%' }}>Start your free lesson</Button>
        </Link>
        <Link to="/outcomes" style={{ textDecoration: 'none' }}>
          <Button variant="secondary" style={{ width: '100%' }}>See where it leads</Button>
        </Link>
      </div>

      <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
        Not ready for a technical track? That's fine — Spooniversity's non-technical tracks (self-advocacy, energy management, remote work skills, peer facilitation) are still there.{' '}
        <a href="https://spooniversity.org" target="_blank" rel="noopener" style={{ color: 'var(--signal)' }}>Back to Spooniversity ↗</a>
      </p>
    </div>
  );
}
