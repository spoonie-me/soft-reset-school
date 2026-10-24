import { BlogLayout } from './_BlogLayout';

const h2: React.CSSProperties = { fontSize: '1.375rem', marginTop: 'var(--space-3xl)', marginBottom: 'var(--space-lg)' };
const h3: React.CSSProperties = { fontSize: '1.125rem', marginTop: 'var(--space-2xl)', marginBottom: 'var(--space-md)' };
const p: React.CSSProperties = { color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 'var(--space-lg)' };

export function CodingWithChronicIllness() {
  return (
    <BlogLayout
      tag="Lifestyle"
      tagColor="var(--gold)"
      date="2026-02-14"
      dateModified="2026-05-08"
      keywords="coding with chronic illness, POTS coding, ME/CFS career, fibromyalgia developer, Long COVID career change, accessible bootcamp, pacing for developers, disabled coders, EDS coding, low energy learning"
      readTime="5 min read"
      title="Coding with Chronic Illness: How to Ship When Your Body Says No"
      description="Brain fog, fatigue, and pain days are real. Here's how disabled and chronically ill coders structure their work to still ship — without burning out."
      category="Lifestyle"
      slug="coding-with-chronic-illness"
    >
      <h1 style={{ fontSize: '2rem', lineHeight: 1.2, marginBottom: 'var(--space-xl)' }}>
        Coding with Chronic Illness:<br />
        <span style={{ color: 'var(--gold)' }}>How to Ship When Your Body Says No</span>
      </h1>

      <p style={p}>
        Soft Reset School exists because traditional coding education wasn't designed for people whose bodies don't cooperate. Three-hour video lectures. Daily homework streaks that punish rest. Synchronous cohorts that assume you're available at 9am on Tuesdays.
      </p>

      <p style={p}>
        That's not how a lot of coders actually work — especially those of us with chronic illness, POTS, fibromyalgia, fatigue conditions, or any of the hundred ways the body can decide it's not cooperating today.
      </p>

      <p style={p}>
        This is a guide to building a coding practice that survives bad days.
      </p>

      <h2 style={h2}>Design for your worst day, not your best</h2>

      <p style={p}>
        Most productivity advice is written for people who can plan around their capacity. If you have a chronic condition, your capacity is the variable. Build your learning practice around that reality.
      </p>

      <p style={p}>
        That means: your unit of progress should be something you can complete on a bad day. A short lesson. One exercise. Reading one section. Not "finish Module 3." If you can't do the minimum unit, you can't do anything — and anything is better than nothing.
      </p>

      <h3 style={h3}>The 3-shift method</h3>

      <p style={p}>
        Instead of planning by hours, plan by micro-sessions. Three 20-minute windows across a day — morning, afternoon, evening — each with a specific, tiny task:
      </p>

      <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-xl)', lineHeight: 1.8, marginBottom: 'var(--space-lg)' }}>
        <li style={{ marginBottom: '0.75rem' }}>Session 1: Read or watch one lesson unit</li>
        <li style={{ marginBottom: '0.75rem' }}>Session 2: Try one exercise (don't finish it, just try)</li>
        <li style={{ marginBottom: '0.75rem' }}>Session 3: Review what you did, close the loop</li>
      </ul>

      <p style={p}>
        Each session is completable even when foggy. Missing one doesn't tank the whole day.
      </p>

      <h2 style={h2}>Using AI as an accommodation</h2>

      <p style={p}>
        Claude is genuinely useful for people with cognitive limitations. Brain fog makes reading dense documentation painful. You can paste that documentation into Claude and ask it to explain one concept at a time, in plain English, without jargon.
      </p>

      <p style={p}>
        This isn't "cheating." It's using the tools available. The goal is understanding, not suffering through material that wasn't written for you.
      </p>

      <h3 style={h3}>Ask for what you need</h3>

      <p style={p}>
        "Explain this like I'm reading it through brain fog" is a legitimate prompt. "Give me just the one thing I need to remember from this" is a legitimate prompt. You're allowed to make the material work for your brain.
      </p>

      <h2 style={h2}>The streak myth</h2>

      <p style={p}>
        Streak-based learning systems are designed for people with consistent capacity. When you miss a day because you're bedridden, the system breaks. That's a problem with the system, not with you.
      </p>

      <p style={p}>
        Soft Reset School tracks XP, not streaks. Your progress doesn't evaporate when you have a flare. You come back to where you left off. That's the design — not an afterthought.
      </p>

      <h2 style={h2}>You're not behind</h2>

      <p style={p}>
        "Behind" implies there's a schedule you're supposed to be keeping pace with. There isn't. There's you and the material. Go at the pace your body allows. A lesson finished in three weeks still beats one never started.
      </p>
    </BlogLayout>
  );
}
