import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { useAuth } from '@/lib/AuthContext';
import { SEO } from '@/components/SEO';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      // Error is already set in AuthContext
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: 'var(--space-4xl) var(--space-xl)' }}>
      <SEO title="Log In" description="Log in to your Soft Reset School account." canonical="/login" noIndex />
      <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-sm)' }}>Welcome back</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>
        Log in to continue learning.
      </p>

      {error && <ErrorBanner message={error} onDismiss={clearError} />}

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}
      >
        <div>
          <label
            htmlFor="login-email"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-xs)',
            }}
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            disabled={loading}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label
            htmlFor="login-password"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-xs)',
            }}
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
            autoComplete="current-password"
            disabled={loading}
            style={{ width: '100%' }}
          />
        </div>
        <Button
          variant="primary"
          style={{ width: '100%', marginTop: 'var(--space-sm)' }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log in'}
        </Button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        <Link to="/forgot-password" style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
          Forgot your password?
        </Link>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', margin: 0 }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--signal)' }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
