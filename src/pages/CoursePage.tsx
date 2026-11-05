import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SEO, breadcrumbLd } from '@/components/SEO';
import { CourseCheckoutDialog } from '@/components/CourseCheckoutDialog';
import { getCourse, coursesOfTrack } from '@/data/courseCatalog';
import { courseSeo, courseJsonLd } from '@/data/courseSeo';
import { COURSE_COPY } from '@/data/pricingCopy';
import { getCatalogTrack } from '@/data/trackCatalog';
import { COURSE_PRICE, COURSE_TRACK_PRICE } from '@/data/pricing';
import { coursesEnabled } from '@/lib/flags';
import { buildDate } from '@/lib/buildDate';

const focusRing = 'course-focus';
const linkStyle = { color: 'var(--signal)', textDecoration: 'underline', textUnderlineOffset: '2px' } as const;

export function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const [confirming, setConfirming] = useState(false);

  if (!coursesEnabled()) return <Navigate to="/tracks" replace />;
  const course = getCourse(slug);
  if (!course) return <Navigate to="/courses" replace />;

  const track = getCatalogTrack(course.trackId);
  const trackTitle = track?.title ?? course.trackId;
  const others = coursesOfTrack(course.trackId).filter((c) => c.slug !== course.slug);
  const seo = courseSeo(course);
  const updated = buildDate();
  const path = `/courses/${course.slug}`;

  return (
    <div>
      <style>{`.${focusRing}:focus-visible { outline: 3px solid var(--signal); outline-offset: 3px; }`}</style>
      <SEO
        title={seo.title}
        description={seo.description}
        canonical={path}
        jsonLd={[
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Courses', path: '/courses' },
            { name: course.title, path },
          ]),
          courseJsonLd(course),
        ]}
      />

      <section style={{ padding: 'var(--space-4xl) var(--space-xl) var(--space-2xl)', maxWidth: 720, margin: '0 auto' }}>
        <p style={{ marginBottom: 'var(--space-md)', fontSize: '0.9375rem' }}>
          <Link to="/courses" className={focusRing} style={linkStyle}>All courses</Link>
          {' · '}
          <Link to={`/tracks/${course.trackId}`} className={focusRing} style={linkStyle}>{trackTitle}</Link>
        </p>
        <h1 style={{ fontSize: 'clamp(1.75rem, 6vw, 2.5rem)', marginBottom: 'var(--space-lg)', lineHeight: 1.12 }}>{course.title}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: 'var(--space-md)' }}>{course.blurb}</p>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', fontFamily: 'var(--font-display)' }}>
          {course.modules.length} modules · {course.lessonCount} lessons
        </p>
      </section>

      <section aria-labelledby="buy-heading" style={{ padding: '0 var(--space-xl) var(--space-2xl)', maxWidth: 720, margin: '0 auto' }}>
        <Card style={{ borderColor: 'var(--signal)' }}>
          <h2 id="buy-heading" style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xs)' }}>€{COURSE_PRICE}, once</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            {COURSE_COPY.freeLesson} {COURSE_COPY.noSubscription}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <Button variant="primary" size="lg" onClick={() => setConfirming(true)}>
              Buy this course for €{COURSE_PRICE}
            </Button>
            <Link to={`/lesson/${course.firstLessonId}`} className={focusRing}>
              <Button variant="secondary" size="lg" tabIndex={-1}>Try the first lesson free</Button>
            </Link>
          </div>
        </Card>
      </section>

      <section aria-labelledby="inside-heading" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 id="inside-heading" style={{ marginBottom: 'var(--space-lg)' }}>What is inside</h2>
          <ol style={{ margin: 0, paddingLeft: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {course.modules.map((m) => (
              <li key={m.title}>
                <span style={{ fontWeight: 600 }}>{m.title}</span>
                <span style={{ color: 'var(--text-tertiary)' }}> ({m.lessonCount} {m.lessonCount === 1 ? 'lesson' : 'lessons'})</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-md)' }}>What you get</h2>
        <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-xl)', marginBottom: 'var(--space-2xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <li>Every lesson in this course, {course.lessonCount} in all.</li>
          <li>The practice exercises that sit inside the lessons.</li>
          <li>Progress that is saved, so you can stop and come back.</li>
          <li>The first lesson free before you pay anything.</li>
        </ul>
        <h2 style={{ marginBottom: 'var(--space-md)' }}>What you do not get</h2>
        <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-xl)', marginBottom: 'var(--space-2xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <li>No exam and no certificate. {COURSE_COPY.certificateNote}</li>
          <li>No promise of a job or an income. This is practice, not a guarantee.</li>
          <li>No lessons from the other courses of the track.</li>
        </ul>
        <h2 style={{ marginBottom: 'var(--space-md)' }}>Not for you if</h2>
        <p style={{ color: 'var(--text-secondary)' }}>If you want a graded exam and a certificate, buy the whole track.</p>
      </section>

      <section aria-labelledby="track-heading" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 id="track-heading" style={{ marginBottom: 'var(--space-md)' }}>Or take the whole track for €{COURSE_TRACK_PRICE}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            {trackTitle} has {others.length + 1} courses. The whole track is €{COURSE_TRACK_PRICE}, once. You get all of them, the track exam and the certificate.
          </p>
          <p style={{ marginBottom: 'var(--space-xl)' }}>
            <Link to={`/tracks/${course.trackId}`} className={focusRing} style={linkStyle}>See the whole track</Link>
          </p>
          <h3 style={{ fontSize: '1.0625rem', marginBottom: 'var(--space-sm)' }}>Other courses in this track</h3>
          <ul style={{ paddingLeft: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            {others.map((c) => (
              <li key={c.slug}>
                <Link to={`/courses/${c.slug}`} className={focusRing} style={linkStyle}>{c.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section style={{ padding: 'var(--space-2xl) var(--space-xl) var(--space-4xl)', maxWidth: 720, margin: '0 auto' }}>
        {updated && <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Last updated {updated}.</p>}
      </section>

      {confirming && (
        <CourseCheckoutDialog
          courseKeys={[course.domainKey]}
          summary={`${course.title} for €${COURSE_PRICE}.`}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
