import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/ProtectedRoute';
import { learningApi, type CertificateResponse } from '@/lib/api';
import { IS_DEV_MODE } from '@/lib/useApi';
import { useAuth } from '@/lib/AuthContext';

/* ─── Track names ─── */
const TRACK_NAMES: Record<string, string> = {
  fundamentals: '🛏️ Code from Bed',
  ai: '🤖 AI Literacy for Humans',
  tools: '⚡ Build Cool Tools Fast',
  advanced: '🚀 AI Agents that Work',
};

interface CertificateView {
  trackName: string;
  recipientName: string;
  issueDate: string;
  verificationCode: string;
  pdfUrl: string | null;
}

export function Certificate() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [cert, setCert] = useState<CertificateView | null>(() =>
    IS_DEV_MODE ? {
      trackName: '🛏️ Code from Bed',
      recipientName: user?.name ?? 'Dev User',
      issueDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      verificationCode: 'BC-2024-A7X3',
      pdfUrl: null,
    } : null
  );
  const [loading, setLoading] = useState(!IS_DEV_MODE);
  const [copied, setCopied] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  useEffect(() => {
    if (IS_DEV_MODE) return;

    async function load() {
      try {
        const res: CertificateResponse = await learningApi.getCertificate(id ?? '');
        const c = res.certificate;
        setCert({
          trackName: TRACK_NAMES[c.trackId] ?? c.trackId,
          recipientName: c.holder.name,
          issueDate: new Date(c.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          verificationCode: c.verifyCode,
          pdfUrl: c.pdfUrl,
        });
      } catch {
        setCert({
          trackName: '🛏️ Code from Bed',
          recipientName: user?.name ?? 'Certificate Holder',
          issueDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          verificationCode: 'BC-DEMO-0000',
          pdfUrl: null,
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, user?.name]);

  if (loading || !cert) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4xl)' }}><LoadingSpinner /></div>;
  }

  const verificationUrl = `${window.location.origin}/verify/${cert.verificationCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(verificationUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadPdf = async () => {
    if (!cert?.pdfUrl || pdfDownloading) return;
    setPdfDownloading(true);
    try {
      const token = localStorage.getItem('bc_token');
      const res = await fetch(cert.pdfUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'soft-reset-school-certificate.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silently fall through — the user will see no response, but no error thrown
    } finally {
      setPdfDownloading(false);
    }
  };

  return (
    <>
      <style>{`
        @media print {
          header, footer, nav, .no-print, .skip-link, #cookie-consent { display: none !important; }
          body { background: white !important; color: black !important; }
          .certificate-outer { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
          .certificate-card { box-shadow: none !important; border: 3px solid #c9a84c !important; background: white !important; break-inside: avoid; }
          .certificate-card * { color: #1a1a1a !important; }
          .certificate-card .cert-accent { color: #c9a84c !important; }
          .certificate-card .cert-code { background: #f5f5f5 !important; border-color: #ddd !important; }
        }
      `}</style>

      <div className="certificate-outer" style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
        <div className="no-print" style={{ marginBottom: 'var(--space-2xl)' }}>
          <Link to="/dashboard" style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', textDecoration: 'none' }}>&larr; Back to Dashboard</Link>
        </div>

        <div className="certificate-card" style={{ background: 'var(--bg-surface)', border: '3px solid var(--gold)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4xl) var(--space-3xl)', textAlign: 'center' as const, position: 'relative' as const, overflow: 'hidden' }}>
          <div style={{ position: 'absolute' as const, inset: 8, border: '1px solid var(--gold)', borderRadius: 'var(--radius-md)', opacity: 0.3, pointerEvents: 'none' as const }} />
          <div style={{ width: 60, height: 4, background: 'var(--gold)', borderRadius: 2, margin: '0 auto var(--space-xl)' }} />

          <p className="cert-accent" style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: 'var(--gold)', marginBottom: 'var(--space-2xl)' }}>Soft Reset School</p>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)' }}>Certificate of Completion</h2>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: 'var(--space-2xl)', lineHeight: 1.3 }}>{cert.trackName}</h1>

          <div style={{ width: 40, height: 1, background: 'var(--bg-border)', margin: '0 auto var(--space-2xl)' }} />

          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', fontFamily: 'var(--font-display)', marginBottom: 'var(--space-sm)' }}>Awarded to</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 500, fontFamily: 'var(--font-display)', marginBottom: 'var(--space-2xl)' }}>{cert.recipientName}</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-2xl)' }}>{cert.issueDate}</p>

          <div className="cert-code" style={{ display: 'inline-block', padding: 'var(--space-md) var(--space-xl)', background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)', letterSpacing: '0.05em', textTransform: 'uppercase' as const, marginBottom: 'var(--space-xs)' }}>Verification Code</p>
            <p className="cert-accent" style={{ fontFamily: 'var(--font-code)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.1em' }}>{cert.verificationCode}</p>
          </div>

          <div style={{ width: 60, height: 4, background: 'var(--gold)', borderRadius: 2, margin: 'var(--space-2xl) auto 0' }} />
        </div>

        <div className="no-print" style={{ marginTop: 'var(--space-2xl)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-lg)', justifyContent: 'center', flexWrap: 'wrap' as const, marginBottom: 'var(--space-2xl)' }}>
            {cert.pdfUrl && (
              <Button variant="primary" onClick={handleDownloadPdf} disabled={pdfDownloading}>
                {pdfDownloading ? 'Downloading…' : 'Download PDF'}
              </Button>
            )}
            <Button variant={cert.pdfUrl ? 'secondary' : 'primary'} onClick={() => window.print()}>Print Certificate</Button>
            <Button variant="ghost" onClick={handleCopy}>{copied ? 'Copied!' : 'Copy Verification Link'}</Button>
          </div>

          <Card style={{ maxWidth: 500, margin: '0 auto' }}>
            <h3 style={{ fontSize: '0.9375rem', marginBottom: 'var(--space-lg)' }}>Share Your Achievement</h3>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
              <div style={{ flex: 1, padding: 'var(--space-md) var(--space-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-code)', fontSize: '0.8125rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {verificationUrl}
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopy} style={{ flexShrink: 0 }}>{copied ? 'Copied' : 'Copy'}</Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
