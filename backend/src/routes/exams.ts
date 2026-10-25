// @ts-nocheck
import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { entitlementsMiddleware, type EntitledRequest } from '../middleware/entitlements.js';
import { XP_REWARDS, levelFromXp } from '../lib/gamification.js';
import { sanitizeExerciseConfig } from '../lib/sanitizeExercise.js';
import { getExerciseFeedback } from '../lib/claude.js';
import crypto from 'crypto';

const router = Router();

// The 4 career tracks are where the platform's actual thesis — "machines
// handle information, humans handle transformation" — has to be tested for
// real. Their certification exams draw in a small number of AI-graded
// OPEN_ENDED judgment questions alongside the multiple-choice bank, so the
// exam isn't testing pure recall of a bank the learner already saw worked
// examples of. Added 2026-08-05 after the expert advisory board flagged that
// no exam anywhere tested judgment despite it being the whole premise. See
// BUSINESS_MODEL.md for the full reasoning.
const CAREER_TRACK_IDS = [
  'ai-orchestrated-dev',
  'ai-workflow-consulting',
  'ai-oversight-health-informatics',
  'accessibility-qa-lived-experience',
];
const OPEN_ENDED_EXAM_COUNT = 2;

// Cooldown after a failed attempt — not a hard attempt cap (someone in a
// flare may genuinely need several tries), but a real integrity measure so a
// failed attempt can't be immediately re-guessed against the same shuffled
// bank a minute later. Framed to the learner as review time, not punishment.
const RETRY_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours

// Exercise has no real Prisma relation to CompetencyDomain — only a bare
// `domainId` scalar (see schema.prisma; DomainMastery does declare the
// relation, Exercise doesn't). A `domain: { trackId }` nested filter on
// Exercise is invalid and throws PrismaClientValidationError at runtime —
// found 2026-08-04 while fixing an unrelated scoring bug, when the exact
// same query pattern used in both handlers below turned out to have never
// worked. Resolve trackId -> domain IDs first, then filter by domainId.
async function getDomainIdsForTrack(trackId: string): Promise<string[]> {
  const domains = await prisma.competencyDomain.findMany({
    where: { trackId },
    select: { id: true },
  });
  return domains.map((d) => d.id);
}

/** Null if the learner can attempt now, else the ISO timestamp they can retry
 * at. Checked on GET so the pre-exam screen can show this BEFORE someone
 * spends the effort of taking the whole exam — telling them only after
 * submission would waste real spoons on a blocked attempt. POST re-checks
 * the same thing as a backstop in case of stale client state. */
async function getRetryCooldown(examId: string, userId: string): Promise<string | null> {
  const lastAttempt = await prisma.examAttempt.findFirst({
    where: { examId, userId },
    orderBy: { completedAt: 'desc' },
  });
  if (!lastAttempt || lastAttempt.passed || !lastAttempt.completedAt) return null;
  const readyAt = new Date(lastAttempt.completedAt.getTime() + RETRY_COOLDOWN_MS);
  return readyAt > new Date() ? readyAt.toISOString() : null;
}

// Get exam info and questions for a track (requires paid access)
router.get('/:trackId', authMiddleware, entitlementsMiddleware, async (req, res) => {
  try {
    const entReq = req as EntitledRequest;
    const { trackId } = req.params;

    // Exams require paid access — no free tier
    if (!entReq.credentialAccess?.includes(trackId)) {
      res.status(403).json({
        error: 'Credential purchase required',
        message: 'Purchase this track\'s Credential to take the certification exam.',
      });
      return;
    }

    const exam = await prisma.trackExam.findUnique({
      where: { trackId },
    });

    if (!exam) {
      res.status(404).json({ error: 'Exam not found for this track' });
      return;
    }

    const cooldownUntil = await getRetryCooldown(exam.id, entReq.userId!);

    // Pull MULTIPLE_CHOICE exercises from all domains in this track (direct join — no lesson required)
    const trackDomainIds = await getDomainIdsForTrack(trackId);
    const exerciseSelect = {
      id: true,
      ref: true,
      prompt: true,
      type: true,
      config: true,
      difficulty: true,
      bloomLevel: true,
      domainId: true,
      timeEstimate: true,
    } as const;
    // Deliberately NOT selecting `explanation` here — for OPEN_ENDED questions
    // that field is the AI grader's reference answer and must never reach the
    // client before submission.
    const exercises = await prisma.exercise.findMany({
      where: {
        isActive: true,
        type: 'MULTIPLE_CHOICE',
        domainId: { in: trackDomainIds },
      },
      select: exerciseSelect,
    });

    // Shuffle and limit to exam question count
    const shuffled = shuffleArray(exercises);
    const mcQuestions = shuffled.slice(0, exam.questionCount);

    // Career tracks: fold in a couple of AI-graded open-ended judgment
    // questions so the exam isn't pure multiple-choice recall.
    let oeQuestions: typeof mcQuestions = [];
    if (CAREER_TRACK_IDS.includes(trackId)) {
      const oePool = await prisma.exercise.findMany({
        where: { isActive: true, type: 'OPEN_ENDED', domainId: { in: trackDomainIds } },
        select: exerciseSelect,
      });
      oeQuestions = shuffleArray(oePool).slice(0, OPEN_ENDED_EXAM_COUNT);
    }

    // Sanitize — remove correct answers (OPEN_ENDED exercises carry no
    // answer-revealing config, so this is a no-op for them, but shares the
    // same code path for consistency).
    const sanitizedQuestions = [...mcQuestions, ...oeQuestions].map((q) => ({
      ...q,
      config: sanitizeExerciseConfig(parseJson(q.config) as Record<string, unknown>),
    }));

    res.json({
      exam: {
        id: exam.id,
        trackId: exam.trackId,
        title: exam.title,
        description: exam.description,
        timeLimit: exam.timeLimit,
        passScore: exam.passScore,
        questionCount: sanitizedQuestions.length,
        openEndedCount: oeQuestions.length,
        cooldownUntil,
      },
      questions: sanitizedQuestions,
    });
  } catch (err) {
    console.error('Exam get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit exam attempt (requires paid access)
router.post('/:examId/attempt', authMiddleware, entitlementsMiddleware, async (req, res) => {
  try {
    const authReq = req as EntitledRequest;
    const { examId } = req.params;
    const { answers } = req.body as {
      answers: Array<{ exerciseId: string; answer: unknown }>;
    };

    if (!answers || !Array.isArray(answers)) {
      res.status(400).json({ error: 'Answers array is required' });
      return;
    }

    // Deduplicate submitted answers by exerciseId (keep first occurrence).
    // Without this, a client could submit the same correct exerciseId many
    // times to inflate the numerator against a fixed server-computed
    // denominator, pushing the score past 100% and forging a passing
    // Certificate.
    const seenExerciseIds = new Set<string>();
    const dedupedAnswers = answers.filter(({ exerciseId }) => {
      if (seenExerciseIds.has(exerciseId)) return false;
      seenExerciseIds.add(exerciseId);
      return true;
    });

    const exam = await prisma.trackExam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      res.status(404).json({ error: 'Exam not found' });
      return;
    }

    // Verify paid access for this track
    if (!authReq.credentialAccess?.includes(exam.trackId)) {
      res.status(403).json({
        error: 'Credential purchase required',
        message: 'Purchase this track\'s Credential to submit the certification exam.',
      });
      return;
    }

    // Cooldown after a failed attempt — real exam integrity, not a hard cap.
    // A learner can retry as many times as they need; they just can't
    // immediately re-guess the same shuffled bank a minute after failing it.
    // The pre-exam screen already checks this via GET so a blocked attempt
    // shouldn't reach here in the normal flow — this is the backstop.
    const cooldownUntil = await getRetryCooldown(examId, authReq.userId!);
    if (cooldownUntil) {
      res.status(429).json({
        error: 'Retry cooldown active',
        message: 'Take a little time before retrying — this exam draws from the same practice bank, so an immediate re-guess isn\'t a real second attempt. You can try again once the cooldown ends.',
        retryAt: cooldownUntil,
      });
      return;
    }

    // The exam's configured questionCount can exceed the track's actual
    // MULTIPLE_CHOICE pool (e.g. a legacy track authored mostly with other
    // exercise types) — the GET /:trackId handler already serves min(pool,
    // questionCount) questions, but scoring here previously divided by the
    // configured questionCount regardless, silently making some tracks'
    // exams mathematically impossible to pass even at 100% correct. Compute
    // the real served count the same way GET does, independent of what the
    // client submits, so scoring can't be gamed by submitting fewer answers.
    const attemptTrackDomainIds = await getDomainIdsForTrack(exam.trackId);
    const realPoolSize = await prisma.exercise.count({
      where: { isActive: true, type: 'MULTIPLE_CHOICE', domainId: { in: attemptTrackDomainIds } },
    });
    const mcServedCount = Math.min(exam.questionCount ?? realPoolSize, realPoolSize) || 1;

    // Career tracks fold in a couple of AI-graded open-ended questions (see
    // CAREER_TRACK_IDS above) — count how many were actually served so the
    // scoring denominator matches GET /:trackId exactly.
    const isCareerTrack = CAREER_TRACK_IDS.includes(exam.trackId);
    let oeServedCount = 0;
    if (isCareerTrack) {
      const oePoolSize = await prisma.exercise.count({
        where: { isActive: true, type: 'OPEN_ENDED', domainId: { in: attemptTrackDomainIds } },
      });
      oeServedCount = Math.min(OPEN_ENDED_EXAM_COUNT, oePoolSize);
    }
    const servedQuestionCount = mcServedCount + oeServedCount;

    // Fetch only exercises that actually belong to THIS exam's servable
    // pool (this track's domains, and only the types this exam serves).
    // Deduping by exerciseId (above) only blocks resubmitting the SAME id —
    // it does nothing to stop a client from submitting many *distinct*
    // exerciseIds it doesn't actually own for this exam (e.g. harvested
    // from a different, easier track's GET /:trackId response, or from
    // ordinary lesson practice exercises). Since scoredAnswers.length was
    // never bounded by servedQuestionCount, that would let a client rack up
    // far more than servedQuestionCount scored 100s and blow totalScore
    // past 100% — the exact same fixed-denominator/inflated-numerator
    // exploit this fix is supposed to close, just via foreign ids instead
    // of repeated ones. Restricting the query to this exam's own pool means
    // any exerciseId outside it simply won't resolve in exerciseMap below
    // and is skipped, so scoredAnswers can never exceed servedQuestionCount.
    const exerciseIds = dedupedAnswers.map((a) => a.exerciseId);
    const exercises = await prisma.exercise.findMany({
      where: {
        id: { in: exerciseIds },
        isActive: true,
        domainId: { in: attemptTrackDomainIds },
        type: isCareerTrack ? { in: ['MULTIPLE_CHOICE', 'OPEN_ENDED'] } : 'MULTIPLE_CHOICE',
      },
    });

    const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

    // Score each answer. OPEN_ENDED questions are graded by the same AI
    // grader practice exercises use (backend/src/lib/claude.ts). If grading
    // itself fails (API outage, timeout), that's our infrastructure failing,
    // not the learner — award full credit for that question rather than
    // fail someone's certification exam over a transient error on our end.
    const scoredAnswers: Array<{
      exerciseId: string;
      answer: unknown;
      score: number;
      isCorrect: boolean;
    }> = [];

    // Even restricted to this exam's own domain/type pool, the pool itself
    // can be larger than what's actually served for one attempt (GET
    // /:trackId shuffles and slices to questionCount/OPEN_ENDED_EXAM_COUNT)
    // — repeated GETs hand out different random slices, so a client polling
    // it enough times can harvest more distinct valid ids than one attempt
    // is meant to have. Hard-cap how many of each type get scored to the
    // served counts computed above, so scoredAnswers can never exceed
    // servedQuestionCount and totalScore can never mathematically exceed
    // 100% regardless of how many extra (even genuinely correct) answers a
    // client submits.
    let mcScoredSoFar = 0;
    let oeScoredSoFar = 0;

    for (const { exerciseId, answer } of dedupedAnswers) {
      const exercise = exerciseMap.get(exerciseId);
      if (!exercise) continue;

      if (exercise.type === 'OPEN_ENDED') {
        if (oeScoredSoFar >= oeServedCount) continue;
        oeScoredSoFar += 1;
        const grade = await getExerciseFeedback(
          exercise.prompt,
          exercise.explanation ?? null,
          String(answer ?? ''),
          exercise.type,
          exam.trackId,
        );
        if (grade.graded && grade.score !== null) {
          scoredAnswers.push({ exerciseId, answer, score: grade.score, isCorrect: grade.isCorrect ?? grade.score >= 60 });
        } else {
          console.warn('[exams] AI grading failed for open-ended exam question %s — awarding full credit rather than failing the learner for our infra issue.', exerciseId);
          scoredAnswers.push({ exerciseId, answer, score: 100, isCorrect: true });
        }
        continue;
      }

      if (mcScoredSoFar >= mcServedCount) continue;
      mcScoredSoFar += 1;

      // A malformed answer (null, wrong shape) must score 0 for that
      // question, not throw and 500 the whole attempt.
      let result = { score: 0, isCorrect: false };
      try {
        result = scoreAnswer(exercise, answer);
      } catch (err) {
        console.warn('[exams] Could not score answer for %s, scoring 0:', exerciseId, err);
      }
      scoredAnswers.push({ exerciseId, answer, score: result.score, isCorrect: result.isCorrect });
    }

    // Denominator = the actual served question count (min of configured
    // questionCount and real MC pool size), not the raw configured
    // questionCount — so unanswered questions still count as 0, but a
    // learner who answers every question they were actually served
    // correctly can reach 100%, not be capped below their own passScore.
    const totalScore =
      scoredAnswers.length > 0
        ? scoredAnswers.reduce((sum, a) => sum + a.score, 0) / servedQuestionCount
        : 0;

    const passed = totalScore >= (exam.passScore ?? 75);

    // Create exam attempt
    const attempt = await prisma.examAttempt.create({
      data: {
        examId,
        userId: authReq.userId!,
        score: totalScore,
        passed,
        completedAt: new Date(),
        answers: JSON.stringify(scoredAnswers),
      },
    });

    let certificate = null;

    if (passed) {
      // Award XP
      const gam = await prisma.gamification.upsert({
        where: { userId: authReq.userId! },
        create: { userId: authReq.userId!, totalXp: XP_REWARDS.FINAL_EXAM_PASS },
        update: { totalXp: { increment: XP_REWARDS.FINAL_EXAM_PASS } },
      });

      const newLevel = levelFromXp(gam.totalXp);
      if (newLevel !== gam.level) {
        await prisma.gamification.update({
          where: { userId: authReq.userId! },
          data: { level: newLevel },
        });
      }

      // Create certificate — on re-pass, preserve the existing verifyCode so
      // previously issued certificates remain verifiable.
      const existing = await prisma.certificate.findUnique({
        where: { userId_trackId: { userId: authReq.userId!, trackId: exam.trackId } },
      });
      const verifyCode = existing?.verifyCode ?? crypto.randomBytes(16).toString('hex').toUpperCase();

      certificate = await prisma.certificate.upsert({
        where: {
          userId_trackId: { userId: authReq.userId!, trackId: exam.trackId },
        },
        create: {
          userId: authReq.userId!,
          trackId: exam.trackId,
          examScore: totalScore,
          verifyCode,
        },
        update: {
          examScore: totalScore,
          issuedAt: new Date(),
          verifyCode, // preserve existing code (no-op on re-pass, correct on first pass)
        },
      });

      // Link certificate to attempt
      await prisma.examAttempt.update({
        where: { id: attempt.id },
        data: { certificateId: certificate.id },
      });
    }

    res.json({
      attempt: {
        id: attempt.id,
        score: totalScore,
        passed,
        completedAt: attempt.completedAt,
      },
      answers: scoredAnswers,
      certificate: certificate
        ? {
            id: certificate.id,
            verifyCode: certificate.verifyCode,
            issuedAt: certificate.issuedAt,
          }
        : null,
    });
  } catch (err) {
    console.error('Exam attempt error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function scoreAnswer(
  exercise: { type: string; config: unknown },
  answer: unknown,
): { score: number; isCorrect: boolean } {
  const config = (parseJson(exercise.config) ?? {}) as Record<string, unknown>;

  if (!config || typeof config !== 'object') {
    return { score: 0, isCorrect: false };
  }

  switch (exercise.type) {
    case 'MULTIPLE_CHOICE': {
      // The real seed-data shape is options: [{text, correct: boolean}] —
      // config.correctIndex/correctId are only present on a handful of
      // older/alternate exercises. Derive the index from options[].correct
      // when correctIndex isn't set (see the identical fix + comment in
      // exercises.ts's scoreExercise — this was a real, previously-shipped
      // bug affecting every multiple-choice exam question on the platform).
      const options = config.options as Array<{ correct?: boolean }> | undefined;
      const derivedIndex = options?.findIndex((o) => o.correct === true);
      const correctIndex = typeof config.correctIndex === 'number'
        ? (config.correctIndex as number)
        : (derivedIndex !== undefined && derivedIndex >= 0 ? derivedIndex : undefined);
      const correctId = config.correctId as string | undefined;
      const selected = typeof answer === 'number'
        ? answer
        : typeof answer === 'string' && !isNaN(Number(answer))
          ? Number(answer)
          : (answer as { selectedIndex?: number })?.selectedIndex;
      const selectedId = (answer as { selectedId?: string })?.selectedId
        ?? (typeof answer === 'string' ? answer : undefined);
      const isCorrect =
        (correctIndex !== undefined && selected === correctIndex) ||
        (correctId !== undefined && selectedId === correctId);
      return { score: isCorrect ? 100 : 0, isCorrect };
    }

    case 'TRUE_FALSE_JUSTIFY': {
      const correctAnswer = config.correctAnswer as boolean;
      const userAnswer = answer as { value: boolean };
      const isCorrect = userAnswer.value === correctAnswer;
      return { score: isCorrect ? 100 : 0, isCorrect };
    }

    case 'MATCHING': {
      const rawPairs = config.pairs as Array<{ left: string; right: string }> | undefined;
      const correctMap: Record<string, string> = {};
      if (rawPairs?.length) {
        for (const p of rawPairs) correctMap[p.left] = p.right;
      } else {
        const cp = config.correctPairs as Array<[string, string]> | undefined;
        if (cp?.length) for (const [l, r] of cp) correctMap[l] = r;
      }
      const total = Object.keys(correctMap).length;
      if (total === 0) return { score: 0, isCorrect: false };
      const userMap: Record<string, string> = {};
      if (Array.isArray(answer)) {
        for (const pair of answer as Array<[string, string]>) userMap[pair[0]] = pair[1];
      } else {
        Object.assign(userMap, answer as Record<string, string>);
      }
      let correct = 0;
      for (const [left, right] of Object.entries(correctMap)) {
        if (userMap[left] === right) correct++;
      }
      const score = Math.round((correct / total) * 100);
      return { score, isCorrect: score >= 70 };
    }

    case 'SEQUENCING': {
      const correctOrder = config.correctOrder as string[];
      const userOrder = answer as string[];
      let correct = 0;
      for (let i = 0; i < correctOrder.length; i++) {
        if (userOrder[i] === correctOrder[i]) correct++;
      }
      const score = Math.round((correct / correctOrder.length) * 100);
      return { score, isCorrect: score >= 70 };
    }

    case 'FILL_IN_BLANK': {
      const blanks = config.blanks as Array<{ answer: string; alternatives?: string[] }> | undefined;
      if (blanks?.length) {
        const userAnswers = Array.isArray(answer) ? answer : [String(answer)];
        let correct = 0;
        for (let i = 0; i < blanks.length; i++) {
          const blank = blanks[i];
          const userVal = (userAnswers[i] ?? '').toString().toLowerCase().trim();
          const acceptable = [blank.answer, ...(blank.alternatives ?? [])].map((a) => a.toLowerCase().trim());
          if (acceptable.includes(userVal)) correct++;
        }
        const score = Math.round((correct / blanks.length) * 100);
        return { score, isCorrect: score >= 70 };
      }
      const acceptableArr = config.acceptableAnswers as string[] | undefined;
      if (!acceptableArr?.length) return { score: 0, isCorrect: false };
      const acceptable = acceptableArr.map((a) => a.toLowerCase().trim());
      const userAnswer = String(answer).toLowerCase().trim();
      const isCorrect = acceptable.includes(userAnswer);
      return { score: isCorrect ? 100 : 0, isCorrect };
    }

    case 'CATEGORIZATION': {
      let correctCategories = config.correctCategories as Record<string, string[]> | undefined;
      if (!correctCategories) {
        const items = config.items as Array<{ text: string; category: string }> | undefined;
        if (items?.length) {
          correctCategories = {};
          for (const item of items) {
            if (!correctCategories[item.category]) correctCategories[item.category] = [];
            correctCategories[item.category].push(item.text);
          }
        }
      }
      if (!correctCategories) return { score: 0, isCorrect: false };
      const userCategories = answer as Record<string, string[]>;
      let total = 0;
      let correct = 0;
      for (const [cat, items] of Object.entries(correctCategories)) {
        for (const item of items) {
          total++;
          if (userCategories[cat]?.includes(item)) correct++;
        }
      }
      const score = total > 0 ? Math.round((correct / total) * 100) : 0;
      return { score, isCorrect: score >= 70 };
    }

    default:
      console.warn('[exams] Unrecognized exercise type: %s — scoring 0', exercise.type);
      return { score: 0, isCorrect: false };
  }
}

/** Parse a JSON string if needed (SQLite stores Json fields as strings). */
function parseJson(val: unknown): unknown {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

export default router;
