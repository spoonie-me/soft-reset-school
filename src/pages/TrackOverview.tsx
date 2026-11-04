import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { ProgressBar } from '@/components/ProgressBar';
import { LoadingSpinner } from '@/components/ProtectedRoute';
import { ExamAlignment } from '@/components/ExamAlignment';
import { learningApi, type TrackDetailResponse, type DomainModulesResponse } from '@/lib/api';
import { IS_DEV_MODE } from '@/lib/useApi';

/* ─── Track metadata ─── */
const TRACK_META: Record<string, { title: string; description: string; color: string }> = {
  fundamentals: {
    title: '🛏️ Code from Bed',
    description: 'Learn to code with Claude. Build real projects. No pants required.',
    color: 'var(--signal)',
  },
  ai: {
    title: '🤖 AI Literacy for Humans',
    description: 'Understand what AI actually does. Master prompting. Think like an AI nerd.',
    color: 'var(--rust)',
  },
  tools: {
    title: '⚡ Build Cool Tools Fast',
    description: 'Make tools that save you hours. Ship in days. Get paid eventually.',
    color: 'var(--gold)',
  },
  advanced: {
    title: '🚀 AI Agents that Work',
    description: 'Create agents that code, research, debug. The future starts now.',
    color: 'var(--crystal)',
  },
  'ai-orchestrated-dev': {
    title: '🧭 AI-Assisted Software Development',
    description: 'Direct AI tools well enough that your energy envelope stops setting your ceiling.',
    color: 'var(--rust)',
  },
  'ai-workflow-consulting': {
    title: '⚙️ AI Automation Consulting',
    description: 'Design and audit where AI actually belongs in a real process — and where it doesn\'t.',
    color: 'var(--gold)',
  },
  'ai-oversight-health-informatics': {
    title: '🩺 AI-Augmented Medical Coding',
    description: 'Expert-level review and exception-handling for AI-generated clinical code — not entry-level data entry.',
    color: 'var(--crystal)',
  },
  'accessibility-qa-lived-experience': {
    title: '♿ Digital Accessibility QA',
    description: 'Review grounded in WCAG standards and what assistive-tech users actually experience.',
    color: 'var(--signal)',
  },
};

/* ─── Types ─── */
interface ModuleView {
  id: string;
  title: string;
  bloomLevel: string;
  tier: string;
  locked: boolean;
  lessonCount: number;
  completedLessons: number;
}

interface DomainView {
  id: string;
  name: string;
  description: string;
  masteryLevel: number;
  modules: ModuleView[];
}

/* ─── Helpers ─── */
const tierBadgeMap: Record<string, 'bronze' | 'silver' | 'gold'> = {
  foundation: 'bronze',
  application: 'silver',
  mastery: 'gold',
  Foundation: 'bronze',
  Application: 'silver',
  Mastery: 'gold',
};

function MasteryStars({ level, max = 5 }: { level: number; max?: number }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-xs)' }} aria-label={`Mastery ${level} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ fontSize: '1rem', color: i < level ? 'var(--gold)' : 'var(--bg-border)' }}>{'\u2605'}</span>
      ))}
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

/* ─── Demo data ─── */
const DEMO_DOMAINS: DomainView[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Learn the fundamentals — what code is, variables, types, and your first working program.',
    masteryLevel: 3,
    modules: [
      { id: 'gs-fundamentals', title: 'Code Basics & Variables', bloomLevel: 'Understand', tier: 'Foundation', locked: false, lessonCount: 6, completedLessons: 6 },
      { id: 'gs-functions', title: 'Functions & Control Flow', bloomLevel: 'Apply', tier: 'Application', locked: false, lessonCount: 5, completedLessons: 3 },
      { id: 'gs-debugging', title: 'Debugging & Problem Solving', bloomLevel: 'Evaluate', tier: 'Mastery', locked: true, lessonCount: 4, completedLessons: 0 },
    ],
  },
  {
    id: 'building-projects',
    name: 'Building Projects',
    description: 'Put it all together — build, ship, and deploy your first real web app.',
    masteryLevel: 1,
    modules: [
      { id: 'bp-first-app', title: 'Your First Web App', bloomLevel: 'Apply', tier: 'Foundation', locked: false, lessonCount: 5, completedLessons: 2 },
      { id: 'bp-ship-it', title: 'Deploy & Share', bloomLevel: 'Create', tier: 'Application', locked: true, lessonCount: 6, completedLessons: 0 },
    ],
  },
];

export function TrackOverview() {
  const { trackId } = useParams<{ trackId: string }>();
  const track = TRACK_META[trackId ?? 'fundamentals'] ?? {
    title: trackId ?? 'Unknown Track',
    description: '',
    color: 'var(--signal)',
  };

  const [domains, setDomains] = useState<DomainView[]>(IS_DEV_MODE ? DEMO_DOMAINS : []);
  const [overallProgress, setOverallProgress] = useState(IS_DEV_MODE ? 42 : 0);
  const [loading, setLoading] = useState(!IS_DEV_MODE);

  useEffect(() => {
    if (IS_DEV_MODE) return;

    async function load() {
      try {
        const detail: TrackDetailResponse = await learningApi.getTrack(trackId ?? 'fundamentals');

        // For each domain, fetch modules with progress
        const domainViews = await Promise.all(
          detail.domains.map(async (d) => {
            const mastery = detail.domainMastery[d.id];
            try {
              const modRes: DomainModulesResponse = await learningApi.getModules(d.id);
              const modules: ModuleView[] = modRes.modules.map((m, i) => {
                // Tier-based locking: foundation always open, application needs 70%, mastery needs 75%
                const isFoundation = m.tier.toLowerCase() === 'foundation';
                const prevModule = i > 0 ? modRes.modules[i - 1] : null;
                const prevProgress = prevModule?.progress
                  ? (prevModule.progress.completedLessons / Math.max(1, prevModule.progress.totalLessons)) * 100
                  : 0;
                const locked = !isFoundation && prevProgress < 70;

                return {
                  id: m.id,
                  title: m.title,
                  bloomLevel: m.bloomLevel,
                  tier: m.tier,
                  locked,
                  lessonCount: m.progress?.totalLessons ?? m.lessonCount,
                  completedLessons: m.progress?.completedLessons ?? 0,
                };
              });

              return {
                id: d.id,
                name: d.name,
                description: d.description,
                masteryLevel: mastery?.stars ?? 0,
                modules,
              };
            } catch {
              return {
                id: d.id,
                name: d.name,
                description: d.description,
                masteryLevel: mastery?.stars ?? 0,
                modules: d.modules.map((m) => ({
                  id: m.id,
                  title: m.title,
                  bloomLevel: '',
                  tier: m.tier,
                  locked: false,
                  lessonCount: 0,
                  completedLessons: 0,
                })),
              };
            }
          }),
        );

        setDomains(domainViews);

        // Calculate overall progress from mastery scores
        const scores = Object.values(detail.domainMastery);
        const avg = scores.length > 0 ? Math.round(scores.reduce((s, m) => s + m.score, 0) / scores.length) : 0;
        setOverallProgress(avg);
      } catch {
        setDomains(DEMO_DOMAINS);
        setOverallProgress(42);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [trackId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4xl)' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      {/* Track header */}
      <div style={{ marginBottom: 'var(--space-3xl)' }}>
        <div style={{ width: 48, height: 4, background: track.color, borderRadius: 2, marginBottom: 'var(--space-md)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-sm)' }}>{track.title}</h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 640 }}>{track.description}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-sm)', minWidth: 180 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Overall progress
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: track.color }}>
              {overallProgress}%
            </span>
            <div style={{ width: 180 }}>
              <ProgressBar value={overallProgress} color={track.color} />
            </div>
          </div>
        </div>
      </div>

      {/* Domains grid */}
      <div style={{ display: 'grid', gap: 'var(--space-2xl)' }} id="domains-grid">
        {domains.map((domain) => {
          const domainProgress =
            domain.modules.reduce((sum, m) => sum + m.completedLessons, 0) /
            Math.max(1, domain.modules.reduce((sum, m) => sum + m.lessonCount, 0)) *
            100;

          return (
            <Card key={domain.id} id={domain.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                  <h2 style={{ fontSize: '1.25rem' }}>{domain.name}</h2>
                  {domain.modules.length > 0 && <MasteryStars level={domain.masteryLevel} />}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: 'var(--space-md)' }}>
                  {domain.description}
                </p>
                {domain.modules.length > 0 && <ProgressBar value={domainProgress} color={track.color} showLabel />}
              </div>

              {domain.modules.length === 0 ? (
                <div style={{ padding: 'var(--space-lg)', background: 'var(--bg-elevated)', border: '1px dashed var(--bg-border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                    Lessons for this domain are still being written — check back soon.
                  </p>
                </div>
              ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {domain.modules.map((mod) => {
                  const moduleProgress = mod.lessonCount > 0 ? (mod.completedLessons / mod.lessonCount) * 100 : 0;
                  const isComplete = mod.completedLessons === mod.lessonCount && mod.lessonCount > 0;
                  const hasStarted = mod.completedLessons > 0;

                  return (
                    <div
                      key={mod.id}
                      style={{
                        padding: 'var(--space-lg)',
                        background: mod.locked ? 'var(--bg-void)' : 'var(--bg-elevated)',
                        border: '1px solid var(--bg-border)',
                        borderRadius: 'var(--radius-md)',
                                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                          {mod.locked ? <LockIcon /> : <UnlockIcon />}
                          <span style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', fontWeight: 500 }}>{mod.title}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                          {mod.bloomLevel && <Badge label={mod.bloomLevel} tier="crystal" size="sm" />}
                          <Badge label={mod.tier} tier={tierBadgeMap[mod.tier] ?? 'bronze'} size="sm" />
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-display)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                          {mod.completedLessons}/{mod.lessonCount} lessons
                        </span>
                        <ProgressBar value={moduleProgress} color={isComplete ? 'var(--success)' : track.color} height={6} />
                      </div>

                      {!mod.locked && (
                        <Link to={`/module/${mod.id}`} style={{ textDecoration: 'none' }}>
                          <Button variant={hasStarted ? 'primary' : 'secondary'} size="sm" style={{ width: '100%' }}>
                            {isComplete ? 'Review' : hasStarted ? 'Continue' : 'Start'}
                          </Button>
                        </Link>
                      )}
                      {mod.locked && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}>
                          Complete previous tier to unlock
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Exam alignment */}
      <ExamAlignment trackId={trackId ?? 'fundamentals'} />
    </div>
  );
}
