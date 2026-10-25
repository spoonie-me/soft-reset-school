# Soft Reset School — Business Model

*Last updated: 2026-10-25. If a pricing decision contradicts this document, update it first,
deliberately, or don't make the change.*

## Mission

People returning to work after illness need purpose, direction and a credible way back, at the
pace their body allows. The school teaches practical AI-era skills. It does not promise a job or
an income, and says so on every page that sells something.

## The model

**Pay once per track, learn at your own pace, no subscription.**

| Product | Price |
|---|---|
| One track (every lesson, the exam, a permanent verifiable certificate) | €99 |
| Two tracks | €149 |
| Three tracks | €199 |
| Free trial | The first lesson of every track |
| Hardship code | Free, by email to hi@softreset.school, single use, no proof asked |

Lessons beyond the trial need a purchase. Hardship codes exist so price is never the reason
someone is shut out, without putting a "pay what you can" dial in front of every buyer.

## Why no subscription for learners

A recurring charge bills a fixed clock to people who cannot control theirs. A bad month should
cost the learner nothing and cost us nothing. Learners pay once, when they are ready.

## Where recurring revenue can come from

Organisations, not learners: employers, nonprofits and vocational-rehab agencies that fund
seats. Today they buy voucher blocks at the same €99 per track (`/for-teams`, `/employers`).
Pricing for organisations beyond that is **undecided**, and the For Teams page should be revised
when it is decided.

## The tracks

| Track | Size |
|---|---|
| AI-Assisted Software Development | 244 lessons, about 102 hours |
| AI Automation Consulting | 246 lessons, about 102 hours |
| AI-Augmented Medical Coding | 246 lessons, about 102 hours |
| Digital Accessibility QA | 243 lessons, about 101 hours |

A track is sellable only if its exam bank is verified and it meets the content-depth bar
(`backend/src/lib/credentialBar.ts`, mirrored in `src/data/credentialBar.ts`). The 100-hour
shape of each track is enforced by `scripts/curriculum-audit.mjs`.

Four earlier foundation tracks (Code from Bed, AI Literacy, Build Cool Tools Fast, AI Agents
that Work) are archived: hidden and not sold, with content and existing purchases intact.

## Honest limits

- A certificate shows that someone passed an exam on a track. It is not a promise of employment
  (see the Terms and Imprint).
- Exams include AI-graded open questions and a 2-hour cooldown after a failed attempt.
- A sole trader's promise is only as durable as the sole trader. The Imprint has a plain
  Continuity section and says so.

## Before the first real sale

1. Stripe Tax enabled and registered, and `tax_behavior = inclusive` set on prices.
2. `HARDSHIP_CODE_SECRET` set on Vercel.
3. One real test-mode purchase end to end (webhook and receipt email).
4. Resend domain verified.
