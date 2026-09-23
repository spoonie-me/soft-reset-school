import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { useAuth } from '@/lib/AuthContext';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-lg) var(--space-xl)',
        borderBottom: '1px solid var(--bg-border)',
        flexWrap: 'wrap',
        position: 'relative',
      }}
    >
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }} aria-label="Soft Reset School home">
        <img src="/favicon.svg" alt="" width={24} height={24} style={{ display: 'block', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '1.125rem', letterSpacing: '-0.01em' }}>
          Soft Reset School
        </span>
      </Link>

      <button
        className="mobile-menu-toggle"
        onClick={() => setMenuOpen((o) => !o)}
        aria-expanded={menuOpen}
        aria-controls="main-nav"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
      >
        {menuOpen ? '\u2715' : '\u2630'}
      </button>

      <nav
        id="main-nav"
        aria-label="Main navigation"
        className={`main-nav${menuOpen ? ' main-nav--open' : ''}`}
      >
        <Link to="/tracks" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Tracks</Link>
        <Link to="/lab" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Lab</Link>
        <Link to="/about" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>About</Link>
        <Link to="/pricing" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Pricing</Link>
        {user ? (
          <>
            <Link to="/dashboard" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Dashboard</Link>
            <Link to="/settings" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Settings</Link>
          </>
        ) : (
          <Link to="/employers" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>For Employers</Link>
        )}
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          {user ? (
            <Link to="/dashboard"><Button variant="primary" size="sm">Dashboard</Button></Link>
          ) : (
            <>
              <Link to="/login"><Button variant="secondary" size="sm">Log in</Button></Link>
              <Link to="/signup"><Button variant="primary" size="sm">Start free</Button></Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
