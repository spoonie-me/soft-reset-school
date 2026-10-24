import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { GamificationPanel } from '@/components/GamificationPanel';
import { Badge } from '@/components/Badge';
import { LoadingSpinner } from '@/components/ProtectedRoute';
import { learningApi, type TrackDetailResponse, type GamificationResponse } from '@/lib/api';
import { IS_DEV_MODE } from '@/lib/useApi';
import { LearningPathModal } from '@/components/LearningPathModal';
import { SEO } from '@/components/SEO';
import { usePurchaseUnlock } from '@/lib/usePurchaseUnlock';

/* ─── Track metadata (not in DB — static config) ─── */
const TRACK_META: Record<string, { title: string; color: string }> = {
  fundamentals: { title: '🛏️ Code from Bed', color: 'var(--signal)' },
  ai: { title: '🤖 AI Literacy for Humans', color: 'var(--rust)' },
  tools: { title: '⚡ Build Cool Tools Fast', color: 'var(--gold)' },
  advanced: { title: '🚀 AI Agents that Work', color: 'var(--crystal)' },
  'ai-orchestrated-dev': { title: '🧭 AI-Assisted Software Development', color: 'var(--rust)' },
  'ai-workflow-consulting': { title: '⚙️ AI Automation Consulting', color: 'var(--gold)' },
  'ai-oversight-health-informatics': { title: '🩺 AI-Augmented Medical Coding', color: 'var(--crystal)' },
  'accessibility-qa-lived-experience': { title: '♿ Digital Accessibility QA', color: 'var(--signal)' },
};

/* Foundation tracks are archived: hidden from the public site and no longer sold.
 * Learners who already started one still see it so their progress isn't lost. */
const ARCHIVED_TRACKS = new Set(['fundamentals', 'ai', 'tools', 'advanced']);

/* ─── Types ─── */
interface DomainSummary {
  id: string;
  name: string;
  mastered: boolean;
  stars: number;
  progress: number;
}

interface TrackSummary {
  id: string;
  title: string;
  color: string;
  progress: number;
  domains: DomainSummary[];
  nextLessonId?: string;
  nextLessonTitle?: string;
  examReady: boolean;
}

/* ─── Demo data for dev mode ─── */
const DEMO_TRACKS: TrackSummary[] = [
  {
    id: 'fundamentals',
    title: '🛏️ Code from Bed',
    color: 'var(--signal)',
    progress: 28,
    nextLessonId: '3',
    nextLessonTitle: 'Your first app — variables & types',
    examReady: false,
    domains: [
      { id: 'getting-started', name: 'Getting Started', mastered: false, stars: 2, progress: 55 },
      { id: 'functions', name: 'Functions & Logic', mastered: false, stars: 1, progress: 30 },
      { id: 'projects', name: 'Building Real Projects', mastered: false, stars: 0, progress: 0 },
    ],
  },
];

const DEMO_GAMIFICATION = {
  totalXp: 1420,
  level: 3,
  daysLearned: 12,
  badges: [
    { label: 'First lesson', tier: 'bronze' as const },
    { label: '3 days in', tier: 'silver' as const },
    { label: '10 exercises', tier: 'bronze' as const },
  ],
};

/* ─── Star rendering ─── */
function MasteryStars({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <span aria-label={`${count} of ${max} mastery stars`} style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          style={{
            color: i < count ? 'var(--gold)' : 'var(--bg-border)',
            fontSize: '0.75rem',
          }}
          aria-hidden="true"
        >
          &#9733;
        </span>
      ))}
    </span>
  );
}

// Credential product value map for GA4 conversion events (one-time payments —
// see PRD.md §4.5, 2026-08-04. Subscription plan values retired.)
const CREDENTIAL_VALUES: Record<string, number> = {
  track_credential: 99,
  program_credential: 199, // 2-track bundles are €149; GA4 value is approximate
};

export function Dashboard() {
  const [tracks, setTracks] = useState<TrackSummary[]>(IS_DEV_MODE ? DEMO_TRACKS : []);
  const [showPathModal, setShowPathModal] = useState(
    () => !localStorage.getItem('bc_path_selected')
  );
  const [gamData, setGamData] = useState<GamificationResponse | null>(null);
  const [loading, setLoading] = useState(!IS_DEV_MODE);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Tracks just bought (from the Stripe return URL), kept before the URL is cleaned.
  const [boughtTracks] = useState<string[]>(() =>
    (searchParams.get('session_id')?.startsWith('cs_') ? (searchParams.get('tracks') ?? '') : '')
      .split(',')
      .filter((t) => /^[a-z0-9-]+$/.test(t)),
  );
  const unlock = usePurchaseUnlock(boughtTracks);

  // Fire GA4 conversion when landing from Stripe checkout success
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const credential = searchParams.get('credential') ?? 'track_credential';
    if (!sessionId?.startsWith('cs_')) return;

    const g = (window as any).gtag;
    if (typeof g === 'function') {
      const value = CREDENTIAL_VALUES[credential] ?? 99;
      const transaction_id = `${credential}_${sessionId.slice(-8)}`;
      g('event', 'conversion', {
        send_to: 'AW-18029452931/UiPjCJWPqowcEIO9jpVD',
        value,
        currency: 'EUR',
        transaction_id,
      });
      g('event', 'purchase', {
        currency: 'EUR',
        value,
        transaction_id,
        items: [{ item_id: credential, item_name: credential, item_category: 'credential', price: value, quantity: 1 }],
      });
    }

    // Clean session_id from URL without reload
    const params = new URLSearchParams(searchParams);
    params.delete('session_id');
    params.delete('credential');
    params.delete('tracks');
    navigate({ search: params.toString() }, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (IS_DEV_MODE) return;

    async function load() {
      try {
        const [tracksRes, gamRes] = await Promise.all([
          learningApi.getTracks(),
          learningApi.getGamification().catch(() => null),
        ]);

        const trackSummaries = await Promise.all(
          tracksRes.tracks.map(async (t) => {
            const meta = TRACK_META[t.trackId] ?? { title: t.trackId, color: 'var(--signal)' };
            try {
              const detail: TrackDetailResponse = await learningApi.getTrack(t.trackId);
              const domains: DomainSummary[] = detail.domains.map((d) => {
                const m = detail.domainMastery[d.id];
                return {
                  id: d.id,
                  name: d.name,
                  mastered: m?.isMastered ?? false,
                  stars: m?.stars ?? 0,
                  progress: m?.score ?? 0,
                };
              });

              const overallProgress =
                domains.length > 0
                  ? Math.round(domains.reduce((s, d) => s + d.progress, 0) / domains.length)
                  : 0;
              const allMastered = domains.length > 0 && domains.every((d) => d.mastered);

              return {
                id: t.trackId,
                title: meta.title,
                color: meta.color,
                progress: overallProgress,
                domains,
                examReady: allMastered,
              } as TrackSummary;
            } catch {
              return {
                id: t.trackId,
                title: meta.title,
                color: meta.color,
                progress: 0,
                domains: [],
                examReady: false,
              } as TrackSummary;
            }
          }),
        );

        // Career tracks first; an archived track only appears if the learner has progress in it.
        const visible = trackSummaries
          .filter((t) => !ARCHIVED_TRACKS.has(t.id) || t.progress > 0 || t.domains.some((d) => d.progress > 0))
          .sort((a, b) => Number(ARCHIVED_TRACKS.has(a.id)) - Number(ARCHIVED_TRACKS.has(b.id)));
        setTracks(visible);
        if (gamRes) setGamData(gamRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        setTracks(DEMO_TRACKS);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const gamificationForPanel = IS_DEV_MODE
    ? DEMO_GAMIFICATION
    : gamData
      ? {
          totalXp: gamData.totalXp,
          level: gamData.level,
          xpProgress: gamData.xpProgress,
          daysLearned: gamData.daysLearned,
          recentBadges: gamData.recentBadges,
        }
      : { totalXp: 0, level: 1, daysLearned: 0, recentBadges: [] };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4xl)' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <SEO title="Your Dashboard" description="Continue your Soft Reset School training. Track progress, resume lessons, and earn certifications." noIndex />
      <LearningPathModal isOpen={showPathModal} onClose={() => setShowPathModal(false)} />
      <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-sm)' }}>Your Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>
        Pick up where you left off.
      </p>

      {unlock !== 'idle' && (
        <div
          role="status"
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            background: unlock === 'unlocked' ? 'rgba(90,158,106,0.08)' : 'var(--bg-surface)',
            border: `1px solid ${unlock === 'unlocked' ? 'var(--success)' : 'var(--bg-border)'}`,
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.9375rem',
            marginBottom: 'var(--space-xl)',
          }}
        >
          {unlock === 'waiting' && 'Payment received. Unlocking your track now. This usually takes a few seconds.'}
          {unlock === 'unlocked' && 'Your track is unlocked. Every lesson, the exam and the certificate are yours. No deadline.'}
          {unlock === 'slow' && (
            <>
              Payment received, but unlocking is taking longer than usual. Reload this page in a minute. If it is still locked, write to{' '}
              <a href="mailto:hi@softreset.school" style={{ color: 'var(--signal)' }}>hi@softreset.school</a> with your receipt and I will sort it out.
            </>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            background: 'rgba(196,107,58,0.08)',
            border: '1px solid var(--warning)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--warning)',
            fontSize: '0.875rem',
            marginBottom: 'var(--space-xl)',
          }}
        >
          {error} (showing demo data)
        </div>
      )}

      <div
        className="grid-sidebar"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 300px',
          gap: 'var(--space-2xl)',
          alignItems: 'start',
        }}
      >
        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
          {tracks.map((track) => {
            return (
            <Card key={track.id}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-lg)',
                }}
              >
                <div>
                  <div style={{ width: 32, height: 3, background: track.color, borderRadius: 2, marginBottom: 'var(--space-sm)' }} />
                  <Link to={`/track/${track.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 style={{ fontSize: '1.125rem' }}>{track.title}</h3>
                  </Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  {track.progress > 0 && <Badge label={`${track.progress}%`} tier="silver" size="sm" />}
                  {track.examReady && (
                    <Link to={`/exam/${track.id}`}>
                      <Badge label="Exam ready" tier="gold" size="sm" />
                    </Link>
                  )}
                </div>
              </div>

              <ProgressBar value={track.progress} color={track.color} showLabel />

              {track.nextLessonId && (
                <Link
                  to={`/lesson/${track.nextLessonId}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    marginTop: 'var(--space-lg)',
                    padding: 'var(--space-md) var(--space-lg)',
                    background: 'var(--bg-elevated)',
                    border: `1px solid ${track.color}`,
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ color: track.color, fontSize: '1rem' }}>&#9654;</span>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.6875rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Continue
                    </span>
                    <span style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                      {track.nextLessonTitle}
                    </span>
                  </div>
                </Link>
              )}

              {track.domains.length > 0 && (
                <div style={{ marginTop: 'var(--space-xl)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 'var(--space-sm)' }}>
                  {track.domains.map((domain) => (
                    <Link
                      key={domain.id}
                      to={`/track/${track.id}#${domain.id}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--space-sm) var(--space-md)',
                        background: domain.mastered ? 'var(--bg-elevated)' : 'transparent',
                        border: '1px solid var(--bg-border)',
                        borderRadius: 'var(--radius-md)',
                        textDecoration: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', minWidth: 0 }}>
                        <span style={{ color: domain.mastered ? 'var(--success)' : domain.progress > 0 ? track.color : 'var(--text-tertiary)', fontSize: '0.875rem', flexShrink: 0 }}>
                          {domain.mastered ? '\u2713' : domain.progress > 0 ? '\u25CF' : '\u25CB'}
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {domain.name}
                        </span>
                      </div>
                      <MasteryStars count={domain.stars} />
                    </Link>
                  ))}
                </div>
              )}
            </Card>
            );
          })}
        </div>

        <aside aria-label="Your progress" style={{ position: 'sticky', top: 80 }}>
          <GamificationPanel data={gamificationForPanel} />
        </aside>
      </div>
    </div>
  );
}
