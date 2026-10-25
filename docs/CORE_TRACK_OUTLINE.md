# Outlines: Core track and the UX Design specialisation

*Draft. Nothing built. No lesson text exists yet.*

The 100-hour contract (30 modules x 200 minutes) in `docs/CURRICULUM_ARCHITECTURE_100H.md` and
`scripts/curriculum-audit.mjs` fits specialisations. The core is about 25 hours, so building it
means adding a "core" shape to the audit, the catalog (`src/data/trackCatalog.ts`) and the
credential bar (`backend/src/lib/credentialBar.ts`, `src/data/credentialBar.ts`), which must stay
in step with the seed data.

## Core: Human Skills in the AI Age (about 25 hours, 7 modules)

| # | Module | What the learner does |
|---|---|---|
| 1 | Your working envelope | Find a sustainable weekly rhythm, plan for bad weeks, set a minimum viable day |
| 2 | What AI does and what only people do | Sort real tasks into AI-suited, human-suited and shared; judge a weak AI answer |
| 3 | Writing clearly | Short, plain written communication: emails, updates, handovers, briefs |
| 4 | Explaining and teaching | Explain one idea three ways; write a short lesson; give useful feedback |
| 5 | Presenting without performing | Build a talk, then deliver it as written notes, a recording or live. Anxiety-aware ramp, never live-only |
| 6 | Working with people | Ask for adjustments, say no, explain a gap once, handle feedback |
| 7 | Proving your work | A small portfolio piece, an honest account of what you did, how to use a certificate |

Each module: five lessons, one practice, one checkpoint. A lower-energy path in every one.
Exam: mixed questions plus open-ended answers graded against a published rubric.

Reuse from Spooniversity by linking, not copying, and only listed courses: Sick Bootcamp
(module 1), Advocacy in Action (module 6), Carer Resilience (for carers returning). Spooniversity's
data courses are unlisted, so module 2 teaches evidence-judging itself.

## UX Design specialisation (about 100 hours, 30 modules; outline of domains only)

1. **Understanding people**: interviews, observation, writing a problem down, synthesis
2. **Designing**: flows, layout, content, interaction, working from constraints
3. **Making it usable for everyone**: accessibility built in from the start (shared with Accessibility QA)
4. **Testing and improving**: usability tests, reading results honestly, iterating
5. **Working with AI in design**: using AI for drafts and research, checking its output, and not shipping unreviewed work
6. **Delivering**: handoff, writing the case, a portfolio of three small projects

Overlaps with Digital Accessibility QA, so a learner taking both should not repeat shared modules.

## Teaching and Training specialisation (later)

Designing a short course, facilitating (written, recorded and live), assessing fairly, and using
AI as a teaching assistant. Built after UX.

## Build order

1. Core (about 25 hours), with one pilot learner group
2. UX Design
3. Teaching and Training
