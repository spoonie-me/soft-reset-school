import { Link, Navigate, useParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SEO, breadcrumbLd } from '@/components/SEO';
import { getCatalogTrack, credentialAvailable } from '@/data/trackCatalog';
import { lessonsUntilCredential } from '@/data/credentialBar';

export function TrackInfo() {
  const { slug } = useParams<{ slug: string }>();
  const track = getCatalogTrack(slug);

  if (!track) return <Navigate to="/tracks" replace />;

  const isCareer = track.kind === 'career';
  const sellable = credentialAvailable(track);

  return (
    <div>
      <SEO
        title={`${track.title} — what's inside the track`}
        description={`${track.pitch} Full curriculum outline, who it's for, and the credential exam — every lesson free to read, no account needed.`}
        canonical={`/tracks/${track.slug}`}
        jsonLd={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Tracks', path: '/tracks' },
          { name: track.title, path: `/tracks/${track.slug}` },
        ])}
      />

      {/* Hero */}
      <section style={{ padding: 'var(--space-4xl) var(--space-xl)', maxWidth: 720, margin: '0 auto' }}>
        <p style={{ color: track.color, fontFamily: 'var(--font-display)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {isCareer ? 'career track — the reintegration path' : 'foundation track'}
        </p>
        <div style={{ fontSize: 'clamp(1.75rem, 6vw, 2.5rem)', marginBottom: 'var(--space-md)' }} aria-hidden="true">{track.emoji}</div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-xl)', lineHeight: 1.12 }}>{track.title}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: 'var(--space-2xl)' }}>
          {track.pitch}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <Link to="/signup"><Button variant="primary" size="lg">Start learning free</Button></Link>
          <Link to="/pricing"><Button variant="secondary" size="lg">See pricing</Button></Link>
        </div>
      </section>

      {/* Who this is for */}
      <section style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-lg)' }}>who this is for</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem' }}>{track.whoFor}</p>
        </div>
      </section>

      {/* The job this leads to — career tracks only */}
      {isCareer && track.jobItLeadsTo && (
        <section style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-lg)' }}>the job this leads to</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem' }}>{track.jobItLeadsTo}</p>
        </section>
      )}

      {/* Curriculum outline */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-sm)' }}>what you'll learn</h2>
          {track.curriculumNote && (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9375rem', marginBottom: 'var(--space-xl)' }}>
              {track.curriculumNote}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', marginTop: track.curriculumNote ? 0 : 'var(--space-xl)' }}>
            {track.domains.map((domain, i) => (
              <div
                key={domain.name}
                style={{ display: 'flex', gap: 'var(--space-lg)' }}
              >
                <span style={{ color: track.color, fontFamily: 'var(--font-display)', fontSize: '0.875rem', marginTop: 3, flexShrink: 0, width: 24 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h4 style={{ marginBottom: 'var(--space-xs)' }}>
                    {domain.name}
                    {domain.inDevelopment && (
                      <span style={{ marginLeft: 'var(--space-sm)', fontSize: '0.6875rem', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', border: '1px solid var(--bg-border)', borderRadius: 4, padding: '2px 6px', verticalAlign: 'middle' }}>
                        in development
                      </span>
                    )}
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{domain.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exam & credential */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-xl)' }}>the exam & credential</h2>
        {sellable ? (
          <Card style={{ borderColor: track.color }}>
            <div style={{ width: 32, height: 3, background: track.color, borderRadius: 2, marginBottom: 'var(--space-lg)' }} />
            <p style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 500, marginBottom: 4 }}>
              €99 <span style={{ fontSize: '0.9375rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>once — no subscription, no renewal, ever · 2 tracks €149, 3 tracks €199</span>
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-xs)', fontFamily: 'var(--font-display)' }}>
              {track.lessonCount} lesson{track.lessonCount === 1 ? '' : 's'} · ~{track.totalMinutes} min total
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-lg)', fontFamily: 'var(--font-display)' }}>
              {track.exam.questionCount} exam question{track.exam.questionCount === 1 ? '' : 's'}
              {track.exam.openEndedCount ? ` (${track.exam.openEndedCount} open-ended, AI-graded)` : ''}
              {' '}· {track.exam.timeLimitMinutes} minutes · {track.exam.passScore}% to pass
            </p>
            {track.exam.drawsFullBank && (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-lg)' }}>
                Honest disclosure: this exam draws its full question count from the same practice bank you'll
                have already worked through — it's a knowledge check on what you practiced, not a novel test.
                A short break is required between a failed attempt and a retry.
              </p>
            )}
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-md)' }}>
              Every lesson in this track is free to read first — you sit the exam only when you feel ready, with
              no deadline and no re-purchase. Passing earns a certificate: proof of practiced skill, not a
              promise of a job, that you can share on LinkedIn and employers can verify. See{' '}
              <Link to="/imprint" style={{ color: 'var(--signal)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>what the certificate does and doesn't claim</Link>, including what happens to it if this school ever
              stops operating.
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
              Can't afford €99? Ask for a hardship code, no reason needed. Details on the{' '}
              <Link to="/pricing#hardship" style={{ color: 'var(--signal)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>pricing page</Link>.
            </p>
          </Card>
        ) : (
          <Card style={{ borderColor: 'var(--bg-border)' }}>
            <div style={{ width: 32, height: 3, background: 'var(--text-tertiary)', borderRadius: 2, marginBottom: 'var(--space-lg)' }} />
            <p style={{ fontSize: '1.0625rem', fontWeight: 500, marginBottom: 'var(--space-sm)' }}>
              No credential yet — this track is still too new to sell.
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-lg)', fontFamily: 'var(--font-display)' }}>
              {track.lessonCount} lesson{track.lessonCount === 1 ? '' : 's'} published so far · ~{track.totalMinutes} min total ·
              {' '}needs at least {lessonsUntilCredential(track)} more lesson{lessonsUntilCredential(track) === 1 ? '' : 's'} before a
              {' '}credential would be honest
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              Every lesson here is free to read right now, same as every other track. We just won't sell a
              certificate for a curriculum this thin — the credential opens on its own, automatically, once
              there's enough here to back it up. No code change needed, and no early-access price either: one
              price for everyone, when it's ready.
            </p>
          </Card>
        )}
      </section>

      {/* CTA */}
      <section style={{ padding: 'var(--space-2xl) var(--space-xl) var(--space-4xl)', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>read it all free. pay only when you're ready to prove it.</h2>
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-xl)' }}>
          <Link to="/signup"><Button variant="primary" size="lg">Start learning free</Button></Link>
          <Link to="/pricing"><Button variant="secondary" size="lg">See pricing</Button></Link>
        </div>
        <Link to="/tracks" style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
          &larr; all tracks
        </Link>
      </section>
    </div>
  );
}
