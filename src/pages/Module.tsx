import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { ProgressBar } from '@/components/ProgressBar';
import { LoadingSpinner } from '@/components/ProtectedRoute';
import { learningApi, type ModuleDetailResponse } from '@/lib/api';
import { IS_DEV_MODE } from '@/lib/useApi';
import { getCatalogTrack } from '@/data/trackCatalog';

/* ─── Types ─── */
interface LessonItem {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  order: number;
  status: 'completed' | 'in_progress' | 'not_started';
  /** Needs the full track. Only lesson 1 of each track is a free trial. */
  locked?: boolean;
}

interface ModuleView {
  id: string;
  title: string;
  description: string;
  tier: string;
  bloomLevel: string;
  domainName: string;
  trackId: string;
  trackTitle: string;
  lessons: LessonItem[];
  assessmentId: string | null;
  assessmentTitle: string | null;
}

/* ─── Tier badge mapping ─── */
const tierBadgeMap: Record<string, 'bronze' | 'silver' | 'gold'> = {
  foundation: 'bronze', Foundation: 'bronze',
  application: 'silver', Application: 'silver',
  mastery: 'gold', Mastery: 'gold',
};

/* ─── Difficulty colors ─── */
const difficultyColor: Record<string, string> = {
  beginner: 'var(--success)',
  intermediate: 'var(--gold)',
  advanced: 'var(--rust)',
};

/* ─── Status icon ─── */
function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') {
    return <span style={{ color: 'var(--success)', fontSize: '1.125rem', lineHeight: 1 }}>&#10003;</span>;
  }
  if (status === 'in_progress') {
    return <span style={{ color: 'var(--signal)', fontSize: '0.875rem' }}>&#9654;</span>;
  }
  return <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>&#9675;</span>;
}

/* ─── Demo data ─── */
const DEMO_MODULE: ModuleView = {
  id: 'getting-started',
  title: 'Getting Started with Code',
  description: 'Learn the fundamentals of coding — variables, types, and your first working program.',
  tier: 'Foundation',
  bloomLevel: 'Understand',
  domainName: 'Getting Started',
  trackId: 'fundamentals',
  trackTitle: '🛏️ Code from Bed',
  lessons: [
    { id: 'lesson-gs-1', title: 'What is code?', description: 'How code works and why Claude makes it easier than ever to learn.', duration: 12, difficulty: 'beginner', order: 1, status: 'completed' },
    { id: 'lesson-gs-2', title: 'Variables & types', description: 'Storing and working with data — numbers, strings, booleans.', duration: 15, difficulty: 'beginner', order: 2, status: 'completed' },
    { id: 'lesson-gs-3', title: 'Your first program', description: 'Write and run your first working code from scratch.', duration: 14, difficulty: 'beginner', order: 3, status: 'completed' },
    { id: 'lesson-gs-4', title: 'Control flow', description: 'If/else, loops, and making your code make decisions.', duration: 18, difficulty: 'beginner', order: 4, status: 'not_started' },
    { id: 'lesson-gs-5', title: 'Debugging with Claude', description: 'When code breaks: how to read errors and fix them fast.', duration: 16, difficulty: 'beginner', order: 5, status: 'not_started' },
  ],
  assessmentId: 'assess-gs',
  assessmentTitle: 'Getting Started Assessment',
};

export function Module() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [mod, setMod] = useState<ModuleView | null>(IS_DEV_MODE ? DEMO_MODULE : null);
  const [loading, setLoading] = useState(!IS_DEV_MODE);

  useEffect(() => {
    if (IS_DEV_MODE) return;

    async function load() {
      try {
        const res: ModuleDetailResponse = await learningApi.getModule(moduleId ?? '');
        const m = res.module;

        setMod({
          id: m.id,
          title: m.title,
          description: m.description,
          tier: m.tier,
          bloomLevel: m.bloomLevel,
          domainName: m.domain?.name ?? '',
          trackId: m.domain?.trackId ?? 'fundamentals',
          trackTitle: getCatalogTrack(m.domain?.trackId ?? undefined)?.title ?? m.domain?.trackTitle ?? '',
          lessons: m.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            description: l.description,
            duration: l.duration,
            difficulty: l.difficulty,
            order: l.order,
            status: (l.progress?.status as 'completed' | 'in_progress') ?? 'not_started',
            locked: !!l.locked,
          })),
          assessmentId: m.assessment?.id ?? null,
          assessmentTitle: m.assessment?.title ?? null,
        });
      } catch {
        setMod(DEMO_MODULE);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [moduleId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4xl)' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!mod) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Module not found.</p>
      </div>
    );
  }

  const completedCount = mod.lessons.filter((l) => l.status === 'completed').length;
  const progress = mod.lessons.length > 0 ? (completedCount / mod.lessons.length) * 100 : 0;
  const totalDuration = mod.lessons.reduce((sum, l) => sum + l.duration, 0);
  const allComplete = completedCount === mod.lessons.length && mod.lessons.length > 0;

  // Find first incomplete lesson for "Continue" action
  const nextLesson = mod.lessons.find((l) => l.status !== 'completed');
  const nextLocked = !!nextLesson?.locked;
  const trackSlug = mod.trackId;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: 'var(--space-xl)', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
        <Link to={`/track/${mod.trackId}`} style={{ color: 'var(--signal)', textDecoration: 'none' }}>
          {mod.trackTitle || mod.trackId}
        </Link>
        <span style={{ margin: '0 var(--space-sm)' }}>/</span>
        <span>{mod.domainName}</span>
        <span style={{ margin: '0 var(--space-sm)' }}>/</span>
        <span style={{ color: 'var(--text-secondary)' }}>{mod.title}</span>
      </nav>

      {/* Module header */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.5rem', marginRight: 'var(--space-sm)' }}>{mod.title}</h1>
          {mod.bloomLevel && <Badge label={mod.bloomLevel} tier="crystal" size="sm" />}
          <Badge label={mod.tier} tier={tierBadgeMap[mod.tier] ?? 'bronze'} size="sm" />
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-lg)' }}>{mod.description}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}>
            {completedCount}/{mod.lessons.length} lessons
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}>
            ~{totalDuration} min
          </span>
        </div>
        <ProgressBar value={progress} color={allComplete ? 'var(--success)' : 'var(--signal)'} showLabel />
      </div>

      {/* Continue / Start button */}
      {nextLesson && !nextLocked && (
        <Link to={`/lesson/${nextLesson.id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 'var(--space-2xl)' }}>
          <Button variant="primary" size="lg" style={{ width: '100%' }}>
            {completedCount > 0 ? 'Continue' : 'Start module'} &mdash; {nextLesson.title}
          </Button>
        </Link>
      )}
      {nextLocked && (
        <Link to={`/tracks/${trackSlug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 'var(--space-2xl)' }}>
          <Button variant="primary" size="lg" style={{ width: '100%' }}>
            Unlock the full track to keep going
          </Button>
        </Link>
      )}

      {/* Lesson list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {mod.lessons.map((lesson, i) => (
          <Link
            key={lesson.id}
            to={`/lesson/${lesson.id}`}
            style={{ textDecoration: 'none' }}
          >
            <Card
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-lg)',
                padding: 'var(--space-lg)',
                cursor: 'pointer',
                borderColor: lesson.status === 'in_progress' ? 'var(--signal)' : undefined,
                transition: 'border-color 0.15s ease',
              }}
            >
              {/* Lesson number + status */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-xs)', minWidth: 32 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <StatusIcon status={lesson.status} />
              </div>

              {/* Lesson info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', fontWeight: 500, marginBottom: 'var(--space-xs)' }}>
                  {lesson.title}
                </p>
                <p style={{
                  color: 'var(--text-tertiary)',
                  fontSize: '0.8125rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {lesson.description}
                </p>
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexShrink: 0 }}>
                <span style={{
                  fontSize: '0.6875rem',
                  fontFamily: 'var(--font-display)',
                  color: difficultyColor[lesson.difficulty] ?? 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  {lesson.difficulty}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}>
                  {lesson.duration} min
                </span>
                {lesson.locked && (
                  <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-display)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', border: '1px solid var(--bg-border)', borderRadius: 4, padding: '2px 6px' }}>
                    Full track
                  </span>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Assessment section */}
      {mod.assessmentId && (
        <div style={{ marginTop: 'var(--space-2xl)', borderTop: '1px solid var(--bg-border)', paddingTop: 'var(--space-2xl)' }}>
          <Card style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: 'var(--space-2xl)',
            borderColor: allComplete ? 'var(--gold)' : 'var(--bg-border)',
          }}>
            <div style={{ width: 40, height: 4, background: 'var(--gold)', borderRadius: 2, marginBottom: 'var(--space-lg)' }} />
            <h3 style={{ marginBottom: 'var(--space-sm)' }}>Module Assessment</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)', maxWidth: 500 }}>
              {allComplete
                ? 'You\'ve completed all lessons. Test your understanding with the module assessment.'
                : `Complete all ${mod.lessons.length} lessons to unlock the assessment.`}
            </p>
            {allComplete ? (
              <Link to={`/assessment/${mod.id}`}>
                <Button variant="primary">Take assessment</Button>
              </Link>
            ) : (
              <Button variant="secondary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                {completedCount}/{mod.lessons.length} lessons completed
              </Button>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
