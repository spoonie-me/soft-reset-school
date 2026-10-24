// Public track catalog — powers /tracks and /tracks/:slug.
//
// Fully static on purpose: these pages must work logged-out and prerender
// cleanly, so nothing here is fetched from the API. Sources of truth:
//   - slugs, titles, exam config → backend/prisma/seed-data/tracks.json
//   - domain outlines            → backend/prisma/seed-data/domains/<slug>/domains.json
// If the seed data changes, update this file to match.

import { meetsCredentialBar } from './credentialBar';

export interface CatalogDomain {
  name: string;
  description: string;
  /** Domain exists in the curriculum plan but has no published lessons yet. */
  inDevelopment?: boolean;
}

export interface CatalogTrack {
  /** Track id from the backend seed data — used as the public URL slug. */
  slug: string;
  emoji: string;
  title: string;
  /** CSS color var, e.g. 'var(--signal)'. */
  color: string;
  kind: 'career' | 'foundation';
  /** One-line pitch for cards and the detail-page hero. */
  pitch: string;
  /** "Who this is for" paragraph. */
  whoFor: string;
  /** "The job this leads to" paragraph — career tracks only. */
  jobItLeadsTo?: string;
  /** Honest note about curriculum maturity — shown above the outline. */
  curriculumNote?: string;
  domains: CatalogDomain[];
  /** Total published lesson count and estimated minutes — shown next to the
   * credential price so "€69" is never divorced from "how much is actually
   * here." Added 2026-08-05 after the expert advisory board flagged that the
   * thinnest tracks (3-4 lessons) were being sold under the same "Career
   * Credential" language as the deeper ones with no disclosure. Source:
   * backend/prisma/seed-data/domains/<slug>/*\/lessons.json, summed. */
  lessonCount: number;
  totalMinutes: number;
  exam: {
    questionCount: number;
    timeLimitMinutes: number;
    passScore: number;
    /** Career-track exams fold in this many AI-graded open-ended judgment
     * questions (see backend/src/routes/exams.ts CAREER_TRACK_IDS). */
    openEndedCount?: number;
    /** True when questionCount === the entire multiple-choice bank for this
     * track, i.e. the exam is drawn from the exact same questions the
     * learner already practiced and saw explanations for. Disclosed plainly
     * rather than left implicit — see BUSINESS_MODEL.md "exam integrity". */
    drawsFullBank?: boolean;
  };
}

const CAREER_CURRICULUM_NOTE =
  'The first lesson is a free trial. The full track is €99 once.';

/** Every track definition, including archived ones. Use CATALOG_TRACKS for
 * anything public-facing. */
const ALL_TRACKS: CatalogTrack[] = [
  // ── Career tracks — the reintegration path ──────────────────────────────
  {
    slug: 'ai-orchestrated-dev',
    emoji: '🧭',
    title: 'AI-Assisted Software Development',
    color: 'var(--signal)',
    kind: 'career',
    pitch:
      'Direct AI coding tools well enough that your energy envelope stops setting your ceiling — and review what they produce with real judgment.',
    whoFor:
      'For people who want to ship real software without typing every line — including on days when typing every line isn\'t physically on the table. You don\'t need to be a fast coder; you need to become a careful director and reviewer of AI output. Some prior exposure to code helps — ',
    jobItLeadsTo:
      'Development work — freelance or employed — where the value is directing and reviewing AI-generated code: writing executable specs, catching the bugs AI confidently gets wrong, and owning correctness, security, and maintainability. A hireable dev skill that doesn\'t bill by the hour of typing.',
    curriculumNote: CAREER_CURRICULUM_NOTE,
    domains: [
      {
        name: 'Directing, Not Typing',
        description:
          'The shift from writing every line yourself to directing an AI tool effectively — prompting for code, evaluating output critically, and knowing when to take over manually.',
      },
      {
        name: 'Reviewing AI-Generated Code',
        description:
          'Reading AI output for correctness, security, and maintainability — the skill that matters more than typing speed once AI writes the first draft.',
      },
      {
        name: 'Agentic Workflows',
        description:
          'Multi-step AI-driven development: planning, delegating subtasks, and verifying a chain of AI actions rather than a single completion.',
      },
      {
        name: 'Shipping with AI Assistance',
        description:
          'Testing, deployment, and monitoring workflows where AI handles routine work and the developer owns judgment calls and final accountability.',
      },
    ],
    lessonCount: 244,
    totalMinutes: 6100,
    exam: { questionCount: 22, timeLimitMinutes: 45, passScore: 75, openEndedCount: 2 },
  },
  {
    slug: 'ai-workflow-consulting',
    emoji: '⚙️',
    title: 'AI Automation Consulting',
    color: 'var(--gold)',
    kind: 'career',
    pitch:
      'Design where AI actually belongs in a real business process — and where it doesn\'t.',
    whoFor:
      'For people who like diagnosing how work actually flows through an organisation, and who can be honest with a client about limits. This is less about deep technical skill and more about judgment, clear communication, and the willingness to say "AI shouldn\'t do this part." No 40-hour week required to deliver it.',
    jobItLeadsTo:
      'Consulting engagements: scoping automations, selecting and combining tools, setting realistic expectations before they harden into someone\'s success metric, and validating real ROI. The client who needs this is the org that wants someone honest about the limits, not just the demo — and we deliberately don\'t quote the inflated hourly figures that circulate online.',
    curriculumNote: CAREER_CURRICULUM_NOTE,
    domains: [
      {
        name: 'Where AI Belongs in a Process',
        description:
          'Diagnosing a business process to find where AI genuinely helps versus where it adds risk or removes necessary human judgment.',
      },
      {
        name: 'Tool Selection & Integration',
        description:
          'Evaluating and combining AI tools (LLMs, RPA, existing software) into a working pipeline rather than treating AI as a single magic tool.',
      },
      {
        name: 'Consulting Skills for AI Projects',
        description:
          'Scoping engagements, setting realistic expectations, and communicating both the capability and limits of AI systems to a non-technical client.',
      },
      {
        name: 'Validating Outputs & Measuring ROI',
        description:
          'Building in checkpoints to catch AI errors at scale, and proving the actual business value of an automation, not just its existence.',
      },
    ],
    lessonCount: 246,
    totalMinutes: 6150,
    exam: { questionCount: 21, timeLimitMinutes: 45, passScore: 75, openEndedCount: 2 },
  },
  {
    slug: 'ai-oversight-health-informatics',
    emoji: '🩺',
    title: 'AI-Augmented Medical Coding',
    color: 'var(--crystal)',
    kind: 'career',
    pitch:
      'Expert-level review and exception-handling for AI-generated clinical records — the layer AI routes complex cases to, not the layer it automates away.',
    whoFor:
      'For people with — or willing to build — an eye for clinical detail. If you\'ve lived inside the medical system as a patient, you already know what a record done badly looks like from the receiving end. This is deliberately not entry-level data entry: that layer is exactly what AI is automating fastest. We train the review layer instead.',
    jobItLeadsTo:
      'Review and exception-handling work in AI-assisted clinical coding pipelines: validating AI-generated records against HL7, FHIR, and HIPAA requirements, catching the gap between structurally complete and actually clinically correct, and escalating before an error reaches a patient.',
    curriculumNote: CAREER_CURRICULUM_NOTE,
    domains: [
      {
        name: 'Reviewer, Not Data-Entry Clerk',
        description:
          'Why this track trains expert-level review and exception-handling of AI-generated clinical records, not entry-level manual coding — and what that distinction actually means day to day.',
      },
      {
        name: 'Validating Against Real Standards',
        description:
          'Checking AI-generated clinical code and records against HL7, FHIR, and HIPAA requirements — not just whether a field is filled, but whether the underlying logic is correct.',
      },
      {
        name: 'Catching Edge Cases AI Misses',
        description:
          'Recognizing the patterns where automated clinical coding pipelines are most likely to be confidently wrong, and knowing how to escalate before harm reaches a patient.',
      },
      {
        name: 'Patient Safety Auditing',
        description:
          'Auditing AI-assisted clinical systems for safety-critical failures, and documenting findings in a way clinical and engineering teams can both act on.',
      },
    ],
    lessonCount: 246,
    totalMinutes: 6135,
    exam: { questionCount: 22, timeLimitMinutes: 45, passScore: 75, openEndedCount: 2 },
  },
  {
    slug: 'accessibility-qa-lived-experience',
    emoji: '♿',
    title: 'Digital Accessibility QA',
    color: 'var(--rust)',
    kind: 'career',
    pitch:
      'Accessibility review grounded in actually using assistive technology yourself — a perspective an automated scanner can\'t fake.',
    whoFor:
      'For people who use — or are ready to genuinely learn — screen readers, keyboard-only navigation, and other assistive technology. If you already navigate the web with assistive tech because you have to, that lived experience is the qualification most reviewers don\'t have. Our lessons put you behind the actual tools, tabbing and listening yourself, not reading about someone else\'s experience with them.',
    jobItLeadsTo:
      'Accessibility audit work employers must buy under the European Accessibility Act: testing what a screen reader actually announces and what a keyboard-only user actually experiences, then writing findings a development team can act on — grounded in WCAG standards, not just a checklist.',
    curriculumNote: CAREER_CURRICULUM_NOTE,
    domains: [
      {
        name: 'Foundations',
        description:
          'What accessibility QA is, how the standards and the law are structured, how barriers get built, and why an automated scan finds only a fraction of what matters.',
      },
      {
        name: 'Assistive Technology Fluency',
        description:
          'Beyond the WCAG checklist: how screen readers, magnifiers, switch access, and voice control actually behave in practice — the specific failures a lived-experience reviewer catches that an automated scanner misses.',
      },
      {
        name: 'Cognitive, Content and Energy Accessibility',
        description:
          'The barriers WCAG covers thinly: cognitive load, unclear content, sensory load, and interfaces that cost more energy than a person has.',
      },
      {
        name: 'Running a Real Audit',
        description:
          'Scoping, evidence, severity and reporting — the practical craft of an audit a development team can actually work from, not a list of WCAG violation codes.',
      },
      {
        name: 'Advocacy & Organizational Change',
        description:
          'Turning audit findings into real product change: making the case internally, working with design and engineering teams, and the difference between compliance theater and a genuine accessibility culture.',
      },
      {
        name: 'Working in Accessibility',
        description:
          'Getting and holding accessibility work — employed, contract or freelance — and structuring it so it doesn\'t cost more than it pays.',
      },
    ],
    lessonCount: 243,
    totalMinutes: 6065,
    exam: { questionCount: 14, timeLimitMinutes: 30, passScore: 75, openEndedCount: 2 },
  },

  // ── Foundation tracks — the original coding-and-AI curriculum ───────────
  {
    slug: 'fundamentals',
    emoji: '🛏️',
    title: 'Code from Bed',
    color: 'var(--signal)',
    kind: 'foundation',
    pitch:
      'Learn to code with Claude. Build real projects. From zero to your first deployed app — no pants required.',
    whoFor:
      'Complete beginners. No computer-science background, no prior code, no good day required. Lessons run 15–30 minutes, there are no streaks to break, and your progress waits through crashes. If any track is your starting line, it\'s this one.',
    domains: [
      {
        name: 'Getting Started with Code',
        description:
          'Your first steps into coding. No experience needed. Set up your tools and write your first lines of code.',
      },
      {
        name: 'Programming Fundamentals',
        description:
          'Variables, types, control flow, functions. The building blocks every programmer needs.',
      },
      {
        name: 'Building Real Projects',
        description:
          'HTML, CSS, JavaScript. Build and deploy your first web app. Go from idea to live on the internet.',
      },
    ],
    lessonCount: 263,
    totalMinutes: 6345,
    exam: { questionCount: 14, timeLimitMinutes: 30, passScore: 75, drawsFullBank: true },
  },
  {
    slug: 'ai',
    emoji: '🤖',
    title: 'AI Literacy for Humans',
    color: 'var(--rust)',
    kind: 'foundation',
    pitch:
      'Understand what an LLM actually does. Master prompting. Use AI like a pro, not a parrot.',
    whoFor:
      'Anyone who uses AI tools and wants to actually understand them — tokens, training, temperature, hallucination — instead of repeating surface-level hype. You can start here with no coding background at all; the later material builds up to working with the Claude API.',
    domains: [
      {
        name: 'How LLMs Actually Work',
        description:
          'Tokens, training, temperature, hallucination. Understand the model before you use it.',
      },
      {
        name: 'Prompt Engineering Mastery',
        description:
          'Chain of thought, few-shot prompting, system instructions. The art and science of asking Claude.',
      },
      {
        name: 'Building with Claude API',
        description:
          'API basics, streaming, vision, multimodal. From simple calls to complex workflows.',
      },
      {
        name: 'Ethics & Responsible AI',
        description: 'Bias, privacy, transparency. Use AI responsibly.',
      },
    ],
    lessonCount: 248,
    totalMinutes: 6120,
    exam: { questionCount: 7, timeLimitMinutes: 20, passScore: 75, drawsFullBank: true },
  },
  {
    slug: 'tools',
    emoji: '⚡',
    title: 'Build Cool Tools Fast',
    color: 'var(--gold)',
    kind: 'foundation',
    pitch:
      'Make tools that save you hours. Use AI to do the boring stuff. Ship in days, not months — CLI tools, web apps, and APIs.',
    whoFor:
      'People who know some basics and want to actually ship: small, useful software with AI handling the boring parts, deployed for real, and — if you want — made sustainable with pricing and automation. A natural next step after Code from Bed.',
    domains: [
      {
        name: 'Ideas & Planning',
        description: 'Where tool ideas come from. Validation. Scope management.',
      },
      {
        name: 'CLI Tools',
        description: 'Node.js scripts, command-line interfaces, npm packages.',
      },
      {
        name: 'Web Applications',
        description: 'React, Next.js, deployment. Build and ship web apps.',
      },
      {
        name: 'Monetization & Scaling',
        description: 'APIs, pricing, analytics, costs. Make it sustainable.',
      },
      {
        name: 'Testing & Debugging',
        description:
          'Catch bad output before your users do. Test AI-powered tools like real software.',
      },
      {
        name: 'Automation & Integrations',
        description:
          'Run your tool without you. Connect it to Slack, email, and scheduled jobs.',
      },
    ],
    lessonCount: 255,
    totalMinutes: 6225,
    exam: { questionCount: 13, timeLimitMinutes: 25, passScore: 75, drawsFullBank: true },
  },
  {
    slug: 'advanced',
    emoji: '🚀',
    title: 'AI Agents that Work',
    color: 'var(--crystal)',
    kind: 'foundation',
    pitch:
      'Create agents that code, research, debug, and solve problems — and deploy autonomous systems that actually work.',
    whoFor:
      'The most technical foundation track. For people already comfortable with code who want to build, evaluate, and deploy agent systems — loops, tools, memory, real-world architectures, and the evals that tell you whether any of it actually works.',
    domains: [
      {
        name: 'Agent Foundations',
        description: 'Loops, tools, decisions. What is an agent?',
      },
      {
        name: 'Planning & Reasoning',
        description: 'Goal decomposition, decision trees, adaptive strategies.',
      },
      {
        name: 'Memory Systems',
        description: 'Context windows, long-term memory, vector embeddings, RAG.',
      },
      {
        name: 'Real-World Agents',
        description: 'Research agents, code agents, support bots, orchestrators.',
      },
      {
        name: 'Deploy & Monitor',
        description: 'Cost optimization, safety, observability.',
      },
      {
        name: 'Evaluating & Testing Agents',
        description:
          'How do you know your agent actually works? Building evals for multi-step, non-deterministic systems.',
      },
    ],
    lessonCount: 265,
    totalMinutes: 6375,
    exam: { questionCount: 10, timeLimitMinutes: 20, passScore: 75, drawsFullBank: true },
  },
];

/** Public catalog: the four career tracks. The four foundation tracks
 * (kind: 'foundation') are archived — still defined above so their content
 * and existing certificates keep working, but hidden from every public page
 * and no longer sold. To bring them back, include them here. */
export const CATALOG_TRACKS: CatalogTrack[] = ALL_TRACKS.filter((t) => t.kind === 'career');
export const CAREER_CATALOG_TRACKS = CATALOG_TRACKS;

export function getCatalogTrack(slug: string | undefined): CatalogTrack | undefined {
  return CATALOG_TRACKS.find((t) => t.slug === slug);
}

/** Whether this track has enough published content to sell a credential
 * for — see credentialBar.ts. Backend/src/lib/stripe.ts computes the same
 * thing independently for CREDENTIAL_SELLABLE_TRACKS; the two are checked
 * against each other by src/data/__tests__/credentialBar.test.ts. */
export function credentialAvailable(track: CatalogTrack): boolean {
  return meetsCredentialBar(track);
}
