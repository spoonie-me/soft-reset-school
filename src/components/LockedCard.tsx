import { Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { getCatalogTrack } from '@/data/trackCatalog';
import { TRACK_PRICE } from '@/data/pricing';

const COPY = {
  lesson: { title: 'This lesson is part of the full track', what: 'every lesson, the exam and the certificate' },
  exam: { title: 'The exam comes with the track', what: 'every lesson, this exam and the certificate' },
  assessment: { title: 'Module assessments come with the track', what: 'every lesson, the assessments, the exam and the certificate' },
} as const;

interface LockedCardProps {
  what: keyof typeof COPY;
  trackId?: string;
}

/** Shown when the API says a page needs a track purchase. Replaces falling back
 * to demo content, which made a locked page look like a working one. */
export function LockedCard({ what, trackId }: LockedCardProps) {
  const track = getCatalogTrack(trackId || undefined);
  const copy = COPY[what];
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <Card style={{ padding: 'var(--space-2xl)' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)' }}>{copy.title}</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          The first lesson of every track is a free trial. {track ? `${track.title} is` : 'The track is'} €{TRACK_PRICE} once,
          for {copy.what}. No subscription, no renewal.
        </p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: 'var(--space-xl)' }}>
          Can't afford it? You can ask for a hardship code. No reason needed.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <Link to={track ? `/tracks/${track.slug}` : '/pricing'}><Button variant="primary">See the track</Button></Link>
          <Link to="/pricing#hardship"><Button variant="secondary">Ask for a hardship code</Button></Link>
        </div>
      </Card>
    </div>
  );
}

/** Shown when a page could not load for any other reason. Never demo content. */
export function LoadFailedCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <Card style={{ padding: 'var(--space-2xl)' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)' }}>This didn't load</h1>
        <p role="alert" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
          Something went wrong on our side or your connection dropped. Nothing is lost. Try again in a moment.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={onRetry}>Try again</Button>
          <Link to="/dashboard"><Button variant="secondary">Back to dashboard</Button></Link>
        </div>
      </Card>
    </div>
  );
}
