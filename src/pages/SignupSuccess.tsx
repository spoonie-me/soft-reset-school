import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CATALOG_TRACKS } from '@/data/trackCatalog';

/**
 * /signup-success — Post-signup conversion page.
 *
 * This is the URL you paste into LinkedIn Campaign Manager → Conversions
 * as your "URL-based conversion" trigger.
 *
 * URL: https://softreset.school/signup-success
 */

export function SignupSuccess() {
  useEffect(() => {
    // Fire LinkedIn conversion event (if Insight Tag is loaded)
    if (typeof window !== 'undefined' && (window as any).lintrk) {
      (window as any).lintrk('track', { conversion_id: 'signup' });
    }
  }, []);

  return (
    <div style={{
      maxWidth: 600,
      margin: '0 auto',
      padding: 'var(--space-2xl) var(--space-lg)',
      textAlign: 'center',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)' }} aria-hidden="true">🎉</div>
      <h1 style={{ marginBottom: 'var(--space-md)' }}>You're in.</h1>
      <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
        Your account is set up. Lesson 1 of every track is yours to try, for as long as you want.
        Nothing will bill you, and nothing expires.
      </p>
      <p style={{ fontSize: '0.9375rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-lg)' }}>
        Start with lesson 1 of whichever track you are curious about. You can try the others later.
      </p>
      <ul style={{ listStyle: 'none', margin: '0 auto var(--space-xl)', padding: 0, display: 'grid', gap: 'var(--space-sm)', maxWidth: 420 }}>
        {CATALOG_TRACKS.filter((t) => t.kind === 'career' && t.trialLessonId).map((t) => (
          <li key={t.slug}>
            <Link
              to={`/lesson/${t.trialLessonId}`}
              className="btn btn-secondary"
              style={{ display: 'block', minHeight: 48, padding: '12px 20px' }}
            >
              <span aria-hidden="true">{t.emoji} </span>Start lesson 1: {t.title}
            </Link>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          to="/tracks"
          className="btn btn-primary btn-lg"
          style={{ fontSize: '1.1rem', padding: '16px 40px' }}
        >
          Browse all tracks
        </Link>
        <Link
          to="/dashboard"
          className="btn btn-secondary btn-lg"
          style={{ fontSize: '1.1rem', padding: '16px 40px' }}
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
