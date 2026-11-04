import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { SEO } from '@/components/SEO';

export function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 'var(--space-3xl)' }}>
      <SEO
        title="Page not found — Soft Reset School"
        description="That page doesn't exist (or moved). Head back to the homepage to find what you were looking for."
        noIndex
      />
      <h1 style={{ fontSize: '4rem', color: 'var(--signal)', fontFamily: 'var(--font-display)', marginBottom: 'var(--space-lg)' }}>404</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: 'var(--space-2xl)' }}>
        This page doesn't exist. Maybe it's still loading.
      </p>
      <Link to="/"><Button variant="primary">Back to home</Button></Link>
    </div>
  );
}
