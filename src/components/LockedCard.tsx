import { Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { getCatalogTrack } from '@/data/trackCatalog';
import { TRACK_PRICE, COURSE_PRICE, COURSE_TRACK_PRICE } from '@/data/pricing';
import { courseCopy, COURSE_COPY } from '@/data/pricingCopy';
import { getCourse } from '@/data/courseCatalog';

const COPY = {
  lesson: { title: 'This lesson is part of the full track', what: 'every lesson, the exam and the certificate' },
  exam: { title: 'The exam comes with the track', what: 'every lesson, this exam and the certificate' },
  assessment: { title: 'Module assessments come with the track', what: 'every lesson, the assessments, the exam and the certificate' },
} as const;

interface LockedCardProps {
  what: keyof typeof COPY;
  trackId?: string;
  /** Slug of the course the locked page belongs to. Sent by the API while courses are on. */
  courseSlug?: string | null;
}

/** Shown when the API says a page needs a track purchase. Replaces falling back
 * to demo content, which made a locked page look like a working one. */
export function LockedCard({ what, trackId, courseSlug }: LockedCardProps) {
  const track = getCatalogTrack(trackId || undefined);
  const copy = COPY[what];
  const cc = courseCopy();
  if (cc) return <CourseLockedCard what={what} trackTitle={track?.title} trackSlug={track?.slug} courseSlug={courseSlug} />;
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

/** The same card while courses are on: the lesson offers its own course, the exam offers the track. */
function CourseLockedCard({ what, trackTitle, trackSlug, courseSlug }: {
  what: keyof typeof COPY;
  trackTitle?: string;
  trackSlug?: string;
  courseSlug?: string | null;
}) {
  const course = getCourse(courseSlug ?? undefined);
  const trackLink = trackSlug ? `/tracks/${trackSlug}` : '/courses';
  const trackName = trackTitle ?? 'The whole track';
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <Card style={{ padding: 'var(--space-2xl)' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)' }}>{what === 'lesson' ? COURSE_COPY.lockedLesson : what === 'exam' ? COURSE_COPY.lockedExam : COURSE_COPY.lockedAssessment}</h1>
        {what === 'exam' ? (
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
            {trackName} is €{COURSE_TRACK_PRICE} once. You get all its courses, the exam and the certificate. No subscription, no renewal.
          </p>
        ) : (
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
            {COURSE_COPY.lockedFreeLine}{' '}
            {course ? `${course.title} is €${COURSE_PRICE} once.` : `A course is €${COURSE_PRICE} once.`}{' '}
            {trackName} is €{COURSE_TRACK_PRICE} once, with the exam and the certificate. No subscription, no renewal.
          </p>
        )}
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: 'var(--space-xl)' }}>
          Can't afford it? You can ask for a hardship code. No reason needed.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          {what !== 'exam' && (
            <Link to={course ? `/courses/${course.slug}` : '/courses'}>
              <Button variant="primary">{course ? `Buy this course: ${course.title}` : 'Buy this course'}</Button>
            </Link>
          )}
          <Link to={trackLink}>
            <Button variant={what === 'exam' ? 'primary' : 'secondary'}>See the whole track</Button>
          </Link>
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
