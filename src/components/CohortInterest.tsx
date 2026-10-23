import { useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { api } from '@/lib/api';

/** Interest list for the upcoming hybrid cohorts / accountability learning
 * groups. Posts to the existing subscribe endpoint; nothing is sent until a
 * cohort actually opens. */
export function CohortInterest() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await api.post('/subscribe', { email: email.trim(), sequence: 'learning_groups_interest', source: 'learning_groups' });
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again, or email hi@softreset.school.');
    }
    setBusy(false);
  }

  return (
    <Card id="learning-groups" style={{ textAlign: 'center', borderColor: 'var(--signal)' }}>
      <h3 style={{ marginBottom: 'var(--space-sm)' }}>Hybrid cohorts are starting soon</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', maxWidth: 520, margin: '0 auto var(--space-lg)' }}>
        Small accountability learning groups that pair the free self-paced lessons with a regular, low-pressure
        check-in — paced to your energy, not a deadline. Leave your email and we'll tell you when the first
        groups open. One email when they do; nothing else.
      </p>
      {done ? (
        <p role="status" style={{ color: 'var(--crystal)' }}>Thanks — you're on the list.</p>
      ) : (
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <label htmlFor="cohort-email" style={{ position: 'absolute', left: -9999 }}>Email address</label>
          <input
            id="cohort-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            style={{ flex: '1 1 240px', maxWidth: 320, minHeight: 48, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-sm) var(--space-md)', color: 'var(--text-primary)', fontSize: '0.9375rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <Button variant="primary" type="submit" disabled={busy}>{busy ? 'Adding…' : 'Keep me posted'}</Button>
        </form>
      )}
      {error && <p role="alert" style={{ color: 'var(--rust)', fontSize: '0.875rem', marginTop: 'var(--space-md)' }}>{error}</p>}
    </Card>
  );
}
