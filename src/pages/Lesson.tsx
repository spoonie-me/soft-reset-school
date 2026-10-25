import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Markdown from 'react-markdown';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { ExerciseRenderer, type ExerciseData, type ExerciseType } from '@/components/exercises/ExerciseRenderer';
import { LoadingSpinner } from '@/components/ProtectedRoute';
import { learningApi, ApiError, type LessonDetailResponse } from '@/lib/api';
import { getCatalogTrack } from '@/data/trackCatalog';
import { TRACK_PRICE } from '@/data/pricing';
import { LockedCard, LoadFailedCard } from '@/components/LockedCard';
import { IS_DEV_MODE } from '@/lib/useApi';
import { SEO } from '@/components/SEO';
import { markdownComponents } from '@/components/lesson-templates/markdownComponents';
import {
  ConceptFlow, type ConceptFlowProps,
  DiagnoseMechanism, type DiagnoseMechanismProps,
  SpotFlaw, type SpotFlawProps,
  SequenceIt, type SequenceItProps,
  BuildIt, type BuildItProps,
  EvidenceStack, type EvidenceStackProps,
  PredictNumber, type PredictNumberProps,
  PromptBuild, type PromptBuildProps,
} from '@/components/lesson-templates/GuessFirstTemplates';
import {
  WorkedExample, type WorkedExampleProps,
  RetrievalCheck, type RetrievalCheckProps,
  CaseSim, type CaseSimProps,
  LabBrief, type LabBriefProps,
} from '@/components/lesson-templates/DepthTemplates';
import { ScreenReaderSim, type ScreenReaderSimProps } from '@/components/lesson-templates/ScreenReaderSim';
import { ListenBar } from '@/components/ListenBar';
import { lessonSpeechChunks } from '@/lib/speech';

/* ─── Types for lesson content ─── */
interface TextSection { type: 'text'; body: string }
interface CalloutSection { type: 'callout'; variant: 'info' | 'warning' | 'tip' | 'example'; body: string }
interface ExerciseSection { type: 'exercise'; exerciseRef: string }
interface HookSection { type: 'hook'; body: string }
interface TakeawaySection { type: 'takeaway'; body: string }
interface PodHeaderSection { type: 'pod-header'; title: string; podNumber: number; duration: number }
interface InteractiveGuessSection { type: 'interactive-guess'; question: string; answer: string; hint?: string }
/* ─── Guess-first template sections (see src/components/lesson-templates) ─── */
interface ConceptFlowSection extends ConceptFlowProps { type: 'concept-flow' }
interface DiagnoseMechanismSection extends DiagnoseMechanismProps { type: 'diagnose-mechanism' }
interface SpotFlawSection extends SpotFlawProps { type: 'spot-flaw' }
interface SequenceItSection extends SequenceItProps { type: 'sequence-it' }
interface BuildItSection extends BuildItProps { type: 'build-it' }
interface EvidenceStackSection extends EvidenceStackProps { type: 'evidence-stack' }
interface PredictNumberSection extends PredictNumberProps { type: 'predict-number' }
interface PromptBuildSection extends PromptBuildProps { type: 'prompt-build' }
/* ─── Depth template sections (see src/components/lesson-templates/DepthTemplates) ───
 * The four types the 100-hour architecture adds on top of the guess-first set:
 * faded worked examples, spaced retrieval checkpoints, branching case sims, and
 * staged applied labs. docs/CURRICULUM_ARCHITECTURE_100H.md §9 is the authoring
 * reference for all of them. */
interface WorkedExampleSection extends WorkedExampleProps { type: 'worked-example' }
interface RetrievalCheckSection extends RetrievalCheckProps { type: 'retrieval-check' }
interface CaseSimSection extends CaseSimProps { type: 'case-sim' }
interface LabBriefSection extends LabBriefProps { type: 'lab-brief' }
interface ScreenReaderSimSection extends ScreenReaderSimProps { type: 'screen-reader-sim' }
type ContentSection =
  | TextSection | CalloutSection | ExerciseSection | HookSection | TakeawaySection | PodHeaderSection | InteractiveGuessSection
  | ConceptFlowSection | DiagnoseMechanismSection | SpotFlawSection | SequenceItSection
  | BuildItSection | EvidenceStackSection | PredictNumberSection | PromptBuildSection
  | WorkedExampleSection | RetrievalCheckSection | CaseSimSection | LabBriefSection | ScreenReaderSimSection;

interface LessonView {
  id: string;
  moduleId: string;
  title: string;
  duration: number;
  order: number;
  learningObjectives: string[];
  contentSections: ContentSection[];
  trackId?: string;
  trackTitle: string;
  domainTitle: string;
  exercises: ExerciseData[];
  nextLessonId?: string;
  /** The next lesson needs the full track, so this lesson is the end of the free trial. */
  nextLessonLocked?: boolean;
  prevLessonId?: string;
}

/* Listen bar for one lesson: reads the text sections aloud and scrolls to each as it goes. */
function LessonListen({ lesson, sectionRefs }: { lesson: LessonView; sectionRefs: React.MutableRefObject<(HTMLElement | null)[]> }) {
  const chunks = useMemo(() => lessonSpeechChunks(lesson), [lesson]);
  const follow = useCallback(
    (idx: number) => {
      if (idx < 0) return;
      const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      sectionRefs.current[idx]?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    },
    [sectionRefs],
  );
  return <ListenBar chunks={chunks} lessonId={lesson.id} onSection={follow} />;
}

/* ─── Callout styling by variant ─── */
const CALLOUT_STYLES: Record<string, { border: string; bg: string; icon: string }> = {
  info: { border: 'var(--signal)', bg: 'rgba(240,240,236,0.05)', icon: '\u2139' },
  warning: { border: 'var(--warning)', bg: 'rgba(201,168,76,0.05)', icon: '\u26A0' },
  tip: { border: 'var(--success)', bg: 'rgba(90,158,106,0.05)', icon: '\uD83D\uDCA1' },
  example: { border: 'var(--rust)', bg: 'rgba(196,107,58,0.05)', icon: '\uD83D\uDCCB' },
};

/* ─── Interactive Guess Component ───
 * Accessibility: the reveal button meets the 48px minimum touch target,
 * and revealing moves focus onto the answer panel so a keyboard or
 * screen-reader user lands on the new content instead of on a button
 * that just left the DOM. The panel also carries a real "Answer" label:
 * the green wash and the ✓ glyph are aria-hidden decoration, so without
 * it a screen-reader user has nothing telling them the revealed prose is
 * the answer (WCAG 1.4.1 — never convey meaning by colour alone). */
function InteractiveGuess({ question, answer, hint }: { question: string; answer: string; hint?: string }) {
  const [revealed, setRevealed] = useState(false);
  const answerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (revealed) answerRef.current?.focus();
  }, [revealed]);

  return (
    <div style={{ border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--space-xl)' }}>
      <div style={{ background: 'rgba(201,168,76,0.07)', padding: 'var(--space-lg) var(--space-xl)', borderBottom: revealed ? '1px solid var(--bg-border)' : 'none' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.125rem', flexShrink: 0 }} aria-hidden="true">🤔</span>
          <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', fontWeight: 500, margin: '0 0 var(--space-md)' }}>{question}</p>
            {hint && !revealed && (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', fontStyle: 'italic', margin: '0 0 var(--space-md)' }}>Hint: {hint}</p>
            )}
            {!revealed && (
              <button
                onClick={() => setRevealed(true)}
                style={{ background: 'var(--gold)', color: 'var(--bg-void)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '12px 22px', minHeight: 48, fontSize: '0.875rem', fontFamily: 'var(--font-display)', fontWeight: 500, cursor: 'pointer' }}
              >
                Reveal answer →
              </button>
            )}
          </div>
        </div>
      </div>
      {revealed && (
        <div ref={answerRef} tabIndex={-1} style={{ outline: 'none', padding: 'var(--space-lg) var(--space-xl)', background: 'rgba(90,158,106,0.05)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.125rem', flexShrink: 0 }} aria-hidden="true">✓</span>
            <div aria-live="polite" style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
              <p style={{ margin: '0 0 var(--space-xs)', fontWeight: 600, color: 'var(--success)', fontFamily: 'var(--font-display)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Answer</p>
              <Markdown components={markdownComponents}>{answer}</Markdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Demo data ─── */
const DEMO_EXERCISES: ExerciseData[] = [
  {
    id: 'ex-demo-1',
    ref: 'FUNDAMENTALS-CODE-001',
    prompt: 'What is the primary purpose of code?',
    type: 'MULTIPLE_CHOICE',
    config: { options: [
      { text: 'To give computers something to do', correct: false },
      { text: 'To let humans communicate instructions to computers', correct: true },
      { text: 'To replace human thinking', correct: false },
      { text: 'To make websites look nice', correct: false },
    ]},
    hints: ['Think about who writes code and who reads it.'],
    explanation: 'Code is fundamentally a tool for human communication — we write it so other humans (and future us) can understand what a program does. The computer just executes it.',
    isKnowledgeCheck: true,
    xpReward: 10,
  },
];

const DEMO_LESSON: LessonView = {
  id: 'gs-l01',
  moduleId: 'gs-f1',
  title: 'What is Code?',
  duration: 15,
  order: 1,
  trackTitle: '🛏️ Code from Bed',
  domainTitle: 'Getting Started',
  learningObjectives: [
    'Define what code is in plain language',
    'Explain why the current moment (Claude era) is special for learning to code',
    'Describe what lazy coding means and why it\'s smart',
  ],
  exercises: DEMO_EXERCISES,
  contentSections: [
    { type: 'pod-header', title: 'Code is just instructions', podNumber: 1, duration: 5 },
    { type: 'hook', body: 'Every app on your phone — Instagram, Google Maps, your banking app — was written in code by humans who also occasionally forgot what they were doing and Googled "how to center a div". Code isn\'t magic. It\'s instructions.' },
    { type: 'text', body: '**Code** is a set of instructions you write for a computer. Think of it like a recipe:\n\n- A recipe tells a cook: "First add flour, then mix in eggs, then bake at 180°C."\n- Code tells a computer: "First ask the user for their name, then store it, then display it on screen."\n\nThe computer follows your instructions exactly. Which is both its superpower and its greatest limitation.' },
    { type: 'interactive-guess', question: 'Before we go further — who do you think code is actually written for: computers or humans?', answer: '**Humans.** Computers could run binary (1s and 0s) all day. Code exists so that *humans* can read, write, and reason about what a program does.', hint: 'Think about who needs to understand what the code does day-to-day.' },
    { type: 'takeaway', body: 'Code = instructions written by humans, for humans, that computers can also execute.' },
    { type: 'pod-header', title: 'The lazy coding mindset', podNumber: 2, duration: 5 },
    { type: 'text', body: '**Lazy coding isn\'t about cutting corners.** It\'s about not doing work a tool can do for you.\n\nIn the Claude era, this means:\n- Let Claude generate boilerplate code\n- You focus on *what* to build, Claude figures out *how*\n- Review, tweak, and ship\n\nYou\'re the architect. Claude is the construction crew.' },
    { type: 'callout', variant: 'tip', body: '**You\'re learning to code at the best possible time.** The tools available to you right now — Claude, VS Code, Vercel — make it possible to ship real things in days, not months.' },
    { type: 'exercise', exerciseRef: 'FUNDAMENTALS-CODE-001' },
  ],
  nextLessonId: 'gs-l02',
};

/* How long to wait after the last section is marked read before saving partial
 * progress. Sections are marked on scroll, so an un-debounced save would fire a
 * request per scroll event. */
const PROGRESS_SAVE_DEBOUNCE_MS = 2000;

function trackFunnel(name: string, params?: Record<string, unknown>) {
  (window as unknown as { trackEvent?: (n: string, p?: Record<string, unknown>) => void }).trackEvent?.(name, params);
}

function trackLessonComplete(lesson: { order: number; trackId?: string }) {
  trackFunnel('lesson_complete', { track: lesson.trackId, lesson_order: lesson.order });
}

export function Lesson() {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<LessonView | null>(IS_DEV_MODE ? DEMO_LESSON : null);
  const [loading, setLoading] = useState(!IS_DEV_MODE);
  // Set to the track id when the API says this lesson needs the track.
  const [lockedTrack, setLockedTrack] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [exerciseResults, setExerciseResults] = useState<Record<string, { feedback: string; score: number }>>({});
  // Submission failures, shown honestly instead of being papered over with a
  // fabricated score.
  const [exerciseErrors, setExerciseErrors] = useState<Record<string, string>>({});
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  // Guard against double-firing the complete API call (IntersectionObserver + "Next" button)
  const lessonCompletedRef = useRef(false);
  // ─── Partial-progress saving ───
  // Learners here routinely stop mid-lesson. Progress used to be written only at
  // 100%, so anyone who stopped earlier came back to a blank slate. These refs
  // debounce an 'in-progress' save and make sure it never runs backwards or
  // fires again once the lesson is complete.
  const lastSavedProgressRef = useRef(0);
  const pendingProgressRef = useRef<number | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mark a text/callout section as read when it scrolls 80% into view
  const markSectionReadCallback = useCallback((idx: number) => {
    setCompletedSections((prev) => {
      if (prev.has(idx)) return prev;
      return new Set(prev).add(idx);
    });
  }, []);

  useEffect(() => {
    if (IS_DEV_MODE) return;

    async function load() {
      setLoading(true);
      setLoadFailed(false);
      setLockedTrack(null);
      try {
        const res: LessonDetailResponse = await learningApi.getLesson(id ?? '1');
        const l = res.lesson;

        // Parse learningObjectives from Json
        const objectives = Array.isArray(l.learningObjectives)
          ? (l.learningObjectives as Array<{ text?: string }>).map((o) => (typeof o === 'string' ? o : o.text ?? ''))
          : [];

        const sections = Array.isArray(l.contentSections) ? (l.contentSections as ContentSection[]) : [];

        // Map exercises to ExerciseData
        const exercises: ExerciseData[] = l.exercises.map((ex) => ({
          id: ex.id,
          ref: ex.ref,
          prompt: ex.prompt,
          type: ex.type as ExerciseType,
          config: ex.config as Record<string, unknown>,
          hints: ex.hints,
          explanation: ex.explanation ?? undefined,
          isKnowledgeCheck: ex.isKnowledgeCheck,
          xpReward: ex.xpReward,
        }));

        setLesson({
          id: l.id,
          moduleId: l.moduleId,
          title: l.title,
          duration: l.duration,
          order: l.order,
          learningObjectives: objectives,
          contentSections: sections,
          trackId: l.trackId ?? undefined,
          trackTitle: getCatalogTrack(l.trackId ?? undefined)?.title ?? l.trackTitle ?? 'Code from Bed',
          domainTitle: l.domainTitle ?? '',
          exercises,
          nextLessonId: l.nextLessonId ?? undefined,
          nextLessonLocked: !!l.nextLessonLocked,
          prevLessonId: l.prevLessonId ?? undefined,
        });
        trackFunnel('lesson_start', { track: l.trackId ?? undefined, lesson_order: l.order });

        // Resume where the learner stopped. Without this the saved percentage
        // is invisible: they'd come back to an empty progress bar and have no
        // idea how far in they were.
        const saved = res.progress;
        if (saved && typeof saved.progress === 'number' && saved.progress > 0 && sections.length > 0) {
          const pct = Math.min(100, Math.max(0, saved.progress));
          lastSavedProgressRef.current = pct;
          if (saved.status === 'completed' || pct >= 100) {
            lessonCompletedRef.current = true;
            setCompletedSections(new Set(sections.map((_, i) => i)));
          } else {
            const readCount = Math.min(sections.length, Math.round((pct / 100) * sections.length));
            if (readCount > 0) {
              setCompletedSections(new Set(Array.from({ length: readCount }, (_, i) => i)));
              // Rounding readCount back to a percentage can land a point or two
              // above the stored value; take the higher of the two so restoring
              // never triggers a redundant save.
              lastSavedProgressRef.current = Math.max(pct, Math.round((readCount / sections.length) * 100));
            }
          }
        }
      } catch (err) {
        // A locked or failed lesson must never fall back to the demo lesson.
        if (err instanceof ApiError && err.status === 403) {
          setLockedTrack(String(err.body.trackId ?? ''));
        } else {
          setLoadFailed(true);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, attempt]);

  // Build exercise lookup
  const exerciseMap = useMemo(() => {
    const map: Record<string, ExerciseData> = {};
    if (lesson) for (const ex of lesson.exercises) map[ex.ref] = ex;
    return map;
  }, [lesson]);

  // Auto-mark text/callout sections as read when scrolled into view (80% visible)
  // Must be before early return to satisfy rules-of-hooks
  useEffect(() => {
    if (!lesson) return;
    const refs = sectionRefs.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-section-idx'));
            if (!isNaN(idx)) markSectionReadCallback(idx);
          }
        });
      },
      { threshold: 0.8 },
    );
    refs.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [lesson, markSectionReadCallback]);

  // Cancel any queued partial save (the lesson finished, or we're unmounting).
  const cancelPendingSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    pendingProgressRef.current = null;
  }, []);

  // Write whatever partial progress is queued, right now.
  const flushProgressSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const pct = pendingProgressRef.current;
    pendingProgressRef.current = null;
    if (pct === null || !lesson || IS_DEV_MODE) return;
    // Never downgrade a completed lesson, and never re-send a percentage we
    // already stored.
    if (lessonCompletedRef.current || pct <= lastSavedProgressRef.current) return;
    lastSavedProgressRef.current = pct;
    learningApi.updateLessonProgress(lesson.id, 'in-progress', pct).catch(() => {});
  }, [lesson]);

  // Queue a debounced 'in-progress' save whenever more sections are read.
  // Must be before any early return to satisfy rules-of-hooks
  useEffect(() => {
    if (!lesson || IS_DEV_MODE || lessonCompletedRef.current) return;
    const total = lesson.contentSections.length;
    if (total === 0) return;
    const pct = Math.round((completedSections.size / total) * 100);
    // 100% is the completion effect's job, not a partial save.
    if (pct >= 100 || pct <= lastSavedProgressRef.current) return;
    pendingProgressRef.current = pct;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(flushProgressSave, PROGRESS_SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [completedSections, lesson, flushProgressSave]);

  // Don't lose a queued save when the learner closes the tab, backgrounds it, or
  // navigates away — that's exactly the moment this data matters most.
  const flushRef = useRef(flushProgressSave);
  useEffect(() => { flushRef.current = flushProgressSave; }, [flushProgressSave]);
  useEffect(() => {
    const flush = () => flushRef.current();
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      flush(); // unmount (route change)
    };
  }, []);

  // Fire lesson complete API call when all sections done (guarded to fire once)
  // Must be before any early return to satisfy rules-of-hooks
  useEffect(() => {
    if (!lesson || IS_DEV_MODE) return;
    const total = lesson.contentSections.length;
    if (total > 0 && completedSections.size === total && !lessonCompletedRef.current) {
      lessonCompletedRef.current = true;
      cancelPendingSave();
      lastSavedProgressRef.current = 100;
      learningApi.updateLessonProgress(lesson.id, 'completed', 100).catch(() => {});
      trackLessonComplete(lesson);
    }
  }, [completedSections, lesson, cancelPendingSave]);

  useEffect(() => {
    if (lockedTrack !== null) trackFunnel('paywall_view', { track: lockedTrack || undefined });
  }, [lockedTrack]);

  if (lockedTrack !== null) {
    return (
      <>
        <SEO title="Lesson locked" description="This lesson is part of a paid track." canonical="/pricing" noIndex />
        <LockedCard what="lesson" trackId={lockedTrack} />
      </>
    );
  }

  if (loadFailed) return <LoadFailedCard onRetry={() => setAttempt((n) => n + 1)} />;

  if (loading || !lesson) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4xl)' }}>
        <LoadingSpinner />
      </div>
    );
  }

  const totalSections = lesson.contentSections.length;
  const progress = totalSections > 0 ? (completedSections.size / totalSections) * 100 : 0;

  const handleExerciseSubmit = async (exerciseRef: string, answer: unknown) => {
    const exercise = exerciseMap[exerciseRef];
    if (!exercise) return;

    setExerciseErrors((prev) => {
      if (!(exerciseRef in prev)) return prev;
      const next = { ...prev };
      delete next[exerciseRef];
      return next;
    });

    try {
      const res = await learningApi.submitExercise(exercise.id, answer);
      setExerciseResults((prev) => ({
        ...prev,
        [exerciseRef]: {
          feedback: res.submission.feedback,
          score: res.submission.score,
        },
      }));
    } catch (err) {
      if (IS_DEV_MODE) {
        // Dev mode has no backend — show the demo result.
        setExerciseResults((prev) => ({
          ...prev,
          [exerciseRef]: { feedback: 'Great work! Your answer has been recorded.', score: 85 },
        }));
      } else {
        // Don't invent a score. A grading outage (503) or any other failure is
        // reported honestly and the exercise stays open so it can be retried.
        const message =
          (err as { body?: { message?: string } })?.body?.message ??
          "We couldn't grade this answer just now. Your answer is saved — try submitting again in a moment.";
        setExerciseErrors((prev) => ({ ...prev, [exerciseRef]: message }));
        return;
      }
    }

    const sectionIdx = lesson.contentSections.findIndex(
      (s) => s.type === 'exercise' && (s as ExerciseSection).exerciseRef === exerciseRef,
    );
    if (sectionIdx >= 0) setCompletedSections((prev) => new Set(prev).add(sectionIdx));
  };

  const markSectionRead = (idx: number) => {
    setCompletedSections((prev) => new Set(prev).add(idx));
  };

  // Mark lesson complete — called by nav buttons AND reactively when all sections done
  const markLessonComplete = () => {
    if (!lesson) return;
    // Mark all sections as read so progress bar fills (always, including dev mode)
    setCompletedSections(new Set(lesson.contentSections.map((_, i) => i)));
    // Skip API call in dev mode or if already fired (e.g. by the IntersectionObserver effect)
    if (IS_DEV_MODE || lessonCompletedRef.current) return;
    lessonCompletedRef.current = true;
    // Drop any queued partial save — it would otherwise land after this and
    // knock the lesson back to 'in-progress'.
    cancelPendingSave();
    lastSavedProgressRef.current = 100;
    learningApi.updateLessonProgress(lesson.id, 'completed', 100).catch(() => {});
    trackLessonComplete(lesson);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <SEO title={lesson.title} description={`${lesson.trackTitle} — ${lesson.domainTitle}. Lesson ${lesson.order}: ${lesson.title}`} noIndex />
      {/* Breadcrumb + progress */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
          <Link to="/dashboard" style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>Dashboard</Link>
          <span aria-hidden="true" style={{ color: 'var(--text-tertiary)' }}>/</span>
          <span style={{ color: 'var(--signal)', fontSize: '0.8125rem', fontFamily: 'var(--font-display)' }}>{lesson.trackTitle}</span>
          <span aria-hidden="true" style={{ color: 'var(--text-tertiary)' }}>/</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{lesson.domainTitle}</span>
          <span aria-hidden="true" style={{ color: 'var(--text-tertiary)' }}>/</span>
          <span aria-current="page" style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Lesson {lesson.order}</span>
        </nav>
        <ProgressBar value={progress} color="var(--signal)" height={4} />
      </div>

      <h1 style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>{lesson.title}</h1>
      <p style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)', fontSize: '0.8125rem', marginBottom: 'var(--space-lg)' }}>
        {lesson.duration} min &middot; Lesson {lesson.order}
      </p>

      {/* Learning objectives */}
      <Card style={{ marginBottom: 'var(--space-2xl)', borderLeft: '3px solid var(--signal)' }}>
        <h3 style={{ fontSize: '0.875rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--signal)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-md)' }}>
          Learning Objectives
        </h3>
        <ul style={{ paddingLeft: 'var(--space-xl)', listStyle: 'none', margin: 0 }}>
          {lesson.learningObjectives.map((obj, i) => (
            <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, padding: 'var(--space-xs) 0', display: 'flex', gap: 'var(--space-sm)' }}>
              <span style={{ color: 'var(--signal)', flexShrink: 0 }}>&#9673;</span>
              {obj}
            </li>
          ))}
        </ul>
      </Card>

      <LessonListen lesson={lesson} sectionRefs={sectionRefs} />

      {/* Content sections */}
      {lesson.contentSections.map((section, i) => {
        if (section.type === 'text') {
          return (
            <Card
              key={i}
              ref={(el) => { sectionRefs.current[i] = el as HTMLElement | null; }}
              data-section-idx={i}
              style={{ marginBottom: 'var(--space-xl)' }}
              onClick={() => markSectionRead(i)}
            >
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                <Markdown components={markdownComponents}>{section.body}</Markdown>
              </div>
            </Card>
          );
        }

        if (section.type === 'callout') {
          const style = CALLOUT_STYLES[section.variant] || CALLOUT_STYLES.info;
          return (
            <div
              key={i}
              ref={(el) => { sectionRefs.current[i] = el; }}
              data-section-idx={i}
              /* role="note", never role="alert" — alert is an ASSERTIVE live
               * region, so every one of these static "warning" callouts used
               * to interrupt whatever the screen reader was reading, at the
               * moment the element mounted. Static page content is not an
               * alert. (18 seed lessons use variant "warning".) */
              role="note"
              style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-lg) var(--space-xl)', borderLeft: `3px solid ${style.border}`, background: style.bg, borderRadius: 'var(--radius-md)' }}
              onClick={() => markSectionRead(i)}
            >
              <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                <span aria-hidden="true" style={{ fontSize: '1.125rem', lineHeight: 1.4 }}>{style.icon}</span>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                  <Markdown components={markdownComponents}>{section.body}</Markdown>
                </div>
              </div>
            </div>
          );
        }

        if (section.type === 'exercise') {
          const exercise = exerciseMap[(section as ExerciseSection).exerciseRef];
          if (!exercise) return null;
          const result = exerciseResults[(section as ExerciseSection).exerciseRef];
          const submitError = exerciseErrors[(section as ExerciseSection).exerciseRef];
          return (
            <div key={i} style={{ marginBottom: 'var(--space-xl)' }}>
              <ExerciseRenderer
                exercise={exercise}
                onSubmit={(answer) => handleExerciseSubmit((section as ExerciseSection).exerciseRef, answer)}
                feedback={result?.feedback}
                score={result?.score}
                disabled={!!result}
              />
              {submitError && !result && (
                <p
                  role="status"
                  style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md) var(--space-lg)', borderLeft: '3px solid var(--warning)', background: 'rgba(201,168,76,0.06)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}
                >
                  {submitError}
                </p>
              )}
            </div>
          );
        }

        if (section.type === 'hook') {
          const s = section as HookSection;
          return (
            <div
              key={i}
              ref={(el) => { sectionRefs.current[i] = el; }}
              data-section-idx={i}
              style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-lg) var(--space-xl)', borderLeft: '3px solid var(--gold)', background: 'rgba(201,168,76,0.06)', borderRadius: 'var(--radius-md)' }}
              onClick={() => markSectionRead(i)}
            >
              <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                <span aria-hidden="true" style={{ fontSize: '1.125rem', lineHeight: 1.4 }}>🎯</span>
                <div>
                  <p style={{ color: 'var(--gold)', fontSize: '0.6875rem', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 var(--space-xs)' }}>Why this matters</p>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                    <Markdown components={markdownComponents}>{s.body}</Markdown>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (section.type === 'takeaway') {
          const s = section as TakeawaySection;
          return (
            <div
              key={i}
              ref={(el) => { sectionRefs.current[i] = el; }}
              data-section-idx={i}
              style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-lg) var(--space-xl)', borderLeft: '3px solid var(--success)', background: 'rgba(90,158,106,0.06)', borderRadius: 'var(--radius-md)' }}
              onClick={() => markSectionRead(i)}
            >
              <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                <span aria-hidden="true" style={{ fontSize: '1.125rem', lineHeight: 1.4 }}>💡</span>
                <div>
                  <p style={{ color: 'var(--success)', fontSize: '0.6875rem', fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 var(--space-xs)' }}>Remember this</p>
                  <div style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1.7, fontWeight: 500 }}>
                    <Markdown components={markdownComponents}>{s.body}</Markdown>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        if (section.type === 'pod-header') {
          const s = section as PodHeaderSection;
          return (
            <div
              key={i}
              ref={(el) => { sectionRefs.current[i] = el; }}
              data-section-idx={i}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', margin: 'var(--space-3xl) 0 var(--space-xl)' }}
              onClick={() => markSectionRead(i)}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--signal)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'var(--bg-void)', fontSize: '0.75rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{s.podNumber}</span>
              </div>
              {/* A real <h2> (the lesson title is the h1): pods are the
                * lesson's chapter structure, and without headings a screen
                * reader user has no way to skim a 20-minute lesson or jump
                * back to where they stopped. Styling below reproduces the
                * previous <span> exactly — the global h1..h6 rule sets a
                * display font, 1.75rem, tight line-height/letter-spacing and
                * balanced wrapping, all of which have to be neutralised. */}
              <h2 style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', fontWeight: 600, fontFamily: 'inherit', lineHeight: 'inherit', letterSpacing: 'normal', textWrap: 'wrap', margin: 0 }}>{s.title}</h2>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', fontFamily: 'var(--font-display)', background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--bg-border)' }}>{s.duration} min</span>
              <div style={{ flex: 1, height: 1, background: 'var(--bg-border)' }} />
            </div>
          );
        }

        if (section.type === 'interactive-guess') {
          const s = section as InteractiveGuessSection;
          return (
            <div key={i} ref={(el) => { sectionRefs.current[i] = el as HTMLElement | null; }} data-section-idx={i} onClick={() => markSectionRead(i)}>
              <InteractiveGuess question={s.question} answer={s.answer} hint={s.hint} />
            </div>
          );
        }

        if (section.type === 'concept-flow') {
          const s = section as ConceptFlowSection;
          return (
            <div key={i} ref={(el) => { sectionRefs.current[i] = el as HTMLElement | null; }} data-section-idx={i} onClick={() => markSectionRead(i)}>
              <ConceptFlow scenario={s.scenario} question={s.question} options={s.options} correctValue={s.correctValue} feedback={s.feedback} concept={s.concept} />
            </div>
          );
        }

        if (section.type === 'diagnose-mechanism') {
          const s = section as DiagnoseMechanismSection;
          return (
            <div key={i} ref={(el) => { sectionRefs.current[i] = el as HTMLElement | null; }} data-section-idx={i} onClick={() => markSectionRead(i)}>
              <DiagnoseMechanism scenario={s.scenario} question={s.question} options={s.options} correctValue={s.correctValue} feedback={s.feedback} mechanism={s.mechanism} />
            </div>
          );
        }

        if (section.type === 'spot-flaw') {
          const s = section as SpotFlawSection;
          return (
            <div key={i} ref={(el) => { sectionRefs.current[i] = el as HTMLElement | null; }} data-section-idx={i} onClick={() => markSectionRead(i)}>
              <SpotFlaw code={s.code} question={s.question} options={s.options} correctValue={s.correctValue} feedback={s.feedback} flawExplanation={s.flawExplanation} />
            </div>
          );
        }

        if (section.type === 'sequence-it') {
          const s = section as SequenceItSection;
          return (
            <div key={i} ref={(el) => { sectionRefs.current[i] = el as HTMLElement | null; }} data-section-idx={i} onClick={() => markSectionRead(i)}>
              <SequenceIt question={s.question} steps={s.steps} explanation={s.explanation} />
            </div>
          );
        }

        if (section.type === 'build-it') {
          const s = section as BuildItSection;
          return (
            <div key={i} ref={(el) => { sectionRefs.current[i] = el as HTMLElement | null; }} data-section-idx={i} onClick={() => markSectionRead(i)}>
              <BuildIt intro={s.intro} objectName={s.objectName} fields={s.fields} synthesis={s.synthesis} />
            </div>
          );
        }

        if (section.type === 'screen-reader-sim') {
          const s = section as ScreenReaderSimSection;
          return (
            <div key={i} ref={(el) => { sectionRefs.current[i] = el as HTMLElement | null; }} data-section-idx={i} onClick={() => markSectionRead(i)}>
              <ScreenReaderSim title={s.title} intro={s.intro} note={s.note} controls={s.controls} debrief={s.debrief} />
            </div>
          );
        }

        if (section.type === 'evidence-stack') {
          const s = section as EvidenceStackSection;
          return (
            <div key={i} ref={(el) => { sectionRefs.current[i] = el as HTMLElement | null; }} data-section-idx={i} onClick={() => markSectionRead(i)}>
              <EvidenceStack scenario={s.scenario} question={s.question} items={s.items} explanation={s.explanation} synthesis={s.synthesis} />
            </div>
          );
        }

        if (section.type === 'predict-number') {
          const s = section as PredictNumberSection;
          return (
            <div key={i} ref={(el) => { sectionRefs.current[i] = el as HTMLElement | null; }} data-section-idx={i} onClick={() => markSectionRead(i)}>
              <PredictNumber scenario={s.scenario} question={s.question} unit={s.unit} actualValue={s.actualValue} explanation={s.explanation} />
            </div>
          );
        }

        if (section.type === 'prompt-build') {
          const s = section as PromptBuildSection;
          return (
            <div key={i} ref={(el) => { sectionRefs.current[i] = el as HTMLElement | null; }} data-section-idx={i} onClick={() => markSectionRead(i)}>
              <PromptBuild intro={s.intro} fields={s.fields} synthesis={s.synthesis} />
            </div>
          );
        }

        if (section.type === 'worked-example') {
          const s = section as WorkedExampleSection;
          return (
            <div key={i} ref={(el) => { sectionRefs.current[i] = el as HTMLElement | null; }} data-section-idx={i} onClick={() => markSectionRead(i)}>
              <WorkedExample problem={s.problem} steps={s.steps} faded={s.faded} procedure={s.procedure} />
            </div>
          );
        }

        if (section.type === 'retrieval-check') {
          const s = section as RetrievalCheckSection;
          return (
            <div key={i} ref={(el) => { sectionRefs.current[i] = el as HTMLElement | null; }} data-section-idx={i} onClick={() => markSectionRead(i)}>
              <RetrievalCheck title={s.title} framing={s.framing} questions={s.questions} />
            </div>
          );
        }

        if (section.type === 'case-sim') {
          const s = section as CaseSimSection;
          return (
            <div key={i} ref={(el) => { sectionRefs.current[i] = el as HTMLElement | null; }} data-section-idx={i} onClick={() => markSectionRead(i)}>
              <CaseSim title={s.title} opening={s.opening} start={s.start} nodes={s.nodes} endings={s.endings} />
            </div>
          );
        }

        if (section.type === 'lab-brief') {
          const s = section as LabBriefSection;
          return (
            <div key={i} ref={(el) => { sectionRefs.current[i] = el as HTMLElement | null; }} data-section-idx={i} onClick={() => markSectionRead(i)}>
              {/* Keyed by labId: the lab reads its saved place once at mount, so a
                * different lab at the same section index must be a remount. */}
              <LabBrief key={s.labId} labId={s.labId} title={s.title} brief={s.brief} deliverable={s.deliverable} stages={s.stages} rubric={s.rubric} />
            </div>
          );
        }

        return null;
      })}

      {/* End of the free trial */}
      {lesson.nextLessonLocked && lesson.nextLessonId && (
        <Card style={{ marginTop: 'var(--space-3xl)', padding: 'var(--space-xl)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-sm)' }}>That was the free trial</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            The rest of the track is €{TRACK_PRICE} once: every lesson, the exam and the certificate. No subscription, no
            renewal. If that is out of reach, ask for a hardship code. No reason needed.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <Link to={`/tracks/${lesson.trackId ?? ''}`} onClick={markLessonComplete}><Button variant="primary">See the full track</Button></Link>
            <Link to="/pricing#hardship" onClick={markLessonComplete}><Button variant="secondary">Ask for a hardship code</Button></Link>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-3xl)', paddingTop: 'var(--space-xl)', borderTop: '1px solid var(--bg-border)' }}>
        {lesson.prevLessonId ? (
          <Link to={`/lesson/${lesson.prevLessonId}`}><Button variant="ghost">&larr; Previous lesson</Button></Link>
        ) : (
          <Link to="/dashboard"><Button variant="ghost">Back to dashboard</Button></Link>
        )}
        {lesson.nextLessonLocked ? (
          <Link to="/dashboard" onClick={markLessonComplete}>
            <Button variant="secondary">Finish lesson &check;</Button>
          </Link>
        ) : lesson.nextLessonId ? (
          <Link to={`/lesson/${lesson.nextLessonId}`} onClick={markLessonComplete}>
            <Button variant="primary">Next lesson &rarr;</Button>
          </Link>
        ) : (
          <Link to="/dashboard" onClick={markLessonComplete}>
            <Button variant="primary">Complete &check;</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
