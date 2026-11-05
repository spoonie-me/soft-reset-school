/* Shared react-markdown component overrides for Lab post bodies.
 * Mirrors the visual language of the hand-authored blog posts in
 * src/pages/blog/_blogStyles.ts, since Lab content is long-form prose
 * fetched at runtime rather than written as JSX. */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export const labMarkdownComponents = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 style={{ fontSize: '2rem', lineHeight: 1.2, marginBottom: 'var(--space-xl)', color: 'var(--text-primary)' }}>
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 'var(--space-3xl)', marginBottom: 'var(--space-md)' }}>
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 'var(--space-2xl)', marginBottom: 'var(--space-sm)' }}>
      {children}
    </h3>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 'var(--space-lg)', fontSize: '1rem' }}>
      {children}
    </p>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong style={{ color: 'var(--text-primary)' }}>{children}</strong>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul style={{ paddingLeft: 'var(--space-xl)', marginBottom: 'var(--space-lg)', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
      {children}
    </ul>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li style={{ marginBottom: 'var(--space-xs)' }}>{children}</li>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderLeft: '3px solid var(--signal)',
      borderRadius: 'var(--radius-md)', padding: 'var(--space-lg) var(--space-xl)', marginBottom: 'var(--space-2xl)',
      color: 'var(--text-secondary)',
    }}>
      {children}
    </blockquote>
  ),
  a: ({ children, href }: { children?: ReactNode; href?: string }) =>
    href?.startsWith('/') ? (
      <Link to={href} style={{ color: 'var(--signal)' }}>{children}</Link>
    ) : (
      <a href={href} style={{ color: 'var(--signal)' }} target={href?.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
        {children}
      </a>
    ),
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <img
      src={src}
      alt={alt ?? ''}
      style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 12, margin: 'var(--space-2xl) 0' }}
    />
  ),
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--bg-border)', margin: 'var(--space-3xl) 0' }} />,
};
