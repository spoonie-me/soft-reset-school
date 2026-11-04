import { Card } from '@/components/Card';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';

export function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <SEO
        title="Privacy Policy — Soft Reset School"
        description="How Soft Reset School collects, uses, and protects your personal data. GDPR-compliant. Operator: Roi Shternin-Martini, Vienna, Austria."
        canonical="/privacy"
      />
      <h1 style={{ marginBottom: 'var(--space-sm)' }}>Privacy Policy</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>
        Last updated: March 2026 | Compliant with GDPR & Austrian DPA
      </p>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>1. Data Controller</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          <strong>Roi Shternin-Martini</strong><br />
          1180 Vienna, Austria<br />
          Email: hi@softreset.school
        </p>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>2. Data We Collect</h2>
        <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-xl)', listStyle: 'disc', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <li><strong>Account data:</strong> Email, name, password (hashed)</li>
          <li><strong>Learning data:</strong> Lesson progress, exercise submissions, scores</li>
          <li><strong>Technical data:</strong> IP address, user agent, device type</li>
          <li><strong>Usage data:</strong> Pages visited, time spent, interactions (via PostHog)</li>
          <li><strong>Payment data:</strong> Processed by Stripe (we never store card details)</li>
          <li><strong>Consent data:</strong> GDPR, privacy, marketing, analytics (with timestamps)</li>
        </ul>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>3. Legal Basis for Processing</h2>
        <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <p><strong>Contract (GDPR Article 6(1)(b)):</strong> Account creation, purchase processing</p>
          <p><strong>Legitimate Interest (6(1)(f)):</strong> Analytics, fraud prevention</p>
          <p><strong>Consent (6(1)(a)):</strong> Marketing, analytics (opt-in)</p>
          <p><strong>Legal obligation (6(1)(c)):</strong> Tax records, compliance</p>
        </div>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>4. How Long We Keep Data</h2>
        <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-xl)', listStyle: 'disc', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <li><strong>Account data:</strong> Until account deletion + 7 years (tax requirement)</li>
          <li><strong>Learning data:</strong> Until account deletion</li>
          <li><strong>Audit logs:</strong> 3 years (compliance)</li>
          <li><strong>Opt-in analytics:</strong> 13 months (PostHog default)</li>
        </ul>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>5. Your Rights (GDPR)</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>You have the right to:</p>
        <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-xl)', listStyle: 'disc', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <li><strong>Access (Article 15):</strong> Request a copy of your data</li>
          <li><strong>Rectification (16):</strong> Correct inaccurate data</li>
          <li><strong>Erasure (17):</strong> Delete your account & associated data</li>
          <li><strong>Restrict processing (18):</strong> Limit how we use your data</li>
          <li><strong>Data portability (20):</strong> Export your data in machine-readable format</li>
          <li><strong>Object (21):</strong> Opt out of marketing/analytics</li>
          <li><strong>Withdraw consent:</strong> Anytime, for any reason, no penalty</li>
        </ul>
        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-lg)' }}>
          To exercise any right: <strong>hi@softreset.school</strong> with proof of identity.
        </p>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>6. Data Processors (Third Parties)</h2>
        <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-xl)', listStyle: 'disc', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <li><strong>Stripe (payments):</strong> EU-based</li>
          <li><strong>Resend (email):</strong> EU-based</li>
          <li><strong>PostHog (analytics):</strong> EU cloud, privacy-first, EU data residency</li>
          <li><strong>Render (hosting):</strong> US-based, SOC 2 compliant</li>
          <li><strong>Anthropic (Claude API):</strong> US-based, data not used for training without consent</li>
        </ul>
        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-lg)' }}>
          All processors have Data Processing Agreements (DPAs) in place.
        </p>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>7. Cookies & Tracking</h2>
        <div style={{ color: 'var(--text-secondary)' }}>
          <p><strong>Essential:</strong> Authentication, session (always on)</p>
          <p><strong>Analytics (opt-in):</strong> PostHog (only if user consents)</p>
          <p><strong>Marketing (opt-in):</strong> None used currently</p>
          <p style={{ marginTop: 'var(--space-md)' }}>
            See our <Link to="/cookies" style={{ color: 'var(--signal)' }}>Cookie Policy</Link> for details.
          </p>
        </div>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>Questions?</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Email: <strong>hi@softreset.school</strong><br />
          For complaints: Contact your national Data Protection Authority
        </p>
      </Card>
    </div>
  );
}
