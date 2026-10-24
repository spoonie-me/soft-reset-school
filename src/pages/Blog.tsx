import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';

const POSTS = [
  {
    slug: 'what-is-ai-literacy',
    title: 'What Is AI Literacy? Why Every Coder Needs It in 2026',
    excerpt:
      'AI literacy isn\'t about knowing the math behind transformers. It\'s about knowing when to trust the model, how to write prompts that actually work, and where AI falls flat.',
    tag: 'AI Literacy',
    tagColor: 'var(--signal)',
    readTime: '6 min read',
    date: 'March 2026',
  },
  {
    slug: 'build-your-first-ai-app',
    title: 'Build Your First AI App with Claude API: A Practical Guide',
    excerpt:
      'You don\'t need a PhD to build something useful with AI. Here\'s how to go from zero to a working app using Claude API — in an afternoon, from your couch.',
    tag: 'Tutorial',
    tagColor: 'var(--rust)',
    readTime: '7 min read',
    date: 'March 2026',
  },
  {
    slug: 'coding-with-chronic-illness',
    title: 'Coding with Chronic Illness: How to Ship When Your Body Says No',
    excerpt:
      'Brain fog, fatigue, and pain days are real. Here\'s how disabled and chronically ill coders structure their work to still ship — without burning out.',
    tag: 'Lifestyle',
    tagColor: 'var(--gold)',
    readTime: '5 min read',
    date: 'February 2026',
  },
  {
    slug: 'prompt-engineering-guide',
    title: 'Prompt Engineering in 2026: The Honest, No-Hype Guide',
    excerpt:
      'Chain-of-thought, few-shot, system prompts — we cut through the buzzwords and show you what actually works for building reliable AI-powered tools.',
    tag: 'Prompt Engineering',
    tagColor: 'var(--crystal)',
    readTime: '8 min read',
    date: 'February 2026',
  },
];

export function Blog() {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 'var(--space-4xl) var(--space-xl)' }}>
      <SEO
        title="Soft Reset School Blog — AI Literacy, Coding Guides & Builder Resources"
        description="Deep-dives on prompt engineering, Claude API, AI agents, coding with chronic illness, and building tools that actually ship."
        canonical="/blog"
        type="website"
      />
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-3xl)' }}>
        <p style={{
          color: 'var(--signal)',
          fontFamily: 'var(--font-display)',
          fontSize: '0.8125rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 'var(--space-md)',
        }}>
          Soft Reset School Blog
        </p>
        <h1 style={{ fontSize: '2.25rem', lineHeight: 1.15, marginBottom: 'var(--space-lg)' }}>
          Build smarter,<br />
          <span style={{ color: 'var(--signal)' }}>from wherever you are.</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', maxWidth: 560 }}>
          AI literacy, prompt engineering, coding for chronically ill folks, and everything you need to build real things with Claude — no CS degree required.
        </p>
      </div>

      {/* Post list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {POSTS.map((post) => (
          <Link
            key={post.slug}
            to={`/blog/${post.slug}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <article style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)',
              borderRadius: 12,
              padding: 'var(--space-2xl)',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--signal)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--bg-border)')}
            >
              <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: post.tagColor,
                  fontFamily: 'var(--font-display)',
                  border: `1px solid ${post.tagColor}`,
                  padding: '2px 9px',
                  borderRadius: 6,
                  opacity: 0.9,
                }}>
                  {post.tag}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}>
                  {post.date} · {post.readTime}
                </span>
              </div>
              <h2 style={{ fontSize: '1.25rem', lineHeight: 1.3, marginBottom: 'var(--space-md)' }}>
                {post.title}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.65, marginBottom: 'var(--space-lg)' }}>
                {post.excerpt}
              </p>
              <span style={{ fontSize: '0.875rem', color: 'var(--signal)', fontFamily: 'var(--font-display)' }}>
                Read article →
              </span>
            </article>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div style={{
        marginTop: 'var(--space-4xl)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--bg-border)',
        borderRadius: 12,
        padding: 'var(--space-2xl)',
        textAlign: 'center',
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', fontSize: '0.9375rem' }}>
          Ready to go beyond the reading?
        </p>
        <h3 style={{ fontSize: '1.375rem', marginBottom: 'var(--space-xl)' }}>
          Try lesson 1 of any track free — no card required.
        </h3>
        <Link to="/signup" style={{
          display: 'inline-block',
          background: 'var(--signal)',
          color: 'var(--bg-void)',
          fontWeight: 700,
          fontSize: '0.9375rem',
          padding: '12px 28px',
          borderRadius: 8,
          textDecoration: 'none',
          fontFamily: 'var(--font-display)',
        }}>
          Try lesson 1 free
        </Link>
      </div>
    </div>
  );
}
