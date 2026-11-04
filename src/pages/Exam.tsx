import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { LoadingSpinner } from '@/components/ProtectedRoute';
import { learningApi, ApiError, type ExamResponse, type ExamQuestion } from '@/lib/api';
import { IS_DEV_MODE } from '@/lib/useApi';
import { getCatalogTrack } from '@/data/trackCatalog';
import { LockedCard, LoadFailedCard } from '@/components/LockedCard';
import { SEO } from "@/components/SEO";

type ExamPhase = 'pre' | 'active' | 'results';

const TRACK_META: Record<string, { name: string; color: string }> = {
  fundamentals: { name: '🛏️ Code from Bed', color: 'var(--signal)' },
  ai: { name: '🤖 AI Literacy for Humans', color: 'var(--rust)' },
  tools: { name: '⚡ Build Cool Tools Fast', color: 'var(--gold)' },
  advanced: { name: '🚀 AI Agents that Work', color: 'var(--crystal)' },
};

/* ─── Demo questions ─── */
const DEMO_QUESTIONS: ExamQuestion[] = [
  { id: '1', ref: 'E-1', prompt: 'Which model should you use for a simple email classification task?', type: 'MULTIPLE_CHOICE', config: { options: ['Claude Opus (always use best)', 'Claude Haiku (fast, cheap, sufficient)', 'GPT-4 (industry standard)', 'A local model (free)'] }, difficulty: 'medium', bloomLevel: 'apply', domainId: 'model-selection', timeEstimate: 60 },
  { id: '2', ref: 'E-2', prompt: 'What does "temperature" control in a language model?', type: 'MULTIPLE_CHOICE', config: { options: ['Processing speed', 'Randomness/creativity of output', 'Token limit', 'API cost'] }, difficulty: 'medium', bloomLevel: 'understand', domainId: 'llm-basics', timeEstimate: 60 },
  { id: '3', ref: 'E-3', prompt: 'When building an agent loop, what is the "stop condition"?', type: 'MULTIPLE_CHOICE', config: { options: ['When the API returns an error', 'When the model says it is done', 'When the task is complete OR a max iteration limit is hit', 'When the user closes the browser'] }, difficulty: 'medium', bloomLevel: 'apply', domainId: 'agent-basics', timeEstimate: 60 },
];

function generateDemoQuestions(): ExamQuestion[] {
  const questions: ExamQuestion[] = [];
  for (let i = 0; i < 50; i++) {
    const base = DEMO_QUESTIONS[i % DEMO_QUESTIONS.length];
    questions.push({ ...base, id: String(i + 1) });
  }
  return questions;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface DomainResult { domain: string; correct: number; total: number }

export function Exam() {
  const { trackId } = useParams<{ trackId: string }>();
  const catalog = getCatalogTrack(trackId);
  const track = catalog
    ? { name: `${catalog.emoji} ${catalog.title}`, color: catalog.color }
    : (TRACK_META[trackId ?? ''] ?? TRACK_META.fundamentals);

  const [loading, setLoading] = useState(!IS_DEV_MODE);
  const [blocked, setBlocked] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [examId, setExamId] = useState<string | null>(null);
  const [examMeta, setExamMeta] = useState<{ title: string; description: string; timeLimit: number; passScore: number; questionCount: number; openEndedCount: number; cooldownUntil: string | null }>({ title: 'Certification Exam', description: '', timeLimit: 60, passScore: 75, questionCount: 50, openEndedCount: 0, cooldownUntil: null });
  const [questions, setQuestions] = useState<ExamQuestion[]>(
    () => IS_DEV_MODE ? generateDemoQuestions() : []
  );
  const [phase, setPhase] = useState<ExamPhase>('pre');
  const [currentIndex, setCurrentIndex] = useState(0);
  // MULTIPLE_CHOICE answers are the selected option index; OPEN_ENDED answers
  // are the free-text response. Same map, different value shape per question.
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [openEndedText, setOpenEndedText] = useState('');
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [serverResult, setServerResult] = useState<{ score: number; passed: boolean; answers: Array<{ exerciseId: string; isCorrect: boolean }> } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (IS_DEV_MODE) return;

    async function load() {
      setLoading(true);
      setBlocked(false);
      setLoadFailed(false);
      try {
        const res: ExamResponse = await learningApi.getExam(trackId ?? 'fundamentals');
        setExamId(res.exam.id);
        setExamMeta({
          title: res.exam.title,
          description: res.exam.description,
          timeLimit: res.exam.timeLimit,
          passScore: res.exam.passScore,
          questionCount: res.exam.questionCount,
          openEndedCount: res.exam.openEndedCount ?? 0,
          cooldownUntil: res.exam.cooldownUntil ?? null,
        });
        setTimeLeft(res.exam.timeLimit * 60);
        setQuestions(res.questions);
      } catch (err) {
        // Never fall back to demo questions: a locked or failed exam must say so.
        if (err instanceof ApiError && err.status === 403) setBlocked(true);
        else setLoadFailed(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [trackId, attempt]);

  const TOTAL_QUESTIONS = questions.length;

  const finishExam = useCallback(async (finalAnswers?: Record<number, number | string>) => {
    // Show a submitting state rather than switching to results immediately —
    // this prevents briefly flashing incorrect local-graded results while the
    // server processes the submission.
    setSubmitting(true);
    // finalAnswers lets the caller pass the just-updated answer map directly —
    // setAnswers() is async, so reading the `answers` state right after
    // calling it on the same tick (e.g. the last question, submitted in the
    // same handleNext call that recorded its answer) would read stale data.
    const answersToSubmit = finalAnswers ?? answers;

    if (examId) {
      try {
        // Build answers array for server. MULTIPLE_CHOICE sends
        // {selectedIndex}; OPEN_ENDED sends the free-text answer directly —
        // matches what the practice-exercise submit path already sends.
        const answerPayload = Object.entries(answersToSubmit)
          .filter(([idx]) => questions[Number(idx)]?.id) // skip missing questions
          .map(([idx, value]) => {
            const q = questions[Number(idx)];
            return {
              exerciseId: q.id,
              answer: q.type === 'OPEN_ENDED' ? String(value) : { selectedIndex: value },
            };
          });

        const res = await learningApi.submitExam(examId, answerPayload);
        setServerResult({ score: res.attempt.score, passed: res.attempt.passed, answers: res.answers });
        if (res.certificate) setCertificateId(res.certificate.id);
      } catch (err) {
        // Cooldown backstop — the pre-exam screen should have already
        // blocked this, but if client state was stale, send them back there
        // rather than showing a fake locally-graded result.
        if (err instanceof ApiError && err.status === 429) {
          const retryAt = typeof err.body.retryAt === 'string' ? err.body.retryAt : null;
          setExamMeta((m) => ({ ...m, cooldownUntil: retryAt }));
          setSubmitting(false);
          setPhase('pre');
          return;
        }
        // Any other failure: fall through to local grading so the learner
        // still sees a result instead of a dead end.
      }
    }

    setSubmitting(false);
    setPhase('results');
  }, [examId, answers, questions]);

  // Timer
  useEffect(() => {
    if (phase !== 'active') return;
    if (timeLeft <= 0) {
      // Defer setState calls out of synchronous effect body
      const id = setTimeout(() => finishExam(), 0);
      return () => clearTimeout(id);
    }
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { finishExam(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, timeLeft, finishExam]);

  // Persist exam state to sessionStorage so refresh doesn't lose progress
  const STORAGE_KEY = `exam_state_${trackId}`;
  useEffect(() => {
    if (phase === 'active') {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, currentIndex, timeLeft }));
    } else if (phase === 'results') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [phase, answers, currentIndex, timeLeft, STORAGE_KEY]);

  const handleStart = () => {
    // Restore saved state if available
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { answers: a, currentIndex: ci, timeLeft: tl } = JSON.parse(saved);
        const maxTime = examMeta.timeLimit * 60;
        setAnswers(a ?? {});
        setCurrentIndex(ci ?? 0);
        // Cap restored time to the current exam limit (guards against stale/invalid values)
        setTimeLeft(Math.min(Math.max(tl ?? maxTime, 0), maxTime));
        setPhase('active');
        return;
      } catch { /* ignore */ }
    }
    setPhase('active');
    setTimeLeft(examMeta.timeLimit * 60);
  };

  const handleNext = () => {
    const isOpenEnded = questions[currentIndex]?.type === 'OPEN_ENDED';
    const currentAnswer = isOpenEnded ? (openEndedText.trim() || null) : selectedOption;

    const finalAnswers = { ...answers };
    if (currentAnswer !== null) finalAnswers[currentIndex] = currentAnswer;
    setAnswers(finalAnswers);
    setSelectedOption(null);
    setOpenEndedText('');

    if (currentIndex < TOTAL_QUESTIONS - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      finishExam(finalAnswers);
    }
  };

  const calculateResults = () => {
    if (serverResult) {
      const correct = serverResult.answers.filter((a) => a.isCorrect).length;
      const score = serverResult.score / 100;
      const passed = serverResult.passed;
      const xpEarned = passed ? 500 : Math.round(score * 200);

      // Domain breakdown from server
      const domainMap: Record<string, { correct: number; total: number }> = {};
      questions.forEach((q) => {
        const domain = q.domainId ?? 'Unknown';
        if (!domainMap[domain]) domainMap[domain] = { correct: 0, total: 0 };
        domainMap[domain].total++;
        const sa = serverResult.answers.find((a) => a.exerciseId === q.id);
        if (sa?.isCorrect) domainMap[domain].correct++;
      });
      const domains: DomainResult[] = Object.entries(domainMap).map(([domain, data]) => ({ domain, ...data }));

      return { correct, score, passed, domains, xpEarned };
    }

    // Local fallback
    let correct = 0;
    const domainMap: Record<string, { correct: number; total: number }> = {};
    const correctIndexMap: Record<string, number> = { '1': 1, '2': 1, '3': 2 };

    questions.forEach((q, i) => {
      const domain = q.domainId ?? 'Unknown';
      if (!domainMap[domain]) domainMap[domain] = { correct: 0, total: 0 };
      domainMap[domain].total++;

      const ci = correctIndexMap[DEMO_QUESTIONS[Number(q.id) % DEMO_QUESTIONS.length]?.id ?? ''] ?? 1;
      if (answers[i] === ci) { correct++; domainMap[domain].correct++; }
    });

    const domains: DomainResult[] = Object.entries(domainMap).map(([domain, data]) => ({ domain, ...data }));
    const score = correct / TOTAL_QUESTIONS;
    const passed = score >= (examMeta.passScore / 100);
    const xpEarned = passed ? 500 : Math.round(score * 200);

    return { correct, score, passed, domains, xpEarned };
  };

  if (blocked) return <LockedCard what="exam" trackId={trackId} />;
  if (loadFailed) return <LoadFailedCard onRetry={() => setAttempt((n) => n + 1)} />;

  if (loading || submitting) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4xl)', gap: 'var(--space-lg)' }}>
        <LoadingSpinner />
        {submitting && <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9375rem' }}>Submitting your exam…</p>}
      </div>
    );
  }

  const timerWarning = timeLeft < 300;
  const timerCritical = timeLeft < 60;

  // ─── Pre-exam screen ───
  if (phase === 'pre') {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <SEO title={examMeta.title} description={`${track.name} certification exam. ${examMeta.questionCount} questions, ${examMeta.timeLimit} minutes.`} noIndex />
        <Link to="/dashboard" style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-xl)' }}>&larr; Back to Dashboard</Link>
        <Card style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-2xl)' }}>
          <div style={{ width: 48, height: 4, background: track.color, borderRadius: 2, margin: '0 auto var(--space-xl)' }} />
          <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-sm)' }}>{examMeta.title}</h1>
          <p style={{ color: track.color, fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: 'var(--space-2xl)' }}>{track.name}</p>

          <Card style={{ background: 'var(--bg-elevated)', textAlign: 'left', marginBottom: 'var(--space-2xl)' }}>
            <h3 style={{ fontSize: '0.9375rem', marginBottom: 'var(--space-lg)' }}>Exam Rules</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {[
                { icon: '#', text: examMeta.openEndedCount > 0
                    ? `${examMeta.questionCount} questions (${examMeta.openEndedCount} open-ended, AI-graded)`
                    : `${examMeta.questionCount} questions` },
                { icon: '\u23F1', text: `${examMeta.timeLimit} minutes time limit` },
                { icon: '\u2713', text: `${examMeta.passScore}% required to pass` },
                { icon: '\u2716', text: 'No going back to previous questions' },
                { icon: '\u26A0', text: 'Unanswered questions count as incorrect' },
                { icon: '\u21BB', text: 'If you don\'t pass, there\'s a short break before you can retry \u2014 review time, not a penalty' },
              ].map((rule, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                  <span style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>{rule.icon}</span>
                  {rule.text}
                </li>
              ))}
            </ul>
          </Card>

          {examMeta.cooldownUntil && new Date(examMeta.cooldownUntil) > new Date() ? (
            <>
              <Card style={{ background: 'var(--bg-elevated)', textAlign: 'left', marginBottom: 'var(--space-xl)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: 0 }}>
                  You can retry this exam at{' '}
                  <strong>
                    {new Date(examMeta.cooldownUntil).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' })}
                  </strong>
                  . This gap is review time, not a penalty — it's there so a retry means you've actually
                  reviewed, not just re-guessed the same questions a minute later. Take your time; there's no
                  deadline.
                </p>
              </Card>
              <Button variant="secondary" size="lg" disabled style={{ minWidth: 200 }}>Retry available soon</Button>
            </>
          ) : (
            <>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-xl)' }}>
                Once you start, the timer begins. Make sure you have a stable connection.
              </p>
              <Button variant="primary" size="lg" onClick={handleStart} style={{ minWidth: 200 }}>Start Exam</Button>
            </>
          )}
        </Card>
      </div>
    );
  }

  // ─── Results screen ───
  if (phase === 'results') {
    const { correct, score, passed, domains, xpEarned } = calculateResults();
    const pct = Math.round(score * 100);

    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <Card style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-2xl)', marginBottom: 'var(--space-2xl)' }}>
          <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto var(--space-xl)' }}>
            <svg viewBox="0 0 140 140" style={{ width: 140, height: 140, transform: 'rotate(-90deg)' }}>
              <circle cx="70" cy="70" r="60" fill="none" stroke="var(--bg-border)" strokeWidth="8" />
              <circle cx="70" cy="70" r="60" fill="none" stroke={passed ? 'var(--success)' : 'var(--error)'} strokeWidth="8" strokeDasharray={`${2 * Math.PI * 60}`} strokeDashoffset={`${2 * Math.PI * 60 * (1 - score)}`} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: passed ? 'var(--success)' : 'var(--error)' }}>{pct}%</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}>{correct}/{TOTAL_QUESTIONS}</span>
            </div>
          </div>

          <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-sm)', color: passed ? 'var(--success)' : 'var(--error)' }}>
            {passed ? 'Congratulations!' : 'Not quite there yet'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            {passed ? `You passed the ${track.name} certification exam.` : `You needed ${examMeta.passScore}% to pass.`}
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-lg)', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-display)', fontSize: '0.875rem', color: 'var(--gold)', marginBottom: 'var(--space-xl)' }}>
            +{xpEarned} XP earned
          </div>
        </Card>

        <Card style={{ marginBottom: 'var(--space-2xl)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-xl)' }}>Domain Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {domains.map((d) => {
              const domainPct = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
              return (
                <div key={d.domain}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{d.domain}</span>
                    <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-display)', color: domainPct >= 75 ? 'var(--success)' : 'var(--error)' }}>
                      {d.correct}/{d.total} ({domainPct}%)
                    </span>
                  </div>
                  <ProgressBar value={domainPct} color={domainPct >= 75 ? 'var(--success)' : 'var(--error)'} height={6} />
                </div>
              );
            })}
          </div>
        </Card>

        <div style={{ display: 'flex', gap: 'var(--space-lg)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/dashboard"><Button variant="secondary">Back to Dashboard</Button></Link>
          {passed ? (
            <Link to={`/certificate/${certificateId ?? `${trackId}-cert`}`}><Button variant="primary">View Certificate</Button></Link>
          ) : (
            <Button variant="primary" onClick={() => { setPhase('pre'); setCurrentIndex(0); setAnswers({}); setSelectedOption(null); setTimeLeft(examMeta.timeLimit * 60); setServerResult(null); }}>Retry Exam</Button>
          )}
        </div>
      </div>
    );
  }

  // ─── Active exam screen ───
  if (questions.length === 0) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-4xl) var(--space-xl)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No questions available for this exam yet. Please check back later.</p>
        <Link to="/dashboard"><Button variant="primary" style={{ marginTop: 'var(--space-xl)' }}>Back to Dashboard</Button></Link>
      </div>
    );
  }

  const question = questions[currentIndex];
  const isOpenEnded = question.type === 'OPEN_ENDED';
  const options = (question.config as { options?: string[] })?.options ?? [];
  // Don't double-count if the current question is already in answers
  const hasCurrentDraft = isOpenEnded ? openEndedText.trim().length > 0 : selectedOption !== null;
  const answeredCount =
    Object.keys(answers).length +
    (hasCurrentDraft && !(currentIndex in answers) ? 1 : 0);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'var(--space-2xl) var(--space-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)', padding: 'var(--space-md) var(--space-lg)', background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{track.name}</span>
          <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Q {currentIndex + 1} / {TOTAL_QUESTIONS}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-code)', fontSize: '1.125rem', fontWeight: 600, color: timerCritical ? 'var(--error)' : timerWarning ? 'var(--warning)' : 'var(--text-primary)', ...(timerCritical ? { animation: 'pulse 1s ease-in-out infinite' } : {}) }}>
          {formatTime(timeLeft)}
        </div>
      </div>

      <ProgressBar value={((currentIndex + 1) / TOTAL_QUESTIONS) * 100} color={track.color} height={4} />

      <div className="grid-sidebar" style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 'var(--space-2xl)', marginTop: 'var(--space-2xl)', alignItems: 'start' }}>
        <div>
          <Card style={{ marginBottom: 'var(--space-xl)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: track.color, marginBottom: 'var(--space-md)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
              {question.domainId}
            </div>
            <h2 style={{ fontSize: '1.125rem', lineHeight: 1.6, marginBottom: 'var(--space-2xl)' }}>{question.prompt}</h2>
            {isOpenEnded ? (
              <div>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-md)' }}>
                  Open-ended judgment question — write your answer in your own words. It's graded by AI, the
                  same way practice exercises are.
                </p>
                <textarea
                  value={openEndedText}
                  onChange={(e) => setOpenEndedText(e.target.value)}
                  placeholder="Type your answer here…"
                  rows={6}
                  aria-label="Your answer"
                  style={{ width: '100%', padding: 'var(--space-md) var(--space-lg)', background: 'var(--bg-elevated)', border: `1px solid var(--bg-border)`, borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1.5, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {options.map((option, i) => {
                const isSelected = selectedOption === i;
                return (
                  <button key={i} onClick={() => setSelectedOption(i)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md) var(--space-lg)', background: isSelected ? 'var(--bg-elevated)' : 'transparent', border: `1px solid ${isSelected ? track.color : 'var(--bg-border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left' as const, color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1.5, fontFamily: 'inherit' }}>
                    <span style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: `1.5px solid ${isSelected ? track.color : 'var(--bg-border)'}`, background: isSelected ? track.color : 'transparent', color: isSelected ? 'var(--bg-void)' : 'var(--text-tertiary)', fontSize: '0.75rem', fontFamily: 'var(--font-display)', fontWeight: 600, flexShrink: 0 }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
            )}
          </Card>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={handleNext} style={{ minWidth: 140 }}>
              {currentIndex < TOTAL_QUESTIONS - 1 ? 'Next' : 'Finish Exam'}
            </Button>
          </div>
        </div>

        {/* Question navigator */}
        <Card style={{ position: 'sticky', top: 80, padding: 'var(--space-lg)' }}>
          <h4 style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-display)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Questions</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            <span>{answeredCount} answered</span>
            <span style={{ color: 'var(--bg-border)' }}>|</span>
            <span>{TOTAL_QUESTIONS - answeredCount} remaining</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
            {Array.from({ length: TOTAL_QUESTIONS }, (_, i) => {
              const isCurrent = i === currentIndex;
              const isAnswered = i in answers;
              const isPast = i < currentIndex;
              let bg = 'var(--bg-elevated)', borderColor = 'var(--bg-border)', textColor = 'var(--text-tertiary)';
              if (isCurrent) { bg = track.color; borderColor = track.color; textColor = 'var(--bg-void)'; }
              else if (isAnswered) { bg = 'var(--bg-surface)'; borderColor = 'var(--success)'; textColor = 'var(--success)'; }
              else if (isPast) { bg = 'var(--bg-surface)'; borderColor = 'var(--error)'; textColor = 'var(--error)'; }

              return (
                <div key={i} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)', border: `1px solid ${borderColor}`, background: bg, color: textColor, fontSize: '0.6875rem', fontFamily: 'var(--font-display)', fontWeight: isCurrent ? 600 : 400 }}>
                  {i + 1}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
