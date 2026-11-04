import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { SEO, breadcrumbLd } from '@/components/SEO';

const PATHS = [
  {
    icon: '🛠️',
    color: 'var(--signal)',
    title: 'Freelance AI-tool building',
    desc: 'Small businesses and solo professionals increasingly need one-off automations and AI-powered tools — a Slack bot, an intake form that drafts replies, a Claude-powered internal assistant. That work is scoped, async-friendly, and doesn\'t require sitting in an office.',
    example: 'A Bedcoders graduate builds a document-summarizing tool for a local law firm as a paid side project, working entirely from bed over two weeks.',
  },
  {
    icon: '💻',
    color: 'var(--gold)',
    title: 'Remote junior developer work',
    desc: 'Junior and entry-level roles that are fully remote and async-first exist — especially at companies already comfortable with distributed, asynchronous teams. Your certificate and portfolio projects are what gets you the interview.',
    example: 'A graduate lands a part-time junior dev role at a remote-first startup, working flexible hours around flare days.',
  },
  {
    icon: '🏥',
    color: 'var(--rust)',
    title: 'Building internal tools for a patient org',
    desc: 'Patient organizations, nonprofits, and advocacy groups need internal tools — intake trackers, resource databases, AI-assisted triage — and rarely have budget for a full dev team. Your lived experience plus your new technical skills make you the ideal person to build for that space.',
    example: 'A graduate builds a symptom-tracking dashboard for a rare-disease nonprofit, turning patient-community knowledge into a shipped product.',
  },
];

export function Outcomes() {
  return (
    <div>
      <SEO
        title="Outcomes — What You Can Do After Bedcoders"
        description="Bedcoders isn't just lessons — it's a pathway to income. See the concrete paths graduates take: freelance AI-tool building, remote junior developer work, and building tools for patient organizations."
        canonical="/outcomes"
        keywords="coding bootcamp outcomes, remote developer jobs chronic illness, freelance AI tool building, career change tech disability"
        jsonLd={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Outcomes', path: '/outcomes' },
        ])}
      />

      {/* Hero */}
      <section style={{ padding: 'var(--space-4xl) var(--space-xl)', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--signal)', fontFamily: 'var(--font-display)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Outcomes
        </p>
        <h1 style={{ fontSize: '2.75rem', marginBottom: 'var(--space-xl)', lineHeight: 1.1 }}>
          What you can actually <span style={{ color: 'var(--signal)' }}>do</span> after Bedcoders
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: 640, margin: '0 auto' }}>
          Lessons and certificates aren't the point — income is. Here's where the four tracks actually lead, concretely, not hypothetically.
        </p>
      </section>

      {/* Paths */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gap: 'var(--space-xl)' }}>
          {PATHS.map((p) => (
            <Card key={p.title} style={{ padding: 'var(--space-2xl)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '2rem', flexShrink: 0 }}>{p.icon}</span>
                <div>
                  <div style={{ width: 32, height: 3, background: p.color, borderRadius: 2, marginBottom: 'var(--space-md)' }} />
                  <h3 style={{ marginBottom: 'var(--space-md)' }}>{p.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: 'var(--space-md)' }}>{p.desc}</p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', fontStyle: 'italic', lineHeight: 1.6 }}>{p.example}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* What gets you there */}
      <section style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-xl)' }}>What actually gets you there</h2>
          <ul style={{ display: 'grid', gap: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            <li style={{ display: 'flex', gap: 'var(--space-sm)' }}><span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span> A verifiable certificate for each track you complete, shareable on LinkedIn</li>
            <li style={{ display: 'flex', gap: 'var(--space-sm)' }}><span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span> Real exercises you build, not just multiple-choice — portfolio material from day one</li>
            <li style={{ display: 'flex', gap: 'var(--space-sm)' }}><span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span> Fundamentals → AI Literacy → Tools → Agents, so you can stop at whichever track matches the outcome you want</li>
            <li style={{ display: 'flex', gap: 'var(--space-sm)' }}><span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span> A pace that doesn't demand consistency you don't have — so you actually finish, instead of abandoning it on a bad month</li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>Start with one free lesson</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)', maxWidth: 500, margin: '0 auto var(--space-xl)' }}>
          See what the pace and the content actually feel like before you commit to anything.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/signup"><Button variant="primary" size="lg">Start free</Button></Link>
          <Link to="/pricing"><Button variant="secondary" size="lg">See pricing</Button></Link>
        </div>
      </section>
    </div>
  );
}
