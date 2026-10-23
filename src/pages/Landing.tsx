import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SEO } from '@/components/SEO';
import { SoftResetWave } from '@/components/SoftResetWave';

const AI_ENABLED_TRACKS = [
  {
    slug: 'ai-orchestrated-dev',
    color: 'var(--signal)',
    title: 'AI-Assisted Software Development',
    desc: 'Direct AI tools well enough that your energy envelope stops setting your ceiling. Write executable specs, catch the bugs AI confidently gets wrong, ship real code without typing every line.',
  },
  {
    slug: 'ai-workflow-consulting',
    color: 'var(--gold)',
    title: 'AI Automation Consulting',
    desc: 'Design where AI actually belongs in a real process — and where it doesn\'t. Consulting skills for the org that needs someone who\'s honest about the limits, not just the demo.',
  },
];

const AI_RESISTANT_TRACKS = [
  {
    slug: 'ai-oversight-health-informatics',
    color: 'var(--crystal)',
    title: 'AI-Augmented Medical Coding',
    desc: 'Expert-level review and exception-handling for AI-generated clinical code — not entry-level data entry. The layer AI routes complex cases to, not the layer it\'s automating away.',
  },
  {
    slug: 'accessibility-qa-lived-experience',
    color: 'var(--rust)',
    title: 'Digital Accessibility QA',
    desc: 'Review grounded in WCAG standards and what a screen reader actually announces, what a keyboard-only user actually experiences. A perspective an automated scanner can\'t fake.',
  },
];

export function Landing() {
  return (
    <div>
      <SEO
        title="Soft Reset School | A restart, not a comeback story"
        description="Free lessons in AI-era work skills for people returning to work after illness or time away. Short units, a lower-energy path in every module, nothing timed."
        canonical="/"
      />

      {/* Hero */}
      <section style={{ padding: 'var(--space-4xl) var(--space-xl)', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 'var(--space-3xl)', alignItems: 'center' }} className="grid-2">
          <div>
            <p style={{ color: 'var(--signal)', fontFamily: 'var(--font-display)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              a restart, not a comeback story
            </p>
            <h1 style={{ fontSize: 'clamp(2rem, 7vw, 3rem)', marginBottom: 'var(--space-xl)', lineHeight: 1.08 }}>
              You don't need a hard reboot.<br />
              <span style={{ color: 'var(--signal)' }}>You need a soft one.</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: 'var(--space-lg)', maxWidth: 560 }}>
              A hard reset wipes the slate and starts from zero, once. A soft reset lets you resume, gently, as many times as your body requires — no cure required first, no "get well, then work."
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', marginBottom: 'var(--space-2xl)', maxWidth: 560 }}>
              Real, billable AI-era skills for people who are bed- or home-bound. Direct AI tools well enough that your energy envelope stops setting your ceiling — or bring judgment an AI structurally can't supply. Either way: income built from inside the illness, not after it.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-2xl)' }}>
              {['4 new tracks', 'AI-enabled or AI-resistant', 'no streak penalties', 'crash-day kind'].map((stat) => (
                <span key={stat} style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', border: '1px solid var(--bg-border)', padding: '3px 10px', borderRadius: 6, fontFamily: 'var(--font-display)' }}>{stat}</span>
              ))}
            </div>
            <div className="hero-cta" style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
              <Link to="/signup">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    (window as any).trackEvent?.('cta_click', { cta: 'get_started', location: 'hero' });
                    if (typeof (window as any).umami !== 'undefined') (window as any).umami.track('get-started-hero');
                  }}
                >
                  Start for Free
                </Button>
              </Link>
              <Link to="/pricing"><Button variant="secondary" size="lg">See pricing</Button></Link>
            </div>
          </div>
          <div style={{ height: 220, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)' }}>
            <SoftResetWave />
          </div>
        </div>
      </section>

      {/* Origin */}
      <section style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-xl)' }}>a paramedic who became the patient</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', marginBottom: 'var(--space-lg)' }}>
            Nine years responding to other people's emergencies, then years being the emergency nobody reached in time — dismissed by doctor after doctor before a diagnosis that should have come sooner. That's the actual founding story here, not a metaphor borrowed for a pitch deck.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Machines handle information. Humans handle transformation.</strong> That's the whole organizing idea behind every track here — let AI hold what it's actually good at, and build the part of your income around what it structurally can't do.
          </p>
        </div>
      </section>

      {/* Tracks — organized by the actual framework, not arbitrary cards */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-sm)' }}>two kinds of income, one honest question</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)', maxWidth: 640 }}>
          Every track answers the same question differently: what should only a human do here? Four tracks split across the two real answers.
        </p>

        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.8125rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--signal)', marginBottom: 'var(--space-lg)' }}>
          AI-enabled — you direct it, your hours don't cap your output
        </p>
        <div className="grid-2" style={{ marginBottom: 'var(--space-2xl)' }}>
          {AI_ENABLED_TRACKS.map((track) => (
            <Link key={track.title} to={`/tracks/${track.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <Card style={{ height: '100%' }}>
                <div style={{ width: 40, height: 4, background: track.color, borderRadius: 2, marginBottom: 'var(--space-lg)' }} />
                <h3 style={{ color: track.color, marginBottom: 'var(--space-md)', fontSize: '1.125rem' }}>{track.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-md)' }}>{track.desc}</p>
                <span style={{ color: track.color, fontSize: '0.8125rem', fontFamily: 'var(--font-display)' }}>see what's inside &rarr;</span>
              </Card>
            </Link>
          ))}
        </div>

        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.8125rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--crystal)', marginBottom: 'var(--space-lg)' }}>
          AI-resistant — judgment and trust an algorithm can't supply
        </p>
        <div className="grid-2">
          {AI_RESISTANT_TRACKS.map((track) => (
            <Link key={track.title} to={`/tracks/${track.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <Card style={{ height: '100%' }}>
                <div style={{ width: 40, height: 4, background: track.color, borderRadius: 2, marginBottom: 'var(--space-lg)' }} />
                <h3 style={{ color: track.color, marginBottom: 'var(--space-md)', fontSize: '1.125rem' }}>{track.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: 'var(--space-md)' }}>{track.desc}</p>
                <span style={{ color: track.color, fontSize: '0.8125rem', fontFamily: 'var(--font-display)' }}>see what's inside &rarr;</span>
              </Card>
            </Link>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: 'var(--space-2xl)' }}>
          Prefer to start with foundations first? The original coding curriculum — programming basics through AI agents — is still here, free to read like everything else. <Link to="/tracks" style={{ color: 'var(--signal)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Browse all 8 tracks</Link>. Every track ends in an optional <Link to="/pricing" style={{ color: 'var(--signal)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>€69 career credential</Link> employers can verify.
        </p>
      </section>

      {/* Features */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-2xl)' }}>learning that doesn't suck</h2>
          <div className="grid-2">
            {[
              { title: '200+ practice exercises', desc: 'Coding challenges, real-world scenarios, case studies, and more. AI grades every answer with written feedback tuned to the actual track — a health-informatics reviewer\'s tone is not a coding tutor\'s tone.' },
              { title: 'AI-powered feedback', desc: 'Submit an exercise at 2am and get expert-quality feedback instantly. No waiting for a tutor.' },
              { title: 'Learn at your own pace', desc: 'No deadlines. No cohorts. No FOMO. Pause whenever your body says so — your progress waits.' },
              { title: 'Exam when you\'re ready', desc: 'Sit the track exam only when you feel confident. No deadline, no re-purchase, no pressure.' },
              { title: 'Verifiable certificate', desc: 'Every certificate has a public verification code. Share on LinkedIn. Employers can verify it instantly.' },
              { title: 'Built for variable capacity', desc: '15–30 minute lessons. No deadlines, no time pressure. No streaks to break. No "you missed 3 days" emails. Your body sets the schedule.' },
            ].map((f) => (
              <div key={f.title} style={{ display: 'flex', gap: 'var(--space-lg)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--signal)', marginTop: 8, flexShrink: 0 }} />
                <div>
                  <h4 style={{ marginBottom: 'var(--space-xs)' }}>{f.title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', background: 'var(--bg-elevated)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-sm)' }}>every lesson is free. no card, no subscription.</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>
            Read every lesson in every track for free, forever. Nothing bills you on a bad month — there is no monthly anything. You pay once, only when you're ready to prove it.
          </p>
          <Card style={{ textAlign: 'center', maxWidth: 440, margin: '0 auto var(--space-2xl)', borderColor: 'var(--signal)' }}>
            <div style={{ width: 32, height: 3, background: 'var(--signal)', borderRadius: 2, margin: '0 auto var(--space-md)' }} />
            <p style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 500, marginBottom: 4 }}>€69 <span style={{ fontSize: '1rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>once, per credential</span></p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-lg)' }}>certification exam · permanent verifiable certificate · no renewal, ever</p>
            <Link to="/pricing" style={{ textDecoration: 'none' }}><Button variant="primary" size="sm" style={{ width: '100%' }}>See pricing</Button></Link>
          </Card>
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
            Can't afford €69? Pay what you can, down to €0 — no proof, no application. · <Link to="/for-teams" style={{ color: 'var(--signal)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Credential vouchers for organisations &rarr;</Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'var(--space-4xl) var(--space-xl)', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>restart as many times as you need to.</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)', fontSize: '1.125rem' }}>
          Every lesson free. No card. No deadlines. No good day required.
        </p>
        <Link to="/signup">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              (window as any).trackEvent?.('cta_click', { cta: 'get_started', location: 'footer' });
              if (typeof (window as any).umami !== 'undefined') (window as any).umami.track('get-started-footer');
            }}
          >
            Start for Free
          </Button>
        </Link>
      </section>
    </div>
  );
}
