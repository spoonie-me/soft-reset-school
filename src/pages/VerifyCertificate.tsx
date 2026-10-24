import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { learningApi } from '@/lib/api';

const TRACK_NAMES: Record<string, string> = {
  fundamentals: '🛏️ Code from Bed',
  ai: '🤖 AI Literacy for Humans',
  tools: '⚡ Build Cool Tools Fast',
  advanced: '🚀 AI Agents that Work',
};

export function VerifyCertificate() {
  const { code } = useParams<{ code: string }>();
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'error'>(
    code ? 'loading' : 'invalid'
  );
  const [cert, setCert] = useState<{
    trackId: string;
    examScore: number;
    issuedAt: string;
    holderName: string;
  } | null>(null);

  useEffect(() => {
    if (!code) return;

    learningApi.verifyCertificate(code)
      .then((res) => {
        if (res.valid && res.certificate) {
          setCert(res.certificate);
          setStatus('valid');
        } else {
          setStatus('invalid');
        }
      })
      .catch(() => setStatus('error'));
  }, [code]);

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      <div style={{ maxWidth: '520px', width: '100%' }}>
        <p style={{ fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--signal)', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>
          Soft Reset School · Certificate Verification
        </p>

        {status === 'loading' && (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '15px' }}>Checking certificate…</p>
        )}

        {status === 'valid' && cert && (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '2px solid var(--gold)',
              borderRadius: '12px',
              padding: '32px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>✅</p>
            <p style={{ color: 'var(--signal)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Valid Certificate
            </p>
            <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px', lineHeight: 1.3 }}>
              {TRACK_NAMES[cert.trackId] ?? cert.trackId}
            </h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginBottom: '20px' }}>
              Certificate of Completion
            </p>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '16px 20px', textAlign: 'left', display: 'inline-block', minWidth: '260px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Awarded to</p>
              <p style={{ fontSize: '18px', fontWeight: 500, marginBottom: '12px' }}>{cert.holderName}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Issued</p>
              <p style={{ fontSize: '14px', marginBottom: '12px' }}>
                {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Score</p>
              <p style={{ fontSize: '14px', color: 'var(--gold)' }}>{cert.examScore}%</p>
            </div>
          </div>
        )}

        {status === 'invalid' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>❌</p>
            <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>Certificate not found</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '15px', lineHeight: 1.6 }}>
              No certificate matches this code. Double-check the link or code.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</p>
            <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px' }}>Could not verify</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '15px', lineHeight: 1.6 }}>
              There was a problem checking this certificate. Try again in a moment.
            </p>
          </div>
        )}

        <p style={{ marginTop: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--text-tertiary)' }}>
          <Link to="/" style={{ color: 'var(--signal)', textDecoration: 'none' }}>← Soft Reset School</Link>
        </p>
      </div>
    </div>
  );
}
