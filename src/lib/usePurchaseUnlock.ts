import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export type UnlockStatus = 'idle' | 'waiting' | 'unlocked' | 'slow';

const POLL_MS = 2000;
const GIVE_UP_AFTER_MS = 60000;

/** After Stripe sends someone back, the webhook that grants the track can land a
 * few seconds later. This waits for it, so the buyer sees "unlocking" rather
 * than a locked lesson and no explanation. Pass the track ids from the return URL. */
export function usePurchaseUnlock(trackIds: string[]): UnlockStatus {
  const key = trackIds.join(',');
  const [status, setStatus] = useState<UnlockStatus>(trackIds.length > 0 ? 'waiting' : 'idle');

  useEffect(() => {
    if (!key) return;
    const wanted = key.split(',');
    let cancelled = false;
    const started = Date.now();

    const check = async () => {
      try {
        const res = await api.get<{ credentials: Array<{ trackId: string }> }>('/checkout/credentials');
        const owned = new Set(res.credentials.map((c) => c.trackId));
        if (cancelled) return true;
        if (wanted.every((t) => owned.has(t))) {
          setStatus('unlocked');
          return true;
        }
      } catch {
        /* keep trying until the time runs out */
      }
      return false;
    };

    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (await check()) return;
      if (cancelled) return;
      if (Date.now() - started >= GIVE_UP_AFTER_MS) {
        setStatus('slow');
        return;
      }
      timer = setTimeout(tick, POLL_MS);
    };
    tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key]);

  return status;
}
