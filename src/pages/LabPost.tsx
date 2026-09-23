import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Markdown from 'react-markdown';
import { SEO, blogPostingLd, breadcrumbLd } from '@/components/SEO';
import { labMarkdownComponents } from './lab/_labMarkdownComponents';
import labPosts from '@/data/labPosts.generated.json';
import { NotFound } from './NotFound';

export function LabPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = labPosts.find((p) => p.slug === slug);
  const [body, setBody] = useState<string | null>(null);

  useEffect(() => {
    if (!post) return;
    setBody(null);
    fetch(`/content/lab/${post.slug}.md`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error('not found'))))
      .then(setBody)
      .catch(() => setBody('_This post could not be loaded._'));
  }, [post]);

  if (!post) return <NotFound />;

  return (
    <article style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-4xl) var(--space-xl)' }}>
      <SEO
        title={post.title}
        description={post.description}
        canonical={`/lab/${post.slug}`}
        type="article"
        keywords={post.tags.join(', ')}
        article={{
          publishedTime: post.date,
          author: 'Roi Shternin-Martini',
          section: 'Lab',
          tags: post.tags,
        }}
        jsonLd={[
          blogPostingLd({
            headline: post.title,
            description: post.description,
            path: `/lab/${post.slug}`,
            datePublished: post.date,
            dateModified: post.date,
            keywords: post.tags.join(', '),
          }),
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: 'Lab', path: '/lab' },
            { name: post.title, path: `/lab/${post.slug}` },
          ]),
        ]}
      />

      <nav style={{ marginBottom: 'var(--space-2xl)', fontSize: '0.8125rem', fontFamily: 'var(--font-display)', color: 'var(--text-tertiary)' }}>
        <Link to="/lab" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>Lab</Link>
      </nav>

      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontSize: '2rem', lineHeight: 1.2, marginBottom: 'var(--space-md)' }}>{post.title}</h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}>
          {post.date} · {post.readTime}
        </p>
      </div>

      {body === null ? (
        <div role="status" aria-busy="true" aria-label="Loading post" style={{ minHeight: '40vh' }} />
      ) : (
        <Markdown components={labMarkdownComponents}>{body}</Markdown>
      )}

      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
        borderRadius: 12, padding: 'var(--space-2xl)', textAlign: 'center', marginTop: 'var(--space-4xl)',
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', fontSize: '0.9375rem' }}>
          Want to build something like this?
        </p>
        <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-xl)' }}>
          Every Soft Reset School lesson is free to read.
        </h3>
        <Link to="/tracks" style={{
          display: 'inline-block', background: 'var(--signal)', color: 'var(--bg-void)',
          fontWeight: 700, fontSize: '0.9375rem', padding: '12px 28px',
          borderRadius: 8, textDecoration: 'none', fontFamily: 'var(--font-display)',
        }}>
          See the tracks
        </Link>
      </div>

      <div style={{ marginTop: 'var(--space-2xl)' }}>
        <Link to="/lab" style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', fontFamily: 'var(--font-display)', textDecoration: 'none' }}>
          ← Back to Lab
        </Link>
      </div>
    </article>
  );
}
