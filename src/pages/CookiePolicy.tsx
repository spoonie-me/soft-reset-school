import { useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { SEO } from '@/components/SEO';

export function CookiePolicy() {
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const handleSave = () => {
    localStorage.setItem('cookieConsent', JSON.stringify({
      essential: true,
      analytics,
      marketing,
      consentedAt: new Date().toISOString(),
    }));
    alert('Cookie preferences saved.');
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <SEO
        title="Cookie Policy — Soft Reset School"
        description="How Soft Reset School uses cookies and your consent options. Manage analytics and marketing cookie preferences. EU GDPR / ePrivacy compliant."
        canonical="/cookies"
      />
      <h1 style={{ marginBottom: 'var(--space-2xl)' }}>Cookie Policy</h1>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>What are cookies?</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Cookies are small data files stored on your device. We use them to remember your preferences and improve your experience.
        </p>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-xl)' }}>Our Cookies</h2>

        <h3 style={{ color: 'var(--success)', marginBottom: 'var(--space-sm)' }}>Essential (Always On)</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>These keep you logged in and secure:</p>
        <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-xl)', listStyle: 'disc', marginBottom: 'var(--space-xl)' }}>
          <li><code>auth_token</code> — Your login session</li>
          <li><code>_csrf</code> — Security token</li>
          <li><code>preferences</code> — Dark mode, language, etc.</li>
        </ul>

        <h3 style={{ color: 'var(--signal)', marginBottom: 'var(--space-sm)' }}>Analytics (Opt-In)</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>Help us understand how people use Bedcoders (via PostHog, privacy-first):</p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', cursor: 'pointer' }}>
          <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--signal)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Allow analytics cookies</span>
        </label>

        <h3 style={{ color: 'var(--rust)', marginBottom: 'var(--space-sm)' }}>Marketing (Opt-In)</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>Personalized content and updates (currently not used):</p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', cursor: 'pointer' }}>
          <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--signal)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Allow marketing cookies</span>
        </label>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>Your Choices</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
          You can manage cookies through your browser settings, or use our preferences panel above.
        </p>
        <Button variant="primary" onClick={handleSave}>Save Preferences</Button>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>Questions?</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Email: <strong>hi@softreset.school</strong></p>
      </Card>
    </div>
  );
}
