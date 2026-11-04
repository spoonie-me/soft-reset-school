import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 15_000, // 15s timeout — leaves margin for Vercel 30s limit
});

// Tutor persona per track. Add a new track's tone here rather than branching in getExerciseFeedback.
const PERSONAS: Record<string, string> = {
  // Original Soft Reset School general coding persona — preserved as the fallback for any unrecognized/legacy trackId
  default: `You are a coding tutor for Soft Reset School, a coding school for people with chronic illness who learn at their own pace.
Provide constructive, encouraging feedback on student exercise submissions.
Focus on what they got right first, then gently correct misconceptions.
Explain WHY the correct answer matters in a real-world coding context.
Keep feedback concise — learners may have limited energy.`,

  'ai-orchestrated-dev': `You are an AI-orchestrated software development tutor for Soft Reset School. You help learners master directing AI tools effectively rather than typing every line manually.
Focus on strategic prompting, tool selection, and reviewing AI-generated output critically.
Highlight how to evaluate AI suggestions for correctness, bias, and robustness — not just syntax.
Emphasize efficiency gains but stress verification of AI output before trusting it.
Keep feedback concise — learners may have limited energy.`,

  'ai-workflow-consulting': `You are an AI workflow & automation consulting tutor for Soft Reset School.
Teach how to architect effective human-AI collaboration in real-world systems.
Focus on process design: where to integrate AI, when to intervene manually, and how to validate outputs at scale.
Acknowledge business constraints (time, ethics, reliability) alongside technical correctness.
Keep feedback concise — learners may have limited energy.`,

  'ai-oversight-health-informatics': `You are a health informatics QA & oversight tutor for Soft Reset School, focused on expert-level review and exception-handling — not entry-level data entry.
Teach how to verify AI-generated clinical code against real-world standards (HL7, FHIR, HIPAA), flag edge cases, and catch dangerous oversights an automated pipeline missed.
Stress responsibility and patient-safety reasoning — explain WHY a record or piece of logic is flawed, not just that a field is missing.
Treat learners as future clinical-system reviewers, not data-entry clerks — avoid an infantilizing tone.
Keep feedback concise — learners may have limited energy.`,

  'accessibility-qa-lived-experience': `You are an accessibility QA tutor for Soft Reset School, teaching review grounded in both WCAG standards and lived disability experience.
Emphasize how real assistive-technology users actually interact with an interface, beyond checklist compliance.
Teach learners to critically inspect AI-generated code for inclusive interaction patterns, assistive-tech compatibility, and cognitive load — not just automated rule-passing.
Prioritize feedback rooted in authentic accessibility practice over rote WCAG citation.
Keep feedback concise — learners may have limited energy.`,
};

/**
 * Result of an AI grading attempt.
 *
 * `graded` is the important field: it is `false` whenever the model call failed
 * or came back without a usable score. In that case `score` and `isCorrect` are
 * `null` and callers MUST NOT persist a numeric score — a transient API outage
 * must never be recorded as a 0 for work the learner actually did.
 */
export interface ExerciseGrade {
  graded: boolean;
  feedback: string;
  score: number | null;
  isCorrect: boolean | null;
}

const UNGRADED_MESSAGE =
  "We couldn't grade this answer just now — that's on us, not on you. Your answer has been saved; try submitting again in a moment.";

/** Coerce a model-supplied score into a 0–100 integer, or null if unusable. */
function clampScore(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Remove anything that looks like raw JSON (complete objects, code fences, and a
 * trailing object cut off mid-stream) so a malformed model response is never
 * rendered to a learner as their feedback.
 */
function stripJson(text: string): string {
  return text
    .replace(/```[a-z]*/gi, '')
    .replace(/\{[\s\S]*?\}/g, ' ')
    .replace(/\{[\s\S]*$/, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Decode a JSON string body (the bit between the quotes) without throwing. */
function decodeJsonString(raw: string): string {
  try {
    return JSON.parse(`"${raw}"`) as string;
  } catch {
    return raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
}

/**
 * Turn the model's raw text into a grade.
 *
 * Tries a strict JSON parse first, then falls back to field-level salvage so a
 * response truncated mid-JSON still yields the grade rather than dumping the
 * partial JSON string in front of the learner.
 */
function parseGrade(text: string): ExerciseGrade {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      const score = clampScore(parsed.score);
      if (score !== null) {
        const feedback = typeof parsed.feedback === 'string' ? parsed.feedback.trim() : '';
        return {
          graded: true,
          feedback: feedback || 'Answer graded.',
          score,
          isCorrect: parsed.isCorrect === true,
        };
      }
    } catch {
      // fall through to salvage
    }
  }

  // Salvage: pull the individual fields out of a truncated or malformed payload.
  const feedbackMatch = text.match(/"feedback"\s*:\s*"((?:[^"\\]|\\.)*)/);
  const scoreMatch = text.match(/"score"\s*:\s*(-?\d+(?:\.\d+)?)/);
  const correctMatch = text.match(/"isCorrect"\s*:\s*(true|false)/);
  const salvagedFeedback = feedbackMatch ? decodeJsonString(feedbackMatch[1]).trim() : '';
  const score = scoreMatch ? clampScore(scoreMatch[1]) : null;

  if (score !== null) {
    return {
      graded: true,
      feedback: salvagedFeedback || 'Answer graded.',
      score,
      isCorrect: correctMatch ? correctMatch[1] === 'true' : false,
    };
  }

  // No usable score. Surface any prose the tutor did produce, but never the raw
  // JSON — and report this as ungraded so no score gets written.
  const prose = salvagedFeedback || stripJson(text);
  return {
    graded: false,
    feedback: prose ? `${prose}\n\n(This answer isn't scored yet — try submitting again.)` : UNGRADED_MESSAGE,
    score: null,
    isCorrect: null,
  };
}

export async function getExerciseFeedback(
  exercisePrompt: string,
  expectedAnswer: string | null,
  studentAnswer: string,
  exerciseType: string,
  trackId: string,
): Promise<ExerciseGrade> {
  // Truncate student answer to prevent abuse / excessive token usage
  const safeAnswer = String(studentAnswer).slice(0, 2000);
  const persona = PERSONAS[trackId] ?? PERSONAS.default;

  try {
    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5',
      // 500 was too tight: a long open-ended answer produced a long critique,
      // the JSON was cut off mid-object, and the learner saw the raw fragment.
      max_tokens: 1024,
      // Grading a single short answer is a bounded judgement, and this call sits
      // behind a 15s timeout inside a 30s serverless budget. Thinking is on by
      // default on current models and would spend both the clock and the output
      // budget, so it's disabled explicitly.
      thinking: { type: 'disabled' },
      system: `${persona}
Reply with a single JSON object and nothing else: { "feedback": "...", "score": 0-100, "isCorrect": true/false }
Keep "feedback" under 120 words so the whole object fits in the response.`,
      messages: [
        {
          role: 'user',
          content: `Exercise type: ${exerciseType}
Question: ${exercisePrompt}
${expectedAnswer ? `Expected answer: ${expectedAnswer}` : ''}
Student's answer: ${safeAnswer}

Evaluate this submission and return JSON with feedback, score (0-100), and isCorrect.`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === 'text');
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : '';
    if (!text.trim()) {
      return { graded: false, feedback: UNGRADED_MESSAGE, score: null, isCorrect: null };
    }

    return parseGrade(text);
  } catch (err) {
    console.error('Claude API error:', err);
    // Deliberately NOT a score of 0: an API outage is not a wrong answer.
    return { graded: false, feedback: UNGRADED_MESSAGE, score: null, isCorrect: null };
  }
}
