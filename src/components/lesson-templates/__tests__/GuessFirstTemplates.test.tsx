import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ConceptFlow,
  DiagnoseMechanism,
  SpotFlaw,
  SequenceIt,
  BuildIt,
  type BuildField,
  type BuildItProps,
  EvidenceStack,
  PredictNumber,
  PromptBuild,
  type PromptBuildProps,
} from '../GuessFirstTemplates';

describe('ConceptFlow', () => {
  const props = {
    scenario: 'Given this error: `ReferenceError: Cannot access total before initialization`',
    question: 'Which error type is this?',
    options: [
      { label: 'ReferenceError', value: 'reference' },
      { label: 'TypeError', value: 'type' },
    ],
    correctValue: 'reference',
    feedback: {
      reference: 'Correct family — this is a ReferenceError.',
      type: 'Not quite — a TypeError happens when a value is used the wrong way, not when a variable does not exist yet.',
    },
    concept: 'ReferenceError means the variable does not exist (yet) in the current scope.',
  };

  it('does not reveal feedback or concept before a choice is made', () => {
    render(<ConceptFlow {...props} />);
    expect(screen.queryByText(/Correct family/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ReferenceError means/)).not.toBeInTheDocument();
  });

  it('shows choice-specific feedback after picking an option, then reveals the concept on Continue', async () => {
    render(<ConceptFlow {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'TypeError' }));
    // Matched on the choice-SPECIFIC half of the sentence: the panel now also
    // carries a standalone "Not quite" verdict line, so a bare /Not quite/
    // would match two nodes and no longer prove the feedback is choice-tied.
    expect(screen.getByText(/a TypeError happens when a value is used the wrong way/)).toBeInTheDocument();
    expect(screen.queryByText(/ReferenceError means/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect(screen.getByText(/ReferenceError means/)).toBeInTheDocument();
  });

  it('locks further selection after a choice is made', async () => {
    render(<ConceptFlow {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'ReferenceError' }));
    expect(screen.queryByRole('button', { name: 'TypeError' })).not.toBeInTheDocument();
  });
});

describe('DiagnoseMechanism', () => {
  const props = {
    scenario: 'Code declares `total` with `const` further down but reads it earlier.',
    question: 'What most likely caused this?',
    options: [
      { label: 'Never declared', value: 'never' },
      { label: 'Used before declaration line runs', value: 'tdz' },
    ],
    correctValue: 'tdz',
    feedback: {
      never: 'If it were never declared you would see a plain "is not defined" message, not "before initialization".',
      tdz: 'Right — this is the temporal dead zone.',
    },
    mechanism: 'const/let are hoisted but not initialized until their declaration line runs.',
  };

  it('reveals mechanism only after Continue is clicked', async () => {
    render(<DiagnoseMechanism {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Used before declaration line runs' }));
    expect(screen.getByText(/temporal dead zone/)).toBeInTheDocument();
    expect(screen.queryByText(/hoisted but not initialized/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect(screen.getByText(/hoisted but not initialized/)).toBeInTheDocument();
  });
});

describe('SpotFlaw', () => {
  const props = {
    code: "const freeUser = users.find(u => u.plan === 'team');\nconsole.log(freeUser.name);",
    question: 'Which line causes the crash?',
    options: [
      { label: 'The find() call', value: 'find-line' },
      { label: 'The console.log call', value: 'log-line' },
    ],
    correctValue: 'log-line',
    feedback: {
      'find-line': 'find() itself never throws — it just returns undefined when nothing matches.',
      'log-line': 'Right — accessing .name on the undefined result is what throws.',
    },
    flawExplanation: 'find() returns undefined when no element matches, and undefined.name throws a TypeError.',
  };

  it('renders the code as literal text', () => {
    render(<SpotFlaw {...props} />);
    expect(screen.getByText(/users\.find/)).toBeInTheDocument();
  });

  it('ties feedback to the specific option picked, then reveals the full explanation', async () => {
    render(<SpotFlaw {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'The find() call' }));
    expect(screen.getByText(/find\(\) itself never throws/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect(screen.getByText(/undefined\.name throws a TypeError/)).toBeInTheDocument();
  });
});

describe('SequenceIt', () => {
  const props = {
    question: 'Order the debugging steps.',
    steps: ['Read the error message', 'Add a console.log', 'Ask Claude with error + code + expected', 'Apply and verify the fix'],
    explanation: 'console.log before asking Claude narrows the problem so your prompt is specific.',
  };

  it('renders all four steps in some order and reveals explanation after checking', async () => {
    render(<SequenceIt {...props} />);
    for (const step of props.steps) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
    expect(screen.queryByText(/narrows the problem/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Check my order/ }));
    expect(screen.getByText(/narrows the problem/)).toBeInTheDocument();
  });

  it('lets the learner reorder via up/down before checking', async () => {
    render(<SequenceIt {...props} />);
    const upButtons = screen.getAllByRole('button', { name: /Move .* up/ });
    // First item's "up" button should be disabled (already at top)
    expect(upButtons[0]).toBeDisabled();
  });
});

describe('BuildIt', () => {
  const props: BuildItProps = {
    intro: 'Construct a configuration object for your CI pipeline.',
    objectName: 'pipelineConfig',
    fields: [
      {
        key: 'runtime',
        prompt: 'Which language runtime should be used?',
        options: [{ label: 'Node.js', value: 'node' }, { label: 'Python', value: 'python' }],
        correctValue: 'node',
        feedback: { node: 'Matches this project\'s existing stack.', python: 'Not aligned with the codebase.' },
      },
      {
        key: 'testCommand',
        prompt: 'What is the test command?',
        options: [{ label: 'npm test', value: 'npm-test' }, { label: 'make test', value: 'make-test' }],
        correctValue: 'npm-test',
        feedback: { 'npm-test': 'Matches package.json scripts.', 'make-test': 'Not configured for this project.' },
      },
    ],
    synthesis: 'This object drives the entire build process across environments.',
  };

  it('shows only the first field until it is answered', () => {
    render(<BuildIt {...props} />);
    expect(screen.getByText(/Which language runtime should be used\?/)).toBeInTheDocument();
    expect(screen.queryByText(/What is the test command\?/)).not.toBeInTheDocument();
  });

  it('gives field-specific feedback, then updates the live preview once advanced', async () => {
    render(<BuildIt {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Node.js' }));
    expect(screen.getByText(/Matches this project's existing stack/)).toBeInTheDocument();
    expect(screen.queryByText(/What is the test command\?/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Next field/ }));
    expect(screen.getByText(/What is the test command\?/)).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.tagName === 'CODE' && /runtime:\s*"node"/.test(el.textContent ?? ''))).toBeInTheDocument();
  });

  it('only reveals the synthesis panel once every field is answered', async () => {
    render(<BuildIt {...props} />);
    expect(screen.queryByText(/entire build process/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Node.js' }));
    await userEvent.click(screen.getByRole('button', { name: /Next field/ }));
    expect(screen.queryByText(/entire build process/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'npm test' }));
    expect(screen.getByText(/entire build process/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Next field/ })).not.toBeInTheDocument();
  });
});

describe('EvidenceStack', () => {
  const props = {
    scenario: "A React app crashes on mount with `Cannot resolve module './utils'`.",
    question: 'Select every fact relevant to diagnosing this crash.',
    items: [
      { value: 'missing-file', label: 'The file src/utils.ts is missing from the repo', applicable: true },
      { value: 'wrong-ext', label: 'Imports use .js but source files are .ts', applicable: true },
      { value: 'cache', label: 'The webpack cache was cleared and rebuilt', applicable: false },
    ],
    explanation: {
      'missing-file': 'A missing file is a direct cause of "cannot resolve module".',
      'wrong-ext': 'A mismatched extension also breaks module resolution.',
      cache: 'Clearing the cache would not cause a missing-module error.',
    },
    synthesis: 'Verify the imported file exists and the extension matches before suspecting tooling.',
  };

  it('shows no feedback and unchecked checkboxes before submitting', () => {
    render(<EvidenceStack {...props} />);
    expect(screen.queryByText(/direct cause of/)).not.toBeInTheDocument();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(props.items.length);
    checkboxes.forEach((cb) => expect(cb).toHaveAttribute('aria-checked', 'false'));
  });

  it('reveals per-item explanations only after Check my answers', async () => {
    render(<EvidenceStack {...props} />);
    await userEvent.click(screen.getByRole('checkbox', { name: /missing from the repo/ }));
    expect(screen.queryByText(/direct cause of/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Check my answers/ }));
    expect(screen.getByText(/direct cause of/)).toBeInTheDocument();
  });

  it('marks an applicable item the learner did not select as missed, not as silently correct', async () => {
    render(<EvidenceStack {...props} />);
    // Select only one of the two applicable items — leave "wrong-ext" unchecked.
    await userEvent.click(screen.getByRole('checkbox', { name: /missing from the repo/ }));
    await userEvent.click(screen.getByRole('button', { name: /Check my answers/ }));
    expect(screen.getByText('MISSED')).toBeInTheDocument();
  });

  it('does not flag an inapplicable, unselected item as incorrect', async () => {
    render(<EvidenceStack {...props} />);
    await userEvent.click(screen.getByRole('checkbox', { name: /missing from the repo/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /wrong-ext|Imports use \.js/ }));
    await userEvent.click(screen.getByRole('button', { name: /Check my answers/ }));
    // "cache" is inapplicable and correctly left unselected — should read EXCLUDED, never INCORRECT.
    expect(screen.queryByText('INCORRECT')).not.toBeInTheDocument();
    expect(screen.getByText('EXCLUDED')).toBeInTheDocument();
  });
});

describe('PredictNumber', () => {
  const props = {
    scenario: 'The following code computes an average of [10, 20, 30, 40].',
    question: 'What numeric value does `result` hold?',
    actualValue: '25',
    explanation: 'Sum is 100, count is 4 → 100 / 4 = 25.',
  };

  it('disables Reveal answer until the learner types something', async () => {
    render(<PredictNumber {...props} />);
    const revealBtn = screen.getByRole('button', { name: /Reveal answer/ });
    expect(revealBtn).toBeDisabled();

    await userEvent.type(screen.getByRole('textbox'), '50');
    expect(revealBtn).toBeEnabled();
  });

  it('shows the prediction and the actual value without grading it right or wrong', async () => {
    render(<PredictNumber {...props} />);
    await userEvent.type(screen.getByRole('textbox'), '50');
    await userEvent.click(screen.getByRole('button', { name: /Reveal answer/ }));

    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.queryByText(/\bcorrect\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bincorrect\b/i)).not.toBeInTheDocument();
  });
});

describe('PromptBuild', () => {
  const props: PromptBuildProps = {
    intro: 'Build a prompt asking Claude for a login form component.',
    fields: [
      {
        key: 'context',
        question: 'What context should you give Claude first?',
        options: [
          { label: 'State the tech stack', value: "I'm building a React app with TypeScript and Tailwind CSS." },
          { label: 'Say nothing', value: '' },
        ],
        correctValue: "I'm building a React app with TypeScript and Tailwind CSS.",
        feedback: {
          "I'm building a React app with TypeScript and Tailwind CSS.": 'This tells Claude what to target.',
          '': 'Without this, Claude has to guess your stack.',
        },
      },
      {
        key: 'task',
        question: 'What should the task line say?',
        options: [
          { label: 'Vague request', value: 'write a login form' },
          { label: 'Specific requirements', value: 'I need a login form with email + password inputs and inline validation.' },
        ],
        correctValue: 'I need a login form with email + password inputs and inline validation.',
        feedback: {
          'write a login form': 'Too vague — Claude will guess at the requirements.',
          'I need a login form with email + password inputs and inline validation.': 'Specific and testable.',
        },
      },
    ],
    synthesis: 'Context plus specific requirements is what turns a guess into working code.',
  };

  it('reveals the task field only after the context field is answered', async () => {
    render(<PromptBuild {...props} />);
    expect(screen.getByText(/What context should you give Claude first\?/)).toBeInTheDocument();
    expect(screen.queryByText(/What should the task line say\?/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'State the tech stack' }));
    await userEvent.click(screen.getByRole('button', { name: /Next field/ }));
    expect(screen.getByText(/What should the task line say\?/)).toBeInTheDocument();
  });

  it('assembles the chosen prompt fragments into the live preview, not JSON', async () => {
    render(<PromptBuild {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'State the tech stack' }));
    await userEvent.click(screen.getByRole('button', { name: /Next field/ }));
    expect(screen.getByText(/I'm building a React app with TypeScript and Tailwind CSS\./)).toBeInTheDocument();
  });

  it('shows the synthesis panel only once every field is answered', async () => {
    render(<PromptBuild {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'State the tech stack' }));
    await userEvent.click(screen.getByRole('button', { name: /Next field/ }));
    expect(screen.queryByText(/turns a guess into working code/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Specific requirements' }));
    expect(screen.getByText(/turns a guess into working code/)).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════
   Accessibility behaviours shared by every guess-first template
   ──────────────────────────────────────────────────────────────
   These cover the three barriers found in the spoonie-accessibility
   audit: focus stranded on a removed control, no way back from a wrong
   answer, and decorative emoji announced to screen readers. Touch-target
   sizing and colour contrast are NOT asserted here — jsdom does no
   layout, so those need the Playwright suite to be meaningful.
   ══════════════════════════════════════════════════════════════ */
describe('accessibility: focus management on reveal', () => {
  it('ConceptFlow moves focus to the feedback panel when a choice removes the buttons', async () => {
    render(
      <ConceptFlow
        scenario="A scenario."
        question="Pick one."
        options={[
          { label: 'First', value: 'a' },
          { label: 'Second', value: 'b' },
        ]}
        correctValue="a"
        feedback={{ a: 'Right because reasons.', b: 'Wrong because other reasons.' }}
        concept="The underlying concept."
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'First' }));
    // The button that had focus is gone; focus must land on the revealed panel.
    expect(document.activeElement).toHaveTextContent(/Right because reasons/);
  });

  it('SpotFlaw moves focus to the explanation panel on Continue', async () => {
    render(
      <SpotFlaw
        code="const x = 1;"
        question="What's wrong?"
        options={[
          { label: 'Alpha', value: 'a' },
          { label: 'Beta', value: 'b' },
        ]}
        correctValue="a"
        feedback={{ a: 'Yes.', b: 'No.' }}
        flawExplanation="The real flaw explained."
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    await userEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect(document.activeElement).toHaveTextContent(/The real flaw explained/);
  });

  it('PredictNumber moves focus to the result panel after revealing', async () => {
    render(
      <PredictNumber
        scenario="Some setup."
        question="How many?"
        actualValue="42"
        explanation="Because of the reason."
      />,
    );
    await userEvent.type(screen.getByLabelText(/numeric prediction/i), '10');
    await userEvent.click(screen.getByRole('button', { name: /Reveal answer/ }));
    expect(document.activeElement).toHaveTextContent(/Because of the reason/);
  });
});

describe('accessibility: a wrong answer is never a dead end', () => {
  it('ConceptFlow can be retried after the concept is revealed', async () => {
    render(
      <ConceptFlow
        scenario="A scenario."
        question="Pick one."
        options={[
          { label: 'First', value: 'a' },
          { label: 'Second', value: 'b' },
        ]}
        correctValue="a"
        feedback={{ a: 'Right.', b: 'Wrong.' }}
        concept="The concept."
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Second' }));
    await userEvent.click(screen.getByRole('button', { name: /Continue/ }));
    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));

    // Back to the initial state: options selectable again, nothing revealed.
    expect(screen.getByRole('button', { name: 'First' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Second' })).toBeInTheDocument();
    expect(screen.queryByText('The concept.')).not.toBeInTheDocument();
  });

  it('EvidenceStack can be retried after submitting', async () => {
    render(
      <EvidenceStack
        scenario="A scenario."
        question="Select all that apply."
        items={[
          { value: 'a', label: 'Alpha', applicable: true },
          { value: 'b', label: 'Beta', applicable: false },
        ]}
        explanation={{ a: 'Alpha applies.', b: 'Beta does not.' }}
        synthesis="Why it matters."
      />,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Beta' }));
    await userEvent.click(screen.getByRole('button', { name: /Check my answers/ }));
    expect(screen.getByText('Why it matters.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(screen.getByRole('checkbox', { name: 'Beta' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByText('Why it matters.')).not.toBeInTheDocument();
  });

  it('SequenceIt keeps its existing retry path', async () => {
    render(<SequenceIt question="Order these." steps={['One', 'Two', 'Three']} explanation="Why this order." />);
    await userEvent.click(screen.getByRole('button', { name: /Check my order/ }));
    expect(screen.getByText('Why this order.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(screen.getByRole('button', { name: /Check my order/ })).toBeInTheDocument();
  });
});

describe('accessibility: state is not conveyed by colour alone', () => {
  it('SequenceIt labels each row correct/out-of-order in text, not just colour', async () => {
    render(<SequenceIt question="Order these." steps={['One', 'Two']} explanation="Why." />);
    await userEvent.click(screen.getByRole('button', { name: /Check my order/ }));
    // Whatever the shuffle produced, every row carries a textual verdict.
    const verdicts = screen.getAllByText(/\((correct spot|out of order)\)/);
    expect(verdicts).toHaveLength(2);
  });

  /* WCAG 1.4.1 (Level A). Before this, whether the learner got it right was
   * carried ONLY by the panel's green-vs-rust background and an
   * aria-hidden ✓/→ glyph — a screen-reader user got nothing at all. The
   * verdict must be REAL TEXT (an aria-label would not survive braille or
   * "read from here" navigation) and must precede the feedback prose. */
  const verdictProps = {
    scenario: 'A scenario.',
    question: 'Pick one.',
    options: [
      { label: 'First', value: 'a' },
      { label: 'Second', value: 'b' },
    ],
    correctValue: 'a',
    feedback: { a: 'Because A holds.', b: 'Because B does not hold.' },
  };

  it('ConceptFlow states "Correct" in text when the learner is right', async () => {
    render(<ConceptFlow {...verdictProps} concept="The concept." />);
    await userEvent.click(screen.getByRole('button', { name: 'First' }));
    expect(screen.getByText('Correct')).toBeInTheDocument();
    expect(screen.queryByText('Not quite')).not.toBeInTheDocument();
  });

  it('ConceptFlow states "Not quite" in text when the learner is wrong — and never "Wrong"/"Incorrect"', async () => {
    render(<ConceptFlow {...verdictProps} concept="The concept." />);
    await userEvent.click(screen.getByRole('button', { name: 'Second' }));
    expect(screen.getByText('Not quite')).toBeInTheDocument();
    expect(screen.queryByText('Correct')).not.toBeInTheDocument();
    // The gentle register is deliberate product tone, not an accident.
    expect(screen.queryByText(/\b(wrong|incorrect)\b/i)).not.toBeInTheDocument();
  });

  it('ConceptFlow puts the verdict BEFORE the feedback prose, so it is heard first', async () => {
    render(<ConceptFlow {...verdictProps} concept="The concept." />);
    await userEvent.click(screen.getByRole('button', { name: 'Second' }));
    const verdict = screen.getByText('Not quite');
    const prose = screen.getByText(/Because B does not hold/);
    // Node.DOCUMENT_POSITION_FOLLOWING === 4
    expect(verdict.compareDocumentPosition(prose) & 4).toBeTruthy();
  });

  it('DiagnoseMechanism states the verdict in text', async () => {
    render(<DiagnoseMechanism {...verdictProps} mechanism="The mechanism." />);
    await userEvent.click(screen.getByRole('button', { name: 'First' }));
    expect(screen.getByText('Correct')).toBeInTheDocument();
  });

  it('SpotFlaw states the verdict in text', async () => {
    render(
      <SpotFlaw
        code="const x = 1;"
        question="Pick one."
        options={verdictProps.options}
        correctValue="a"
        feedback={verdictProps.feedback}
        flawExplanation="The flaw."
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Second' }));
    expect(screen.getByText('Not quite')).toBeInTheDocument();
  });

  it('BuildIt states the verdict in text for each field', async () => {
    render(
      <BuildIt
        intro="Build it."
        objectName="cfg"
        fields={[
          {
            key: 'runtime',
            prompt: 'Which runtime?',
            options: [{ label: 'Node.js', value: 'node' }, { label: 'Python', value: 'python' }],
            correctValue: 'node',
            feedback: { node: 'Matches the stack.', python: 'Off-stack.' },
          },
        ]}
        synthesis="Why it matters."
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Python' }));
    expect(screen.getByText('Not quite')).toBeInTheDocument();
  });

  it('PromptBuild states the verdict in text for each field', async () => {
    render(
      <PromptBuild
        intro="Build a prompt."
        fields={[
          {
            key: 'context',
            question: 'What context?',
            options: [{ label: 'Stack', value: 'React + TS' }, { label: 'Nothing', value: '' }],
            correctValue: 'React + TS',
            feedback: { 'React + TS': 'Targets the stack.', '': 'Claude has to guess.' },
          },
        ]}
        synthesis="Why it matters."
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Stack' }));
    expect(screen.getByText('Correct')).toBeInTheDocument();
  });

  it('EvidenceStack keeps its selected-state tick visible instead of painting it in the background colour', async () => {
    render(
      <EvidenceStack
        scenario="A scenario."
        question="Select all that apply."
        items={[{ value: 'a', label: 'Alpha', applicable: true }]}
        explanation={{ a: 'Alpha applies.' }}
        synthesis="Why it matters."
      />,
    );
    const box = screen.getByRole('checkbox', { name: 'Alpha' });
    await userEvent.click(box);
    const glyph = Array.from(box.querySelectorAll('span')).find((s) => s.textContent === '✓');
    expect(glyph).toBeDefined();
    // The bug: background was 'currentColor' while color was the same
    // var(--bg-void), so the tick was drawn in its own background.
    expect(glyph!.style.background).not.toBe('currentColor');
    expect(glyph!.style.background).not.toBe(glyph!.style.color);
  });
});

/* ══════════════════════════════════════════════════════════════
   Focus is never dropped on document.body
   ──────────────────────────────────────────────────────────────
   Both barriers here dumped the learner at the top of the page — 25-35 Tab
   presses back to where they were, which for the fatigue-limited users this
   product is built for is the difference between finishing a lesson and
   abandoning it.
   ══════════════════════════════════════════════════════════════ */
describe('accessibility: Try again returns focus instead of stranding it', () => {
  const retryProps = {
    scenario: 'A scenario.',
    question: 'Pick one.',
    options: [
      { label: 'First', value: 'a' },
      { label: 'Second', value: 'b' },
    ],
    correctValue: 'a',
    feedback: { a: 'Right.', b: 'Not so.' },
  };

  it('ConceptFlow moves focus to the question block, not document.body', async () => {
    render(<ConceptFlow {...retryProps} concept="The concept." />);
    await userEvent.click(screen.getByRole('button', { name: 'Second' }));
    await userEvent.click(screen.getByRole('button', { name: /Continue/ }));
    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));

    expect(document.activeElement).not.toBe(document.body);
    // The learner lands on the question they are being asked to retry, with
    // the fresh option buttons inside it.
    expect(document.activeElement).toHaveTextContent('Pick one.');
    expect(document.activeElement).toContainElement(screen.getByRole('button', { name: 'First' }));
  });

  it('DiagnoseMechanism moves focus to the question block', async () => {
    render(<DiagnoseMechanism {...retryProps} mechanism="The mechanism." />);
    await userEvent.click(screen.getByRole('button', { name: 'Second' }));
    await userEvent.click(screen.getByRole('button', { name: /Continue/ }));
    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toHaveTextContent('Pick one.');
  });

  it('SpotFlaw moves focus to the question block', async () => {
    render(
      <SpotFlaw
        code="const x = 1;"
        question="Pick one."
        options={retryProps.options}
        correctValue="a"
        feedback={retryProps.feedback}
        flawExplanation="The flaw."
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Second' }));
    await userEvent.click(screen.getByRole('button', { name: /Continue/ }));
    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toHaveTextContent('Pick one.');
  });

  it('SequenceIt moves focus back to the question block', async () => {
    render(<SequenceIt question="Order these." steps={['One', 'Two', 'Three']} explanation="Why." />);
    await userEvent.click(screen.getByRole('button', { name: /Check my order/ }));
    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toHaveTextContent('Order these.');
  });

  it('EvidenceStack moves focus back to the question block', async () => {
    render(
      <EvidenceStack
        scenario="A scenario."
        question="Select all that apply."
        items={[
          { value: 'a', label: 'Alpha', applicable: true },
          { value: 'b', label: 'Beta', applicable: false },
        ]}
        explanation={{ a: 'Alpha applies.', b: 'Beta does not.' }}
        synthesis="Why it matters."
      />,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Beta' }));
    await userEvent.click(screen.getByRole('button', { name: /Check my answers/ }));
    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toHaveTextContent('Select all that apply.');
  });

  it('PredictNumber moves focus back to the question block', async () => {
    render(<PredictNumber scenario="Setup." question="How many?" actualValue="42" explanation="Because." />);
    await userEvent.type(screen.getByLabelText(/numeric prediction/i), '10');
    await userEvent.click(screen.getByRole('button', { name: /Reveal answer/ }));
    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toHaveTextContent('How many?');
  });

  it('BuildIt moves focus back to the prompt block', async () => {
    render(
      <BuildIt
        intro="Build it."
        objectName="cfg"
        fields={[
          {
            key: 'runtime',
            prompt: 'Which runtime?',
            options: [{ label: 'Node.js', value: 'node' }, { label: 'Python', value: 'python' }],
            correctValue: 'node',
            feedback: { node: 'Yes.', python: 'No.' },
          },
        ]}
        synthesis="Why it matters."
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Node.js' }));
    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toHaveTextContent('Which runtime?');
  });

  it('PromptBuild moves focus back to the prompt block', async () => {
    render(
      <PromptBuild
        intro="Build a prompt."
        fields={[
          {
            key: 'context',
            question: 'What context?',
            options: [{ label: 'Stack', value: 'React + TS' }, { label: 'Nothing', value: '' }],
            correctValue: 'React + TS',
            feedback: { 'React + TS': 'Yes.', '': 'No.' },
          },
        ]}
        synthesis="Why it matters."
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Stack' }));
    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toHaveTextContent('What context?');
  });
});

describe('accessibility: selecting an option never drops focus (BuildIt / PromptBuild)', () => {
  const buildFields: BuildField[] = [
    {
      key: 'runtime',
      prompt: 'Which runtime?',
      options: [{ label: 'Node.js', value: 'node' }, { label: 'Python', value: 'python' }],
      correctValue: 'node',
      feedback: { node: 'Matches the stack.', python: 'Off-stack.' },
    },
    {
      key: 'testCommand',
      prompt: 'Which test command?',
      options: [{ label: 'npm test', value: 'npm-test' }, { label: 'make test', value: 'make-test' }],
      correctValue: 'npm-test',
      feedback: { 'npm-test': 'Matches package.json.', 'make-test': 'Not configured.' },
    },
  ];

  it('BuildIt lands focus on the per-field feedback panel, not document.body', async () => {
    render(<BuildIt intro="Build it." objectName="cfg" fields={buildFields} synthesis="Why it matters." />);
    await userEvent.click(screen.getByRole('button', { name: 'Node.js' }));
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toHaveTextContent(/Matches the stack/);
  });

  it('BuildIt keeps focus on the feedback panel for the FINAL field, so it is not skipped past', async () => {
    render(<BuildIt intro="Build it." objectName="cfg" fields={buildFields} synthesis="Why it matters." />);
    await userEvent.click(screen.getByRole('button', { name: 'Node.js' }));
    await userEvent.click(screen.getByRole('button', { name: /Next field/ }));
    await userEvent.click(screen.getByRole('button', { name: 'npm test' }));
    // The synthesis panel appears in the same commit; the feedback panel sits
    // earlier in the DOM, so focus belongs there and the learner reaches the
    // synthesis by reading forward.
    expect(document.activeElement).toHaveTextContent(/Matches package\.json/);
  });

  it('PromptBuild lands focus on the per-field feedback panel, not document.body', async () => {
    render(
      <PromptBuild
        intro="Build a prompt."
        fields={[
          {
            key: 'context',
            question: 'What context?',
            options: [{ label: 'Stack', value: 'React + TS' }, { label: 'Nothing', value: '' }],
            correctValue: 'React + TS',
            feedback: { 'React + TS': 'Targets the stack.', '': 'Claude has to guess.' },
          },
          {
            key: 'task',
            question: 'What task?',
            options: [{ label: 'Vague', value: 'do it' }, { label: 'Specific', value: 'add a login form' }],
            correctValue: 'add a login form',
            feedback: { 'do it': 'Too vague.', 'add a login form': 'Specific.' },
          },
        ]}
        synthesis="Why it matters."
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Stack' }));
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toHaveTextContent(/Targets the stack/);
  });
});

describe('accessibility: SequenceIt is usable by ear', () => {
  it('carries each row position in text, since the visible badge is aria-hidden', () => {
    render(<SequenceIt question="Order these." steps={['One', 'Two', 'Three']} explanation="Why." />);
    expect(screen.getByText(/Position 1 of 3:/)).toBeInTheDocument();
    expect(screen.getByText(/Position 2 of 3:/)).toBeInTheDocument();
    expect(screen.getByText(/Position 3 of 3:/)).toBeInTheDocument();
  });

  it('announces a move so a no-op is distinguishable from a successful one', async () => {
    render(<SequenceIt question="Order these." steps={['One', 'Two', 'Three']} explanation="Why." />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('');

    // Whatever the shuffle produced, row 2's "up" button is always enabled.
    const upButtons = screen.getAllByRole('button', { name: /Move .* up/ });
    const movedStep = upButtons[1].getAttribute('aria-label')!.replace(/^Move "|" up$/g, '');
    await userEvent.click(upButtons[1]);

    expect(status).toHaveTextContent(`Moved ${movedStep} to position 1 of 3`);
  });

  it('announces the new position when moving down', async () => {
    render(<SequenceIt question="Order these." steps={['One', 'Two', 'Three']} explanation="Why." />);
    const downButtons = screen.getAllByRole('button', { name: /Move .* down/ });
    const movedStep = downButtons[0].getAttribute('aria-label')!.replace(/^Move "|" down$/g, '');
    await userEvent.click(downButtons[0]);
    expect(screen.getByRole('status')).toHaveTextContent(`Moved ${movedStep} to position 2 of 3`);
  });
});

describe('accessibility: PredictNumber inputs do not collide', () => {
  it('gives each instance a unique input id, so two in one lesson still label correctly', () => {
    render(
      <>
        <PredictNumber scenario="First setup." question="How many A?" actualValue="1" explanation="Because A." />
        <PredictNumber scenario="Second setup." question="How many B?" actualValue="2" explanation="Because B." />
      </>,
    );
    const inputs = screen.getAllByLabelText(/numeric prediction/i);
    expect(inputs).toHaveLength(2);
    const [a, b] = inputs;
    expect(a.id).toBeTruthy();
    expect(b.id).toBeTruthy();
    expect(a.id).not.toBe(b.id);
  });
});

describe('authored lessons written in the older shapes', () => {
  it('BuildIt shows plain-string options as buttons and explains the answer', async () => {
    const user = userEvent.setup();
    render(
      <BuildIt
        intro="Build it."
        objectName="plan"
        synthesis="Done."
        fields={[
          {
            key: 'storage',
            prompt: 'What do you check?',
            options: ['Nothing at all', 'Whether the format is open and portable'],
            correctValue: 'Whether the format is open and portable',
            feedback: 'An open format is what stops lock-in.',
          },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Nothing at all' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Nothing at all' }));
    expect(screen.getByText(/open format is what stops lock-in/i)).toBeInTheDocument();
  });

  it('DiagnoseMechanism does not crash when a lesson gives no per-option feedback', async () => {
    const user = userEvent.setup();
    render(
      <DiagnoseMechanism
        scenario="Something failed."
        question="Why?"
        options={[
          { label: 'The first reason', value: 'a' },
          { label: 'The second reason', value: 'b' },
        ]}
        correctValue="a"
        mechanism="The first reason is the real one."
      />,
    );
    await user.click(screen.getByRole('button', { name: 'The second reason' }));
    await user.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByText(/the first reason is the real one/i)).toBeInTheDocument();
  });
});
