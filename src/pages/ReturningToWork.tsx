import { Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { SEO, breadcrumbLd } from '@/components/SEO';

const body = { color: 'var(--text-secondary)', fontSize: '1.0625rem', marginBottom: 'var(--space-lg)' } as const;

const steps = [
  {
    title: 'Find your real envelope',
    text: 'Before choosing a track, keep a plain log for two weeks: when you could think clearly, for how long, and what it cost you afterwards. You are looking for a number you can keep up in a bad week, not your best day.',
  },
  {
    title: 'Start with an hour a week',
    text: 'Every track is built from short lessons with no timers and no streaks. Begin with the free first lesson of any track. If an hour a week holds for a month, raise it. If it does not, lower it and nothing is lost: your place waits.',
  },
  {
    title: 'Say what the gap is, once',
    text: 'A gap in your history does not need a long explanation. A single plain sentence is enough, for example "I took time out for health reasons and have spent it retraining in X." Practise it aloud until it stops costing you anything.',
  },
  {
    title: 'Decide what you will ask for',
    text: 'Adjustments such as flexible hours, written instead of spoken instructions, or working from home are easier to ask for when you have chosen them first. In many countries the law supports reasonable requests, but the rules differ, so check yours with a local advice service.',
  },
  {
    title: 'Test before you commit',
    text: 'Try a small piece of real work, such as a short project or a few hours for a friend, before you rely on it. The aim is to find out what you can sustain while the stakes are low.',
  },
  {
    title: 'Keep what you have earned',
    text: 'A certificate here shows that you passed an exam on a track. It is not a promise of a job or an income. Use it as one piece of evidence next to the work you have shown.',
  },
];

export function ReturningToWork() {
  return (
    <div>
      <SEO
        title="Returning to work: a gentle first step"
        description="Six practical steps for going back to work at a pace you can sustain, after illness, burnout, caring or a career break. Free, no account, and no promises about jobs or income."
        canonical="/returning-to-work"
        jsonLd={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Returning to work', path: '/returning-to-work' },
        ])}
      />

      <section style={{ padding: 'var(--space-4xl) var(--space-xl) var(--space-2xl)', maxWidth: 720, margin: '0 auto' }}>
        <p style={{ color: 'var(--signal)', fontFamily: 'var(--font-display)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          returning to work
        </p>
        <h1 style={{ fontSize: 'clamp(2rem, 7vw, 2.75rem)', marginBottom: 'var(--space-xl)', lineHeight: 1.12 }}>
          Going back, at the pace your body allows.
        </h1>
        <p style={body}>
          You do not need a track before you need a plan. These six steps are short, free, and need no account. They do not promise a job or an income, and they are not medical or legal advice.
        </p>
      </section>

      <section style={{ padding: '0 var(--space-xl) var(--space-3xl)', maxWidth: 720, margin: '0 auto' }}>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-lg)' }}>
          {steps.map((s, i) => (
            <li key={s.title}>
              <Card>
                <h2 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-sm)' }}>
                  {i + 1}. {s.title}
                </h2>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{s.text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-md)' }}>When you are ready to learn a skill</h2>
          <p style={body}>
            The first lesson of every track is free, with no card. Each track is €99 once, with no subscription. If €99 is out of reach, ask for a hardship code at hi@softreset.school.
          </p>
          <Link to="/tracks"><Button variant="primary" size="lg">See the four tracks</Button></Link>
        </div>
      </section>
    </div>
  );
}
