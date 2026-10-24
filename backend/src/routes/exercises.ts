// @ts-nocheck
import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { entitlementsMiddleware, type EntitledRequest } from '../middleware/entitlements.js';
import { XP_REWARDS, levelFromXp } from '../lib/gamification.js';
import { getExerciseFeedback } from '../lib/claude.js';
import { isTrialLesson } from '../lib/access.js';

const router = Router();

// Submit exercise answer
router.post('/:exerciseId/submit', authMiddleware, entitlementsMiddleware, async (req, res) => {
  try {
    const authReq = req as EntitledRequest;
    const { exerciseId } = req.params;
    const { answer } = req.body;

    if (answer === undefined || answer === null || answer === '') {
      res.status(400).json({ error: 'Answer is required' });
      return;
    }
    const answerStr = typeof answer === 'string' ? answer : JSON.stringify(answer);
    if (answerStr.length > 8000) {
      res.status(400).json({ error: 'Answer exceeds maximum length' });
      return;
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: {
        lesson: {
          include: {
            module: {
              include: { domain: true },
            },
          },
        },
      },
    });

    if (!exercise || !exercise.isActive) {
      res.status(404).json({ error: 'Exercise not found' });
      return;
    }

    // Check track access — the trial lesson is open, everything else needs the track
    const trackId = exercise.lesson?.module?.domain?.trackId;
    if (trackId && !isTrialLesson(exercise.lesson) && !authReq.trackAccess?.includes(trackId)) {
      res.status(403).json({
        error: 'Track access required',
        message: "You need the full track to read this. The first lesson of every track is a free trial.",
      });
      return;
    }

    // Count previous attempts
    const previousAttempts = await prisma.submission.count({
      where: { userId: authReq.userId!, exerciseId },
    });

    // Score the answer.
    //
    // Deterministic types (multiple choice, matching, sequencing, …) are scored
    // locally. OPEN_ENDED has no correct-answer key to compare against — it used
    // to fall through to a flat score of 50 and "Your answer has been recorded
    // and will be reviewed", by nobody. That made "AI grades every answer with
    // written feedback" untrue for exactly the exercises the claim was about,
    // because the Claude-backed grader lives behind /api/feedback and the
    // frontend only ever posts here. Route open-ended answers to it directly.
    let score: number | null;
    let isCorrect: boolean | null;
    let feedback: string;
    let graded = true;

    if (exercise.type === 'OPEN_ENDED') {
      const trackId = exercise.lesson?.module?.domain?.trackId ?? 'default';
      const grade = await getExerciseFeedback(
        exercise.prompt,
        // No rubric exists for open-ended items: `config` is empty by design and
        // `explanation` is the learner-facing model answer shown afterwards.
        // Passing it as the expected answer is what makes grading consistent
        // rather than an unanchored vibe check.
        exercise.explanation ?? null,
        String(answer),
        exercise.type,
        trackId,
      );
      graded = grade.graded;
      score = grade.score;
      isCorrect = grade.isCorrect;
      feedback = grade.feedback;
    } else {
      const local = scoreExercise(exercise, answer);
      score = local.score;
      isCorrect = local.isCorrect;
      feedback = local.feedback;
    }

    // Create submission. A failed AI grade stores null rather than a fabricated
    // zero — the learner's work is kept, and they can retry without a bogus
    // score on their record.
    const submission = await prisma.submission.create({
      data: {
        exerciseId,
        userId: authReq.userId!,
        answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
        score,
        isCorrect,
        feedback,
        attemptNumber: previousAttempts + 1,
      },
    });

    // Award XP (only on first correct attempt or first attempt for knowledge
    // checks). Skipped when the AI grader failed — the attempt isn't scored, so
    // it shouldn't consume the learner's one first-attempt XP award either.
    if (previousAttempts === 0 && graded) {
      const xpAmount = exercise.isKnowledgeCheck
        ? XP_REWARDS.KNOWLEDGE_CHECK
        : isCorrect
          ? XP_REWARDS.GRADED_EXERCISE_CORRECT
          : XP_REWARDS.GRADED_EXERCISE_INCORRECT;

      const gam = await prisma.gamification.upsert({
        where: { userId: authReq.userId! },
        create: { userId: authReq.userId!, totalXp: xpAmount },
        update: { totalXp: { increment: xpAmount } },
      });

      // Update level
      const newLevel = levelFromXp(gam.totalXp);
      if (newLevel !== gam.level) {
        await prisma.gamification.update({
          where: { userId: authReq.userId! },
          data: { level: newLevel },
        });
      }
    }

    res.status(graded ? 200 : 503).json({
      graded,
      submission: {
        id: submission.id,
        score,
        isCorrect,
        feedback,
        attemptNumber: submission.attemptNumber,
      },
      // Don't reveal the model answer when we couldn't actually grade — the
      // learner will want to retry, and showing it first would spoil that.
      explanation: graded ? exercise.explanation : undefined,
      hints: graded && !isCorrect ? parseJson(exercise.hints) : [],
    });
  } catch (err) {
    console.error('Exercise submit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** Score an exercise based on its type and config. */
function scoreExercise(
  exercise: { type: string; config: unknown },
  answer: unknown,
): { score: number; isCorrect: boolean; feedback: string } {
  const rawConfig = exercise.config;
  const config = (typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig ?? {}) as Record<string, unknown>;

  if (!config || typeof config !== 'object') {
    return { score: 50, isCorrect: false, feedback: 'Exercise configuration error. Your answer has been recorded.' };
  }

  switch (exercise.type) {
    case 'MULTIPLE_CHOICE': {
      // The real seed-data shape is options: [{text, correct: boolean}] —
      // config.correctIndex is only present on a handful of older/alternate
      // exercises. Derive the index from options[].correct when
      // correctIndex isn't set, rather than requiring every exercise file
      // to carry a redundant field. (This was a real, previously-shipped
      // bug: correctIndex was absent on essentially every exercise, so
      // every multiple-choice submission scored as incorrect regardless
      // of what the learner picked.)
      const options = config.options as Array<{ correct?: boolean }> | undefined;
      const derivedIndex = options?.findIndex((o) => o.correct === true);
      const correct = typeof config.correctIndex === 'number'
        ? (config.correctIndex as number)
        : (derivedIndex !== undefined && derivedIndex >= 0 ? derivedIndex : undefined);
      // Frontend sends raw index (number) or {selectedIndex: number}
      const selected = typeof answer === 'number'
        ? answer
        : typeof answer === 'string' && !isNaN(Number(answer))
          ? Number(answer)
          : (answer as { selectedIndex: number })?.selectedIndex;
      const isCorrect = correct !== undefined && selected === correct;
      return {
        score: isCorrect ? 100 : 0,
        isCorrect,
        feedback: isCorrect ? 'Correct!' : 'Incorrect. Review the explanation below.',
      };
    }

    case 'TRUE_FALSE_JUSTIFY': {
      const correctAnswer = config.correctAnswer as boolean;
      const userAnswer = answer as { value: boolean; justification?: string };
      const isCorrect = userAnswer.value === correctAnswer;
      return {
        score: isCorrect ? 100 : 0,
        isCorrect,
        feedback: isCorrect
          ? 'Correct!'
          : `The correct answer is ${correctAnswer}. See the explanation for details.`,
      };
    }

    case 'MATCHING': {
      // Support two seed formats: {pairs:[{left,right}]} and {correctPairs:[[l,r]]}
      const rawPairs = config.pairs as Array<{ left: string; right: string }> | undefined;
      const correctMap: Record<string, string> = {};
      if (rawPairs?.length) {
        for (const p of rawPairs) correctMap[p.left] = p.right;
      } else {
        const cp = config.correctPairs as Array<[string, string]> | undefined;
        if (cp?.length) for (const [l, r] of cp) correctMap[l] = r;
      }
      const total = Object.keys(correctMap).length;
      if (total === 0) return { score: 0, isCorrect: false, feedback: 'Exercise configuration error.' };
      // Accept answer as Record<string,string> (frontend) or Array<[string,string]>
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
      return {
        score,
        isCorrect: score >= 70,
        feedback:
          score >= 70
            ? `Well done! ${correct}/${total} correct.`
            : `${correct}/${total} correct. Try again.`,
      };
    }

    case 'SEQUENCING': {
      const correctOrder = config.correctOrder as string[];
      const userOrder = answer as string[];
      let correct = 0;
      for (let i = 0; i < correctOrder.length; i++) {
        if (userOrder[i] === correctOrder[i]) correct++;
      }
      const score = Math.round((correct / correctOrder.length) * 100);
      return {
        score,
        isCorrect: score >= 70,
        feedback:
          score >= 70
            ? `Great sequencing! ${correct}/${correctOrder.length} in the right position.`
            : `${correct}/${correctOrder.length} in the right position. Review and try again.`,
      };
    }

    case 'FILL_IN_BLANK': {
      // Config may have `acceptableAnswers` (flat list) or `blanks` (array of {answer, alternatives})
      const blanks = config.blanks as Array<{ answer: string; alternatives?: string[] }> | undefined;
      const acceptableAnswers = config.acceptableAnswers as string[] | undefined;

      if (blanks && Array.isArray(blanks)) {
        // Multi-blank format: answer is an array of strings
        const userAnswers = Array.isArray(answer) ? answer : [String(answer)];
        let correct = 0;
        for (let i = 0; i < blanks.length; i++) {
          const blank = blanks[i];
          const userVal = (userAnswers[i] ?? '').toString().toLowerCase().trim();
          const acceptable = [blank.answer, ...(blank.alternatives ?? [])].map((a) => a.toLowerCase().trim());
          if (acceptable.includes(userVal)) correct++;
        }
        const score = Math.round((correct / blanks.length) * 100);
        return {
          score,
          isCorrect: score >= 70,
          feedback: score >= 70
            ? `Well done! ${correct}/${blanks.length} blanks correct.`
            : `${correct}/${blanks.length} correct. Review and try again.`,
        };
      } else if (acceptableAnswers && Array.isArray(acceptableAnswers)) {
        // Flat list format
        const acceptable = acceptableAnswers.map((a) => a.toLowerCase().trim());
        const userAnswer = String(answer).toLowerCase().trim();
        const isCorrect = acceptable.includes(userAnswer);
        return {
          score: isCorrect ? 100 : 0,
          isCorrect,
          feedback: isCorrect ? 'Correct!' : 'Incorrect. Check the explanation.',
        };
      }
      // Fallback: treat as open-ended
      return { score: 50, isCorrect: false, feedback: 'Your answer has been recorded.' };
    }

    case 'CATEGORIZATION': {
      // Support both formats: {correctCategories:{...}} and {items:[{text,category}]}
      let correctCategories = config.correctCategories as Record<string, string[]> | undefined;
      if (!correctCategories) {
        const rawItems = config.items as Array<{ text: string; category: string }> | undefined;
        if (rawItems?.length) {
          correctCategories = {};
          for (const item of rawItems) {
            if (!correctCategories[item.category]) correctCategories[item.category] = [];
            correctCategories[item.category].push(item.text);
          }
        }
      }
      if (!correctCategories) {
        return { score: 0, isCorrect: false, feedback: 'Exercise configuration error.' };
      }
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
      return {
        score,
        isCorrect: score >= 70,
        feedback:
          score >= 70
            ? `Good categorization! ${correct}/${total} correct.`
            : `${correct}/${total} correctly categorized. Review and try again.`,
      };
    }

    // Open-ended, case study, diagram label, code query — partial scoring
    default: {
      return {
        score: 50,
        isCorrect: false,
        feedback: 'Your answer has been recorded and will be reviewed.',
      };
    }
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
