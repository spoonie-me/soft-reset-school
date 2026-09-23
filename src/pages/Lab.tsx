import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import labPosts from '@/data/labPosts.generated.json';

const SOURCE_COLOR: Record<string, string> = {
  'chronically.life': 'var(--gold)',
  'rois.life': 'var(--crystal)',
  'Soft Reset Lab': 'var(--signal)',
};

function sourceLabel(source: string) {
  if (source === 'chronically.life') return 'Chronically';
  if (source === 'rois.life') return 'Personal essay';
  return source || 'Lab';
}

export function Lab() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const posts = q
    ? labPosts.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
      )
    : labPosts;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 'var(--space-4xl) var(--space-xl)' }}>
      <SEO
        title="Soft Reset Lab — Dell, Clinical AI, and Living With a Body That Doesn't Cooperate"
        description="Ongoing work on machines, medicine, and what's left for humans to do: Dell/NVIDIA hardware notes, clinical AI, chronic illness, and thought leadership from Roi Shternin-Martini."
        canonical="/lab"
        type="website"
      />

      <div style={{ marginBottom: 'var(--space-3xl)' }}>
        <p style={{
          color: 'var(--signal)', fontFamily: 'var(--font-display)', fontSize: '0.8125rem',
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 'var(--space-md)',
        }}>
          Soft Reset Lab
        </p>
        <h1 style={{ fontSize: '2.25rem', lineHeight: 1.15, marginBottom: 'var(--space-lg)' }}>
          Machines hold information.<br />
          <span style={{ color: 'var(--signal)' }}>Humans hold transformation.</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', maxWidth: 560 }}>
          The ongoing body of work: clinical AI, Dell/NVIDIA hardware notes, and everything written
          under Chronically and rois.life — brought under one roof.
        </p>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search the Lab…"
        aria-label="Search Lab posts"
        style={{
          width: '100%', padding: '12px 16px', marginBottom: 'var(--space-2xl)',
          background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 8,
          color: 'var(--text-primary)', fontSize: '0.9375rem',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {posts.map((post) => (
          <Link
            key={post.slug}
            to={`/lab/${post.slug}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <article style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
              borderRadius: 12, padding: 'var(--space-2xl)', transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--signal)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--bg-border)')}
            >
              <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                  color: SOURCE_COLOR[post.source] || 'var(--signal)', fontFamily: 'var(--font-display)',
                  border: `1px solid ${SOURCE_COLOR[post.source] || 'var(--signal)'}`, padding: '2px 9px',
                  borderRadius: 6, opacity: 0.9,
                }}>
                  {sourceLabel(post.source)}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}>
                  {post.date} · {post.readTime}
                </span>
              </div>
              <h2 style={{ fontSize: '1.25rem', lineHeight: 1.3, marginBottom: 'var(--space-md)' }}>
                {post.title}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.65, marginBottom: 'var(--space-lg)' }}>
                {post.description}
              </p>
              <span style={{ fontSize: '0.875rem', color: 'var(--signal)', fontFamily: 'var(--font-display)' }}>
                Read article →
              </span>
            </article>
          </Link>
        ))}
        {posts.length === 0 && (
          <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-3xl) 0' }}>
            Nothing matches "{query}".
          </p>
        )}
      </div>
    </div>
  );
}
