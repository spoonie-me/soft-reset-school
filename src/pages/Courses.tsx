import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SEO, breadcrumbLd } from '@/components/SEO';
import { CourseCheckoutDialog } from '@/components/CourseCheckoutDialog';
import { peekCourseCart, clearCourseCart } from '@/lib/courseCart';
import { COURSE_CATALOG, coursesOfTrack, type CatalogCourse } from '@/data/courseCatalog';
import { COURSES_SEO } from '@/data/courseSeo';
import { COURSE_COPY } from '@/data/pricingCopy';
import { getCatalogTrack } from '@/data/trackCatalog';
import { COURSE_PRICE, COURSE_BUNDLE_3_PRICE, COURSE_BUNDLE_SIZE, COURSE_TRACK_PRICE } from '@/data/pricing';
import { coursesEnabled } from '@/lib/flags';

const TRACK_ORDER = ['ai-orchestrated-dev', 'ai-workflow-consulting', 'accessibility-qa-lived-experience'];

const focusRing = 'courses-focus';

function CourseCard({
  course,
  picking,
  checked,
  disabled,
  onToggle,
}: {
  course: CatalogCourse;
  picking: boolean;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', borderColor: checked ? 'var(--signal)' : undefined }}>
      <h3 style={{ fontSize: '1.0625rem', marginBottom: 'var(--space-sm)' }}>
        <Link to={`/courses/${course.slug}`} className={focusRing} style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'var(--bg-border)', textUnderlineOffset: '3px' }}>
          {course.title}
        </Link>
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-md)', flex: 1 }}>{course.blurb}</p>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-md)', fontFamily: 'var(--font-display)' }}>
        {course.modules.length} modules · {course.lessonCount} lessons · €{COURSE_PRICE}
      </p>
      {picking && (
        <label
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', minHeight: 44,
            fontSize: '0.9375rem', cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={onToggle}
            style={{ width: 20, height: 20, accentColor: 'var(--signal)' }}
          />
          Pick {course.title}
        </label>
      )}
    </Card>
  );
}

export function Courses() {
  // A logged-out buyer's picks come back after login.
  const [restored] = useState(() => peekCourseCart().filter((k) => COURSE_CATALOG.some((c) => c.domainKey === k)).slice(0, COURSE_BUNDLE_SIZE));
  const [picking, setPicking] = useState(restored.length > 1);
  const [selected, setSelected] = useState<string[]>(restored.length > 1 ? restored : []);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => { clearCourseCart(); }, []);

  if (!coursesEnabled()) return <Navigate to="/tracks" replace />;

  const byKey = new Map(COURSE_CATALOG.map((c) => [c.domainKey, c]));
  const chosen = selected.map((k) => byKey.get(k)).filter((c): c is CatalogCourse => !!c);
  const full = selected.length >= COURSE_BUNDLE_SIZE;
  const ready = selected.length === COURSE_BUNDLE_SIZE;
  const remaining = COURSE_BUNDLE_SIZE - selected.length;

  function toggle(key: string) {
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= COURSE_BUNDLE_SIZE) return prev;
      return [...prev, key];
    });
  }

  function stopPicking() {
    setPicking(false);
    setSelected([]);
  }

  const tracks = TRACK_ORDER.filter((t) => coursesOfTrack(t).length > 0);

  return (
    <div style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 1000, margin: '0 auto' }}>
      <style>{`.${focusRing}:focus-visible { outline: 3px solid var(--signal); outline-offset: 3px; }`}</style>
      <SEO
        title={COURSES_SEO.title}
        description={COURSES_SEO.description}
        canonical="/courses"
        jsonLd={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Courses', path: '/courses' },
        ])}
      />

      <div style={{ marginBottom: 'var(--space-2xl)', maxWidth: 680 }}>
        <h1 style={{ marginBottom: 'var(--space-lg)' }}>Courses</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', marginBottom: 'var(--space-md)' }}>
          Every track is six short courses. Buy the one you need.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', marginBottom: 'var(--space-md)' }}>{COURSE_COPY.priceLine}</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem' }}>
          {COURSE_COPY.freeLesson} {COURSE_COPY.noSubscription}
        </p>
      </div>

      <Card style={{ marginBottom: 'var(--space-3xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-sm)' }}>Pick 3 for €{COURSE_BUNDLE_3_PRICE}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
          Choose any 3 courses from any track. They cost €{COURSE_BUNDLE_3_PRICE} together instead of €{COURSE_PRICE * COURSE_BUNDLE_SIZE}.
        </p>
        {!picking ? (
          <Button variant="primary" onClick={() => setPicking(true)}>
            Pick 3 courses
          </Button>
        ) : (
          <div>
            <div role="status" aria-live="polite" style={{ marginBottom: 'var(--space-lg)' }}>
              <p style={{ fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
                {selected.length} of {COURSE_BUNDLE_SIZE} picked
              </p>
              {chosen.length > 0 ? (
                <ul style={{ margin: '0 0 var(--space-sm)', paddingLeft: 'var(--space-lg)', color: 'var(--text-secondary)' }}>
                  {chosen.map((c) => (
                    <li key={c.domainKey}>{c.title}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>Nothing picked yet.</p>
              )}
              <p style={{ color: 'var(--text-secondary)' }}>
                {ready
                  ? `Price: €${COURSE_BUNDLE_3_PRICE} for these 3.`
                  : `Price: €${COURSE_BUNDLE_3_PRICE} once you pick ${remaining} more.`}
              </p>
              {full && (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: 'var(--space-xs)' }}>
                  That is 3. Untick one to change your pick.
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
              <Button variant="primary" disabled={!ready} onClick={() => setConfirming(true)}>
                {ready ? `Buy these 3 for €${COURSE_BUNDLE_3_PRICE}` : `Pick ${remaining} more`}
              </Button>
              <Button variant="secondary" onClick={stopPicking}>Stop picking</Button>
            </div>
          </div>
        )}
      </Card>

      {tracks.map((trackId) => {
        const track = getCatalogTrack(trackId);
        const list = coursesOfTrack(trackId);
        const headingId = `track-${trackId}`;
        return (
          <section key={trackId} aria-labelledby={headingId} style={{ marginBottom: 'var(--space-3xl)' }}>
            <h2 id={headingId} style={{ marginBottom: 'var(--space-sm)' }}>{track?.title ?? trackId}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', maxWidth: 680 }}>
              {list.length} courses. The whole track is €{COURSE_TRACK_PRICE} and includes the exam and the certificate.{' '}
              <Link to={`/tracks/${trackId}`} className={focusRing} style={{ color: 'var(--signal)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                See the track
              </Link>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
              {list.map((course) => {
                const isChecked = selected.includes(course.domainKey);
                return (
                  <CourseCard
                    key={course.slug}
                    course={course}
                    picking={picking}
                    checked={isChecked}
                    disabled={!isChecked && full}
                    onToggle={() => toggle(course.domainKey)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {confirming && ready && (
        <CourseCheckoutDialog
          courseKeys={selected}
          summary={`3 courses for €${COURSE_BUNDLE_3_PRICE}: ${chosen.map((c) => c.title).join(', ')}.`}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
