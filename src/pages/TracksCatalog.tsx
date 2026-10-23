import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SEO, breadcrumbLd } from '@/components/SEO';
import {
  CAREER_CATALOG_TRACKS,
  type CatalogTrack,
} from '@/data/trackCatalog';

function TrackCard({ track }: { track: CatalogTrack }) {
  return (
    <Link to={`/tracks/${track.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
      <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 40, height: 4, background: track.color, borderRadius: 2, marginBottom: 'var(--space-lg)' }} />
        <h3 style={{ color: track.color, marginBottom: 'var(--space-md)', fontSize: '1.125rem' }}>
          {track.emoji} {track.title}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-lg)', flex: 1 }}>
          {track.pitch}
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-md)', fontFamily: 'var(--font-display)' }}>
          {track.domains.length} curriculum areas · exam: {track.exam.questionCount} questions in {track.exam.timeLimitMinutes} min
        </p>
        <span style={{ color: track.color, fontSize: '0.875rem', fontFamily: 'var(--font-display)' }}>
          see what's inside &rarr;
        </span>
      </Card>
    </Link>
  );
}

export function TracksCatalog() {
  return (
    <div style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 1000, margin: '0 auto' }}>
      <SEO
        title="Tracks — see what's inside before you sign up"
        description="All 4 Soft Reset School career tracks, open to read before you create an account. Every lesson is free — pay once, only for the credential (€99 per track, 2 for €149, 3 for €199)."
        canonical="/tracks"
        jsonLd={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Tracks', path: '/tracks' },
        ])}
      />

      {/* Header */}
      <div style={{ marginBottom: 'var(--space-3xl)', maxWidth: 680 }}>
        <p style={{ color: 'var(--signal)', fontFamily: 'var(--font-display)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          the full catalog
        </p>
        <h1 style={{ marginBottom: 'var(--space-lg)' }}>see what's inside every track — before you sign up</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem' }}>
          Four tracks, all free to read, forever. Each page below shows the full curriculum outline, who the
          track is for, and exactly what the credential exam involves — no account needed to look around.
        </p>
      </div>

      {/* Career tracks */}
      <h2 style={{ marginBottom: 'var(--space-sm)' }}>career tracks — the reintegration path</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)', maxWidth: 640 }}>
        Each one maps to a role a bed- or home-bound person can actually be hired — or bill clients — for.
        Young, focused curricula that are still growing; every lesson is free to read before you pay anything.
      </p>
      <div className="grid-2" style={{ marginBottom: 'var(--space-3xl)' }}>
        {CAREER_CATALOG_TRACKS.map((track) => (
          <TrackCard key={track.slug} track={track} />
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', borderTop: '1px solid var(--bg-border)', paddingTop: 'var(--space-2xl)' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
          Every lesson free. No card. Pay once, only when you're ready for the credential.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/signup"><Button variant="primary" size="lg">Start learning free</Button></Link>
          <Link to="/pricing"><Button variant="secondary" size="lg">See pricing</Button></Link>
        </div>
      </div>
    </div>
  );
}
