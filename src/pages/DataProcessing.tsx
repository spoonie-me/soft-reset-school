import { Card } from '@/components/Card';
import { SEO } from '@/components/SEO';

export function DataProcessing() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <SEO
        title="Data Processing Agreement — Soft Reset School"
        description="GDPR-compliant Data Processing Agreement (DPA) for Soft Reset School team customers. Sub-processor list, security measures, and EU/EEA data residency."
        canonical="/dpa"
      />
      <h1 style={{ marginBottom: 'var(--space-sm)' }}>Data Processing Agreement</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>Last updated: March 2026</p>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>1. Scope</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          This Data Processing Agreement (DPA) applies to the processing of personal data by Soft Reset School, operated by Roi Shternin-Martini ("Processor") on behalf of institutional customers ("Controller") under the General Data Protection Regulation (GDPR).
        </p>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>2. Nature of Processing</h2>
        <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-xl)', listStyle: 'disc', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <li><strong>Purpose:</strong> Providing coding education services</li>
          <li><strong>Duration:</strong> Duration of the service agreement</li>
          <li><strong>Types of data:</strong> Account data, learning progress, exercise submissions</li>
          <li><strong>Data subjects:</strong> Employees or members of the Controller organization</li>
        </ul>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>3. Sub-processors</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>We use the following sub-processors:</p>
        <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-xl)', listStyle: 'disc', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <li><strong>Stripe Inc.</strong> — Payment processing (EU)</li>
          <li><strong>Resend Inc.</strong> — Email delivery (EU)</li>
          <li><strong>PostHog Inc.</strong> — Analytics (EU cloud)</li>
          <li><strong>Vercel Inc.</strong> — Hosting (US, SOC 2, SCCs in place)</li>
          <li><strong>Neon Inc.</strong> — Database hosting (US, SOC 2, SCCs in place)</li>
          <li><strong>Anthropic PBC</strong> — AI feedback (US, SCCs in place)</li>
        </ul>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>4. Security Measures</h2>
        <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-xl)', listStyle: 'disc', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <li>Encryption in transit (TLS 1.3)</li>
          <li>Encryption at rest (database)</li>
          <li>Access control and authentication</li>
          <li>Regular security audits</li>
          <li>Audit logging with 3-year retention</li>
          <li>Breach notification within 72 hours</li>
        </ul>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>5. Contact</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          For DPA inquiries or to request a signed copy: <strong>hi@softreset.school</strong>
        </p>
      </Card>
    </div>
  );
}
