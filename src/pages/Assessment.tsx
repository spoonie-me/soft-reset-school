import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { ExerciseRenderer } from '@/components/exercises/ExerciseRenderer';
import type { ExerciseData, ExerciseType } from '@/components/exercises/ExerciseRenderer';
import { ExerciseTimer } from '@/components/exercises/shared/ExerciseTimer';
import { LoadingSpinner } from '@/components/ProtectedRoute';
import { learningApi, ApiError, type AssessmentResponse } from '@/lib/api';
import { IS_DEV_MODE } from '@/lib/useApi';
import { LockedCard, LoadFailedCard } from '@/components/LockedCard';
import { SEO } from '@/components/SEO';

/* ─── Demo data ─── */
const DEMO_QUESTIONS: ExerciseData[] = [
  {
    id: 'aq1', ref: 'A-1.1',
    prompt: 'What does a variable store in a program?',
    type: 'MULTIPLE_CHOICE',
    config: { options: [{ id: 'a', text: 'A file on disk' }, { id: 'b', text: 'A named container for data' }, { id: 'c', text: 'A line of code' }, { id: 'd', text: 'An internet request' }], correctId: 'b' },
    hints: [], explanation: 'A variable is a named location in memory that stores a value you can use and change.', isKnowledgeCheck: true, xpReward: 20,
  },
  {
    id: 'aq2', ref: 'A-1.2',
    prompt: 'What is a "string" data type?',
    type: 'MULTIPLE_CHOICE',
    config: { options: [{ id: 'a', text: 'A sequence of numbers' }, { id: 'b', text: 'A true/false value' }, { id: 'c', text: 'A sequence of text characters' }, { id: 'd', text: 'A list of items' }], correctId: 'c' },
    hints: [], explanation: 'Strings hold text — like "hello", names, messages, or any sequence of characters.', isKnowledgeCheck: true, xpReward: 20,
  },
  {
    id: 'aq3', ref: 'A-1.3',
    prompt: 'What happens when you run a function?',
    type: 'MULTIPLE_CHOICE',
    config: { options: [{ id: 'a', text: 'The code is deleted' }, { id: 'b', text: 'The code inside it executes' }, { id: 'c', text: 'A new file is created' }, { id: 'd', text: 'The variable is reset' }], correctId: 'b' },
    hints: [], explanation: 'Calling a function executes the block of code defined inside it. Functions let you reuse code.', isKnowledgeCheck: true, xpReward: 20,
  },
  {
    id: 'aq4', ref: 'A-1.4',
    prompt: 'What does an "if statement" do?',
    type: 'MULTIPLE_CHOICE',
    config: { options: [{ id: 'a', text: 'Repeats code a fixed number of times' }, { id: 'b', text: 'Runs code only when a condition is true' }, { id: 'c', text: 'Stores a value in a variable' }, { id: 'd', text: 'Defines a new function' }], correctId: 'b' },
    hints: [], explanation: 'If statements let code make decisions — run this block only when a condition is met.', isKnowledgeCheck: true, xpReward: 20,
  },
  {
    id: 'aq5', ref: 'A-1.5',
    prompt: 'Which best describes the Claude API?',
    type: 'MULTIPLE_CHOICE',
    config: { options: [{ id: 'a', text: 'A website for chatting' }, { id: 'b', text: 'A way to use Claude programmatically in your own code' }, { id: 'c', text: 'A tool for hosting websites' }, { id: 'd', text: 'A database for storing text' }], correctId: 'b' },
    hints: [], explanation: 'The Claude API lets you integrate Claude\'s intelligence into your own applications via HTTP requests.', isKnowledgeCheck: true, xpReward: 20,
  },
];

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function gradeLocally(question: ExerciseData, answer: unknown): boolean {
  if (question.type === 'MULTIPLE_CHOICE') {
    const config = question.config as Record<string, unknown>;
    return answer === config.correctId || answer === config.correctIndex;
  }
  return false;
}

export function Assessment() {
  const { moduleId } = useParams<{ moduleId: string }>();

  const [loading, setLoading] = useState(!IS_DEV_MODE);
  const [blockedTrack, setBlockedTrack] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [assessmentTitle, setAssessmentTitle] = useState('Module Assessment');
  const [timeLimit, setTimeLimit] = useState(15 * 60);
  const [passScore, setPassScore] = useState(70);
  const [questions, setQuestions] = useState<ExerciseData[]>(
    () => IS_DEV_MODE ? shuffleArray(DEMO_QUESTIONS) : []
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverResults, setServerResults] = useState<{
    score: number;
    passed: boolean;
    answers: Array<{ exerciseId: string; score: number; isCorrect: boolean }>;
  } | null>(null);

  useEffect(() => {
    if (IS_DEV_MODE) return;

    async function load() {
      setLoading(true);
      setBlockedTrack(null);
      setLoadFailed(false);
      try {
        const res: AssessmentResponse = await learningApi.getAssessment(moduleId ?? '');
        setAssessmentId(res.assessment.id);
        setAssessmentTitle(res.assessment.title);
        setTimeLimit(Math.max(res.assessment.timeLimit ?? 15, 1) * 60);
        setPassScore(res.assessment.passScore);

        const mapped: ExerciseData[] = res.questions.map((q) => ({
          id: q.id,
          ref: q.ref,
          prompt: q.prompt,
          type: q.type as ExerciseType,
          config: q.config as Record<string, unknown>,
          hints: q.hints,
          isKnowledgeCheck: true,
          xpReward: 20,
        }));
        setQuestions(shuffleArray(mapped));
      } catch (err) {
        // Never fall back to demo questions: a locked or failed assessment must say so.
        if (err instanceof ApiError && err.status === 403) setBlockedTrack(String(err.body.trackId ?? ''));
        else setLoadFailed(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [moduleId, attempt]);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  // ------ scoring ------
  const results = useMemo(() => {
    if (!submitted) return null;

    // If we have server results, use those
    if (serverResults) {
      const correct = serverResults.answers.filter((a) => a.isCorrect).length;
      const score = serverResults.score / 100;
      // Server awards a flat MODULE_ASSESSMENT_PASS (100 XP) regardless of how
      // many questions were answered correctly — match that here.
      const totalXp = serverResults.passed ? 100 : 0;
      const details = questions.map((q) => {
        const sa = serverResults.answers.find((a) => a.exerciseId === q.id);
        return { question: q, isCorrect: sa?.isCorrect ?? false };
      });
      return { correct, totalQuestions, score, passed: serverResults.passed, totalXp, details };
    }

    // Local fallback grading
    let correct = 0;
    let totalXp = 0;
    const details = questions.map((q) => {
      const isCorrect = gradeLocally(q, answers[q.id]);
      if (isCorrect) { correct++; totalXp += q.xpReward; }
      return { question: q, isCorrect };
    });
    const score = totalQuestions > 0 ? correct / totalQuestions : 0;
    const passed = score >= (passScore / 100);
    return { correct, totalQuestions, score, passed, totalXp, details };
  }, [submitted, questions, answers, totalQuestions, serverResults, passScore]);

  // ------ handlers ------
  const handleAnswer = useCallback((answer: unknown) => {
    const q = questions[currentIndex];
    setAnswers((prev) => ({ ...prev, [q.id]: answer }));
  }, [questions, currentIndex]);

  const handleSubmit = useCallback(async () => {
    setSubmitted(true);

    // Try server submission
    if (assessmentId) {
      try {
        const res = await learningApi.submitAssessment(
          assessmentId,
          Object.entries(answers).map(([exerciseId, answer]) => ({ exerciseId, answer })),
        );
        setServerResults({
          score: res.attempt.score,
          passed: res.attempt.passed,
          answers: res.answers,
        });
      } catch {
        // Fall through to local grading
      }
    }
  }, [assessmentId, answers]);

  const handleTimeUp = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1));

  if (blockedTrack !== null) return <LockedCard what="assessment" trackId={blockedTrack} />;
  if (loadFailed) return <LoadFailedCard onRetry={() => setAttempt((n) => n + 1)} />;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4xl)' }}>
        <LoadingSpinner />
      </div>
    );
  }

  // ------ results screen ------
  if (submitted && results) {
    const scorePercent = Math.round(results.score * 100);

    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <Card style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-2xl)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: results.passed ? 'rgba(90,158,106,0.12)' : 'rgba(196,107,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-xl)' }}>
            <span style={{ fontSize: '2rem' }}>{results.passed ? '\u2713' : '\u2717'}</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 600, color: results.passed ? 'var(--success)' : 'var(--rust)', marginBottom: 'var(--space-sm)' }}>
            {results.passed ? 'Assessment Passed' : 'Assessment Not Passed'}
          </h1>

          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>
            {assessmentTitle}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3xl)', marginBottom: 'var(--space-2xl)' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: results.passed ? 'var(--success)' : 'var(--rust)', lineHeight: 1, marginBottom: 'var(--space-xs)' }}>{scorePercent}%</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</p>
            </div>
            <div style={{ width: 1, background: 'var(--bg-border)' }} />
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--gold)', lineHeight: 1, marginBottom: 'var(--space-xs)' }}>+{results.totalXp}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>XP Earned</p>
            </div>
            <div style={{ width: 1, background: 'var(--bg-border)' }} />
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 'var(--space-xs)' }}>{results.correct}/{results.totalQuestions}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Correct</p>
            </div>
          </div>

          <ProgressBar value={scorePercent} color={results.passed ? 'var(--success)' : 'var(--rust)'} height={6} />

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: 'var(--space-sm)', marginBottom: 'var(--space-2xl)' }}>
            {results.passed ? `Congratulations! You met the ${passScore}% passing threshold.` : `You need ${passScore}% to pass. Review the material and try again.`}
          </p>

          {/* Question breakdown */}
          <div style={{ textAlign: 'left', marginBottom: 'var(--space-2xl)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--space-md)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Question Breakdown</h3>
            {results.details.map((d, i) => (
              <div key={d.question.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) 0', borderBottom: i < results.details.length - 1 ? '1px solid var(--bg-border)' : undefined }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, background: d.isCorrect ? 'rgba(90,158,106,0.15)' : 'rgba(196,107,58,0.15)', color: d.isCorrect ? 'var(--success)' : 'var(--rust)', flexShrink: 0 }}>
                  {d.isCorrect ? '\u2713' : '\u2717'}
                </span>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, flex: 1 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Q{i + 1}.</strong>{' '}
                  {d.question.prompt.length > 80 ? d.question.prompt.slice(0, 80) + '...' : d.question.prompt}
                </p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-md)' }}>
            <Link to="/dashboard"><Button variant="ghost">Back to Dashboard</Button></Link>
            {!results.passed && (
              <Button variant="primary" onClick={() => { setSubmitted(false); setAnswers({}); setCurrentIndex(0); setServerResults(null); }}>
                Retry Assessment
              </Button>
            )}
            {results.passed && <Link to="/dashboard"><Button variant="primary">Continue Learning</Button></Link>}
          </div>
        </Card>
      </div>
    );
  }

  // ------ assessment screen ------
  if (questions.length === 0) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-4xl) var(--space-xl)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No questions available for this assessment yet.</p>
        <Link to="/dashboard"><Button variant="primary" style={{ marginTop: 'var(--space-xl)' }}>Back to Dashboard</Button></Link>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <SEO title={assessmentTitle} description={`Module assessment — ${totalQuestions} questions. Test your knowledge and earn XP.`} noIndex />
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
          <Link to="/dashboard" style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', textDecoration: 'none' }}>Dashboard</Link>
          <span style={{ color: 'var(--text-tertiary)' }}>/</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontFamily: 'var(--font-display)' }}>Assessment</span>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>{assessmentTitle}</h1>
          <ExerciseTimer timeLimit={timeLimit} onTimeUp={handleTimeUp} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span style={{ fontFamily: 'var(--font-code)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            {answeredCount}/{totalQuestions} answered
          </span>
        </div>
        <ProgressBar value={(answeredCount / totalQuestions) * 100} color="var(--signal)" height={4} />
      </div>

      {/* Question dots */}
      <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
        {questions.map((q, i) => {
          const isAnswered = q.id in answers;
          const isCurrent = i === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to question ${i + 1}${isAnswered ? ' (answered)' : ''}`}
              style={{
                width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                border: isCurrent ? '2px solid var(--signal)' : '1px solid var(--bg-border)',
                background: isAnswered ? 'var(--bg-elevated)' : 'transparent',
                color: isCurrent ? 'var(--signal)' : isAnswered ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <ExerciseRenderer key={currentQuestion.id} exercise={currentQuestion} onSubmit={handleAnswer} disabled={false} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--bg-border)' }}>
        <Button variant="ghost" onClick={goPrev} disabled={currentIndex === 0}>&larr; Previous</Button>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          {currentIndex < totalQuestions - 1 && <Button variant="secondary" onClick={goNext}>Next &rarr;</Button>}
          <Button variant="primary" onClick={handleSubmit} disabled={answeredCount === 0} style={answeredCount < totalQuestions ? { opacity: 0.8 } : undefined}>
            {answeredCount < totalQuestions ? `Submit (${answeredCount}/${totalQuestions})` : 'Submit Assessment'}
          </Button>
        </div>
      </div>

      {answeredCount < totalQuestions && answeredCount > 0 && (
        <p style={{ fontSize: '0.75rem', color: 'var(--warning)', textAlign: 'right', marginTop: 'var(--space-sm)' }}>
          {totalQuestions - answeredCount} question{totalQuestions - answeredCount !== 1 ? 's' : ''} unanswered
        </p>
      )}
    </div>
  );
}
