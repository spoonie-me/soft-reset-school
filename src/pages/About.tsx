import { Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { SEO, breadcrumbLd } from '@/components/SEO';

const body = { color: 'var(--text-secondary)', fontSize: '1.0625rem', marginBottom: 'var(--space-lg)' } as const;
const strong = { color: 'var(--text-primary)' } as const;

export function About() {
  return (
    <div>
      <SEO
        title="About Roi Shternin-Martini and why this school exists"
        description="A medic who became the patient. Thirty-three doctors, a diagnosis I made myself, and the school I built for people who need to restart as many times as their body requires."
        canonical="/about"
        jsonLd={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ])}
      />

      {/* Hero */}
      <section style={{ padding: 'var(--space-4xl) var(--space-xl)', maxWidth: 720, margin: '0 auto' }}>
        <p style={{ color: 'var(--signal)', fontFamily: 'var(--font-display)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          about
        </p>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-xl)', lineHeight: 1.12 }}>
          A doctor told my parents I would never work again.
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
          I was 25. This school exists because he was wrong. And because of what it took to prove it.
        </p>
      </section>

      {/* Who I am */}
      <section style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-lg)' }}>who I am</h2>
          <p style={body}>
            I'm Roi. I live in Vienna.
          </p>
          <p style={body}>
            I started out as a medic with the Israeli Red Cross. I ran toward emergencies. It was the first thing I was ever good at.
          </p>
          <p style={body}>
            Then I became the patient.
          </p>
          <p style={body}>
            Thirty-three doctors told me nothing was wrong. My heart rate doubled when I stood up. My vision went black on the way to the bathroom. Nothing was wrong.
          </p>
          <p style={body}>
            One of them looked at my parents and said I would never walk, work or marry.
          </p>
          <p style={body}>
            I spent years in bed. So I did the only thing left. I taught myself medicine from there. Journals. Anatomy. Cardiology. Not for a degree. To find out what was happening to me.
          </p>
          <p style={body}>
            Then I walked into the office of doctor number thirty-four with a two-minute argument. I said what I thought it was. I said which test would prove it. He ordered the test.
          </p>
          <p style={body}>
            POTS. Postural Orthostatic Tachycardia Syndrome.
          </p>
          <p style={{ ...body, marginBottom: 0 }}>
            Years later I typed the same symptoms into an AI, just to see. It took ten seconds. Same answer. I sat with that for a long time.
          </p>
        </div>
      </section>

      {/* What came after */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>what came after</h2>
        <p style={body}>
          There was no single recovery. There never is. It came in pieces, over years, with setbacks in between.
        </p>
        <p style={body}>
          I built eight organisations from my bed. Not despite the illness. Through it.
        </p>
        <p style={body}>
          When you have two good hours a day, you stop wasting them. When your body tells the truth, you stop lying about what you can commit to. When every meeting costs you something physical, you get very good at deciding which ones are worth having.
        </p>
        <p style={body}>
          Then I became a father. You cannot perform invincibility holding a newborn at 3am in pain. I stopped trying.
        </p>
        <p style={{ ...body, marginBottom: 0 }}>
          <strong style={strong}>People like us already have skills.</strong> We manage a team of specialists who never talk to each other. We run logistics across broken systems. We make resource decisions every morning. We just never learned to put it on a CV.
        </p>
      </section>

      {/* Mission */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-lg)' }}>why this school exists</h2>
          <p style={body}>
            Most retraining is built for people with a full week to give. Live calls. Deadlines. Streaks. Miss one and you are behind.
          </p>
          <p style={body}>
            I tried them. They made me feel like I was failing at something I wasn't doing wrong.
          </p>
          <p style={body}>
            So this school works the other way. Short lessons. Resume anywhere. No streaks to lose. A lower-energy path in every module. Nothing in a lesson is timed.
          </p>
          <p style={body}>
            The first lesson of every track is free to try. After that it is €99 once per track, for the lessons, the exam and the certificate.
          </p>
          <p style={{ ...body, marginBottom: 0 }}>
            <strong style={strong}>This is not a cure story.</strong> A cure has an ending. Chronic illness doesn't give you one. You restart as many times as your body needs, and it still counts.
          </p>
        </div>
      </section>

      {/* The framework */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>machines handle information. humans handle transformation.</h2>
        <p style={body}>
          The AI found my diagnosis in ten seconds. It took me years and thirty-three doctors.
        </p>
        <p style={body}>
          It still cannot hear what "I'm fine" means when a patient says it gripping the arms of the chair. It cannot sit with grief. It cannot notice that someone's hope is declining before their vitals are.
        </p>
        <p style={body}>
          So the useful question is not whether AI can do the job. It is what only a human should do here.
        </p>
        <p style={{ ...body, marginBottom: 0 }}>
          We answer it two ways. <strong style={{ color: 'var(--signal)' }}>AI-enabled</strong> work, where directing AI well means your ceiling is no longer your hours. <strong style={{ color: 'var(--crystal)' }}>AI-resistant</strong> work, where the judgment is human and should stay that way.
        </p>
      </section>

      {/* Why these 4 tracks */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-border)', borderBottom: '1px solid var(--bg-border)', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 'var(--space-sm)' }}>four tracks. chosen on purpose.</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)', maxWidth: 640 }}>
            Each one is work you can do from a bed or a couch. Each one is argued for, not assumed.
          </p>
          <div className="grid-2" style={{ display: 'grid', gap: 'var(--space-xl)' }}>
            <Card>
              <h3 style={{ color: 'var(--signal)', fontSize: '1.0625rem', marginBottom: 'var(--space-md)' }}>AI-Assisted Software Development</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Direct AI tools. Review what they hand back. Catch what they get confidently wrong. The demand is real. I am not promising you a job.
              </p>
              <Link to="/tracks/ai-orchestrated-dev" style={{ display: 'inline-block', marginTop: 'var(--space-md)', color: 'var(--signal)', fontSize: '0.9375rem', textDecoration: 'underline', textUnderlineOffset: '2px' }}>See the track and enrol &rarr;</Link>
            </Card>
            <Card>
              <h3 style={{ color: 'var(--gold)', fontSize: '1.0625rem', marginBottom: 'var(--space-md)' }}>AI Automation Consulting</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Where AI belongs in a business process. And where it doesn't. You will not find the $200 to $500 an hour figures that circulate online here. They are bait.
              </p>
              <Link to="/tracks/ai-workflow-consulting" style={{ display: 'inline-block', marginTop: 'var(--space-md)', color: 'var(--signal)', fontSize: '0.9375rem', textDecoration: 'underline', textUnderlineOffset: '2px' }}>See the track and enrol &rarr;</Link>
            </Card>
            <Card>
              <h3 style={{ color: 'var(--crystal)', fontSize: '1.0625rem', marginBottom: 'var(--space-md)' }}>AI-Augmented Medical Coding</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Not entry-level coding. AI is automating that layer fastest. We teach the review layer, where the hard cases get routed. That part lasts.
              </p>
              <Link to="/tracks/ai-oversight-health-informatics" style={{ display: 'inline-block', marginTop: 'var(--space-md)', color: 'var(--signal)', fontSize: '0.9375rem', textDecoration: 'underline', textUnderlineOffset: '2px' }}>See the track and enrol &rarr;</Link>
            </Card>
            <Card>
              <h3 style={{ color: 'var(--rust)', fontSize: '1.0625rem', marginBottom: 'var(--space-md)' }}>Digital Accessibility QA</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                You sit behind the real assistive technology. You tab. You listen. A scanner can read a WCAG checklist. It cannot tell you what it is like to use the page.
              </p>
              <Link to="/tracks/accessibility-qa-lived-experience" style={{ display: 'inline-block', marginTop: 'var(--space-md)', color: 'var(--signal)', fontSize: '0.9375rem', textDecoration: 'underline', textUnderlineOffset: '2px' }}>See the track and enrol &rarr;</Link>
            </Card>
          </div>
        </div>
      </section>

      {/* What I won't promise */}
      <section style={{ padding: 'var(--space-3xl) var(--space-xl)', maxWidth: 720, margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-lg)' }}>what I won't promise</h2>
        <p style={body}>
          A certificate is proof of practiced skill. It is not a promise of a job.
        </p>
        <p style={{ ...body, marginBottom: 0 }}>
          The curricula are young and still growing. Every track page tells you exactly how many lessons sit behind it before you pay anything. I would rather you hear that from me now.
        </p>
      </section>

      {/* CTA */}
      <section style={{ padding: 'var(--space-4xl) var(--space-xl)', textAlign: 'center', borderTop: '1px solid var(--bg-border)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: 560, margin: '0 auto var(--space-2xl)' }}>
          If you want a hard reboot, there are faster places. If you need a soft one, start with lesson 1.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/signup"><Button variant="primary" size="lg">Try lesson 1 free</Button></Link>
          <Link to="/employers"><Button variant="secondary" size="lg">For Employers</Button></Link>
        </div>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: 'var(--space-xl)' }}>
          Or write to me: <a href="mailto:hi@softreset.school" style={{ color: 'var(--signal)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>hi@softreset.school</a>
        </p>
      </section>
    </div>
  );
}
