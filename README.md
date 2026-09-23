> ## RESUMED - 23 September 2026
>
> Frozen 2026-08-22 as part of a portfolio focus decision (see git history for the
> original PAUSED note), resumed as part of a brand restructure that makes this repo
> the umbrella for **Soft Reset** — split into **Lab** (ongoing blog/thought-leadership
> content, including the migrated Chronically and rois.life archives) and **School**
> (the original four-track AI-skills program). `roishternin.com` stays a separate,
> unchanged personal/speaker site.
>
> **Note:** the Stripe products archived at freeze time (including the €69 Credential)
> were left archived — that's a separate decision from resuming content/dev work here.
> Un-archive them before relying on the paid checkout flow.

# Soft Reset School

The app serving [softreset.school](https://softreset.school) — the Soft Reset umbrella,
split into **Lab** (ongoing content) and **School** (AI-era employable skills for bed-
and home-bound chronically ill people). Every School lesson free forever; one-time €69
Credentials (certification exam + permanent, publicly verifiable certificate) are the
only paid product. See `BUSINESS_MODEL.md` for the full operating model.

**`main` is the production branch.** Pushing to `main` deploys softreset.school via the
Vercel Git integration, and the production build also runs `prisma migrate deploy` +
the idempotent seed, so lesson/exam content in the database stays in sync with
`backend/prisma/seed-data/`. A manual fallback deploy exists at
`.github/workflows/deploy-softreset.yml`.

## Stack

- Vite 8 + React 19.2 + TypeScript
- Express 5 (`api/index.ts`) + Prisma 6 (Postgres, schema `bedcoders`)
- Vercel deployment, custom domain `softreset.school`
- Stripe (one-time Credential checkout), Resend, Anthropic SDK

## Local dev

```bash
npm install
cp .env.example .env.local   # populate locally; never committed
npm run dev
```

## Build

```bash
npm run build
```

Outputs to `dist/`. Tests: `npm test` (vitest), `npm run test:e2e` (Playwright).

## History

Started as **Bedcoders** ("code from bed"), archived into Spooniversity in April 2026,
resurrected as a sister project 2026-05-07, then rebranded and expanded into Soft Reset
School with four career/reintegration tracks. On 2026-08-04 this repo briefly deployed
the old Bedcoders code over the live site (the repo name and its contents disagreed at
the time); the site source was recovered onto `production-soft-reset-school`, developed
further there, and on 2026-08-05 merged back into `main` — since then, the repo name
tells the truth. A pre-merge snapshot of the recovered app is preserved at
`backup/production-soft-reset-school-2026-08-04`.
