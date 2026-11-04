import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--bg-border)',
        background: 'var(--bg-surface)',
        padding: 'var(--space-2xl)',
        marginTop: 'var(--space-3xl)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          className="grid-4"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 'var(--space-xl)',
            marginBottom: 'var(--space-2xl)',
          }}
        >
          <div>
            <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem', fontFamily: 'var(--font-display)' }}>Soft Reset School</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              A restart you get to take as many times as you need.
            </p>
          </div>

          <div>
            <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '0.875rem' }}>Product</h4>
            <ul>
              <li><Link to="/pricing" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Pricing</Link></li>
              <li><Link to="/scholarships" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Scholarships</Link></li>
              <li><Link to="/outcomes" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Outcomes</Link></li>
              <li><Link to="/for-teams" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>For Teams</Link></li>
              <li><Link to="/sponsors" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Sponsors</Link></li>
              <li><Link to="/share-story" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Share Your Story</Link></li>
              <li><Link to="/dashboard" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '0.875rem' }}>Learn</h4>
            <ul>
              <li><Link to="/blog" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Blog</Link></li>
              <li><Link to="/blog/what-is-ai-literacy" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>What is AI Literacy?</Link></li>
              <li><Link to="/blog/build-your-first-ai-app" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Build Your First AI App</Link></li>
              <li><Link to="/blog/coding-with-chronic-illness" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Coding with Chronic Illness</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '0.875rem' }}>Company</h4>
            <ul>
              <li><Link to="/about" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>About</Link></li>
              <li><Link to="/returning-to-work" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Returning to work</Link></li>
              <li><Link to="/employers" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>For Employers</Link></li>
              <li><a href="https://spooniversity.org" target="_blank" rel="noopener" style={{ color: 'var(--text-secondary)', fontSize: 14, textDecoration: 'none' }}>Spooniversity (sister site) ↗</a></li>
              <li><Link to="/imprint" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Imprint</Link></li>
              <li><a href="mailto:hi@softreset.school" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '0.875rem' }}>Legal & Privacy</h4>
            <ul>
              <li><Link to="/privacy" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Privacy Policy</Link></li>
              <li><Link to="/terms" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Terms of Service</Link></li>
              <li><Link to="/cookies" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Cookie Policy</Link></li>
              <li><Link to="/dpa" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Data Processing</Link></li>
            </ul>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--bg-border)',
            paddingTop: 'var(--space-xl)',
            color: 'var(--text-tertiary)',
            fontSize: 12,
          }}
        >
          <p>&copy; 2026 Soft Reset School. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
