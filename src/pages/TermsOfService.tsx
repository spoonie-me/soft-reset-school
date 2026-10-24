import { Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { SEO } from '@/components/SEO';

export function TermsOfService() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <SEO
        title="Terms of Service — Soft Reset School"
        description="Terms of service for Soft Reset School. EU consumer rights, 14-day right of withdrawal, one-time Credential purchase terms, intellectual property, and dispute resolution."
        canonical="/terms"
      />
      <h1 style={{ marginBottom: 'var(--space-sm)' }}>Terms of Service</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2xl)' }}>Last updated: March 2026</p>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>1. Parties & Acceptance</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          These Terms of Service ("Terms") constitute a legally binding agreement between you ("User") and Roi Shternin-Martini, MA, B.Ed., a sole trader registered in Vienna, Austria (GISA 38626050), operating Soft Reset School ("Operator", "we", "us").
        </p>
        <p style={{ color: 'var(--text-secondary)' }}>
          By accessing or purchasing on softreset.school, you confirm you have read, understood, and agree to these Terms. If you do not agree, do not use this service.
        </p>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>2. Right of Withdrawal (Widerrufsrecht)</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          Pursuant to EU Directive 2011/83/EU and §11 KSchG, consumers have a 14-day right of withdrawal from digital content purchases without stating reasons.
        </p>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          <strong>Waiver of withdrawal right:</strong> Where you explicitly request immediate access to digital content before the 14-day period expires and acknowledge that you thereby lose your right of withdrawal, the right of withdrawal is forfeited upon commencement of access. This waiver is requested and confirmed at the point of purchase.
        </p>
        <p style={{ color: 'var(--text-secondary)' }}>
          If you have not waived your right of withdrawal, submit a withdrawal request to hi@softreset.school within 14 days of purchase. A full refund will be processed within 14 days of receipt.
        </p>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>3. User Responsibilities</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>You agree to:</p>
        <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-xl)', listStyle: 'disc', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <li>Provide accurate account information</li>
          <li>Maintain the confidentiality of your password</li>
          <li>Not engage in harassment, abuse, or illegal activity</li>
          <li>Not reverse-engineer or scrape our platform</li>
          <li>Not use bots or automated tools without permission</li>
          <li>Respect intellectual property rights</li>
          <li>Not share account credentials or course access with third parties</li>
        </ul>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>4. Intellectual Property</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          All course content, exercises, assessments, software, design, and materials on softreset.school are owned exclusively by or licensed to the Operator and are protected by Austrian copyright law (UrhG), EU intellectual property law, and applicable international treaties.
        </p>
        <p style={{ color: 'var(--text-secondary)' }}>
          You are granted a non-exclusive, non-transferable, revocable licence to access and use Soft Reset School content for personal, non-commercial educational purposes only. You may not reproduce, redistribute, sell, sublicense, publish, broadcast, or create derivative works from any course content without prior written consent.
        </p>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>5. Payment & Pricing</h2>
        <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-xl)', listStyle: 'disc', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <li><strong>Pricing:</strong> All prices are inclusive of applicable VAT. Prices may change for future purchases; a change never affects a Credential you've already paid for.</li>
          <li><strong>No subscription:</strong> The first lesson of every track is a free trial. Access to the rest of a track is a one-time payment, called a Credential, which also covers a certification exam and a permanent, publicly verifiable certificate for that track (or a bundle of tracks). Accounts created before 24 October 2026 keep free access to all lesson content. There is nothing to cancel: a Credential purchase does not renew and is not billed again.</li>
          <li><strong>Payment processing:</strong> Handled by Stripe, Inc. By completing a purchase you also accept Stripe's terms of service.</li>
          <li><strong>Currency:</strong> Prices are listed in Euro (€). International purchases may incur bank conversion fees outside our control.</li>
        </ul>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>6. Limitation of Liability</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          To the maximum extent permitted by applicable Austrian and EU law:
        </p>
        <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-xl)', listStyle: 'disc', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
          <li>The Operator's total aggregate liability for any claim arising out of or in connection with these Terms is limited to the amount actually paid by the User for the relevant purchase.</li>
          <li>The Operator is not liable for indirect, incidental, consequential, or special damages, loss of profit, loss of data, or business interruption.</li>
          <li>The Operator is not liable for service interruptions, downtime, or temporary unavailability of the platform.</li>
        </ul>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          <strong>Mandatory exceptions (§9a KSchG):</strong> Nothing in these Terms limits or excludes liability for: (a) personal injury or death caused by negligence; (b) damage caused by gross negligence or wilful misconduct; (c) any liability that cannot be excluded under mandatory Austrian or EU consumer protection law.
        </p>
        <p style={{ color: 'var(--text-secondary)' }}>
          The platform is provided "as-is" for educational purposes. No warranty is given regarding the completeness, accuracy, or fitness for a particular professional purpose of the content.
        </p>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>7. Educational Content Disclaimer</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          <strong>Important:</strong> The Operator is a licensed business consultant (Unternehmensberatung, GISA 38626050) specialising in education and consulting. Soft Reset School teaches AI-assisted software development, AI automation consulting, AI-augmented medical coding and digital accessibility QA for career development purposes only.
        </p>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          <strong>Content is strictly educational and does not constitute:</strong> medical advice, clinical guidance, diagnosis, treatment recommendations, legal advice, regulatory advice, or professional medical practice of any kind.
        </p>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          <strong>What a certificate confirms.</strong> A track certificate verifies two specific facts: the
          named person completed the published lessons for that track, and they passed its certification exam
          at the required score, on the date shown. That is what "publicly verifiable" means — a third party
          can check those two facts. A certificate is evidence of practiced skill; it is not a regulated
          professional qualification, not a medical licence, and not a credential recognised by any healthcare
          or other regulatory body. It is not a guarantee of employment. Each track's page states how many
          lessons and how much estimated learning time sit behind its certificate before you pay anything.
        </p>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          Users are solely responsible for verifying all information with appropriate clinical, legal, and regulatory authorities in their jurisdiction before applying any content in professional or clinical settings. The Operator assumes no liability for clinical, professional, or business decisions made based on course content, pursuant to §6, §9a KSchG.
        </p>
        <p style={{ color: 'var(--text-secondary)' }}>
          <strong>Continuity.</strong> The Operator is a sole trader with no separate legal entity — see the{' '}
          <Link to="/imprint" style={{ color: 'var(--signal)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Impressum's Continuity section</Link>{' '}
          for what that means for certificate verification if the Operator is ever unable to continue
          operating the platform, and what's committed to in that case.
        </p>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>8. AI-Powered Features</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          Soft Reset School uses third-party AI tools (including Anthropic's Claude) to provide automated exercise feedback. By using these features, you acknowledge:
        </p>
        <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-xl)', listStyle: 'disc', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <li>AI-generated feedback is automated and may not be reviewed by a human before delivery.</li>
          <li>AI feedback is indicative only and does not constitute expert or professional advice.</li>
          <li>Exercise responses may be processed by third-party AI providers subject to their own data processing terms. No personally identifying clinical data should be submitted in exercises.</li>
          <li>There is no human review of exercise feedback; it is fully automated. If you believe feedback contains an error, contact hi@softreset.school.</li>
        </ul>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>9. Termination</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          The Operator may suspend or terminate accounts that materially violate these Terms, with notice where practicable. You may close your account at any time. Upon closure, your personal data will be deleted within 30 days except where retention is required by law (e.g. tax records under §132 BAO). Access to paid content ceases upon termination; no pro-rata refund is due where termination results from breach of these Terms by the User.
        </p>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>10. Changes to Terms</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          The Operator reserves the right to amend these Terms. Material changes will be communicated by email to registered users at least 30 days before taking effect. Continued use of the platform after the effective date constitutes acceptance of the revised Terms. If you do not accept the revised Terms, you may close your account before the effective date.
        </p>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>11. Force Majeure</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          The Operator is not liable for delays or failures in performance resulting from causes beyond reasonable control, including but not limited to: acts of God, infrastructure outages, internet failures, cyberattacks, changes in law, or actions of third-party service providers (including hosting, payment, or AI providers).
        </p>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>12. Governing Law & Jurisdiction</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          These Terms are governed by Austrian law. The application of the UN Convention on Contracts for the International Sale of Goods (CISG) is excluded. For consumer users, the mandatory consumer protection provisions of the consumer's country of habitual residence apply in addition to Austrian law. Disputes shall be subject to the exclusive jurisdiction of the competent courts in Vienna, Austria, without prejudice to consumers' rights to bring proceedings in their country of residence.
        </p>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>13. Severability</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          If any provision of these Terms is found to be invalid, unlawful, or unenforceable by a court of competent jurisdiction, that provision shall be modified to the minimum extent necessary to make it enforceable, or severed if modification is not possible. The remaining provisions shall continue in full force and effect. The invalidity of one clause does not affect the validity of the remaining Terms.
        </p>
      </Card>
    </div>
  );
}
