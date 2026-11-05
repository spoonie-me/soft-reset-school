import { useState } from 'react';
import { Button } from '@/components/Button';
import { ModalDialog } from '@/components/ModalDialog';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { saveCourseCart } from '@/lib/courseCart';

interface CourseCheckoutDialogProps {
  /** Course keys the backend accepts as courseIds (the catalog's domainKey). */
  courseKeys: string[];
  /** One plain line saying what is being bought and for how much. */
  summary: string;
  onClose: () => void;
}

/** The step before Stripe for a course purchase. Same consent and the same
 * request pattern as the track purchase on the pricing page. */
export function CourseCheckoutDialog({ courseKeys, summary, onClose }: CourseCheckoutDialogProps) {
  const [ack, setAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function confirm() {
    if (!ack || loading) return;
    if (!user) {
      // Not signed in: keep the picks, send them to log in, and come back here.
      saveCourseCart(courseKeys);
      navigate('/login', { state: { from: location } });
      return;
    }
    setLoading(true);
    setError('');
    try {
      (window as any).trackEvent?.('checkout_start', { productId: 'course', courses: courseKeys.length });
      const { url } = await api.post<{ url: string }>('/checkout/session', { courseIds: courseKeys });
      if (url) window.location.href = url;
      onClose();
    } catch (err: unknown) {
      const e = err as { status?: number; body?: { error?: string; url?: string }; message?: string };
      // 409 with a url: a Stripe session for this cart is already open. Go to it.
      if (e?.status === 409 && typeof e.body?.url === 'string' && e.body.url) {
        window.location.href = e.body.url;
        return;
      }
      setError(e?.body?.error ?? e?.message ?? 'Failed to start checkout. Please try again.');
      setLoading(false);
    }
  }

  return (
    <ModalDialog label="Before you continue" maxWidth={480} onClose={onClose}>
      <h3 style={{ marginBottom: 'var(--space-md)', textAlign: 'center' }}>Before you continue</h3>
      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 'var(--space-lg)' }}>{summary}</p>
      <label
        style={{
          display: 'flex', gap: 'var(--space-sm)', alignItems: 'flex-start', cursor: 'pointer',
          marginBottom: 'var(--space-xl)', padding: 'var(--space-md)', background: 'var(--bg-void)',
          border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)',
        }}
      >
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
          style={{ marginTop: 2, width: 18, height: 18, accentColor: 'var(--signal)', flexShrink: 0 }}
        />
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          I understand that by purchasing this I consent to immediate access to digital content, and
          that my <strong style={{ color: 'var(--text-primary)' }}>14-day withdrawal right</strong> expires upon
          first access (EU Consumer Rights Directive 2011/83/EU, §11 KSchG).
          I have read the <a href="/terms#withdrawal" style={{ color: 'var(--signal)' }} target="_blank" rel="noopener noreferrer">Terms of Service</a>.
        </span>
      </label>
      {error && (
        <p role="alert" style={{ color: 'var(--rust)', fontSize: '0.875rem', marginBottom: 'var(--space-md)', textAlign: 'center' }}>
          {error}
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={confirm} disabled={!ack || loading}>
          {loading ? 'Starting…' : 'Continue to checkout →'}
        </Button>
      </div>
    </ModalDialog>
  );
}
