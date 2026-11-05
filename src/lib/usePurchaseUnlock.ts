import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export type UnlockStatus = 'idle' | 'waiting' | 'unlocked' | 'slow';

const POLL_MS = 2000;
const GIVE_UP_AFTER_MS = 60000;

interface CredentialRow {
  trackId: string;
  productType?: string;
  /** '' for a track row, the course's domain id for a course row. Absent on an older backend. */
  domainId?: string;
}

/** A course row is not the track. Only rows that are not a course count as owning the whole track. */
function isTrackRow(c: CredentialRow): boolean {
  return c.productType !== 'course' && !c.domainId;
}

/** After Stripe sends someone back, the webhook that grants the purchase can land a
 * few seconds later. This waits for it, so the buyer sees "unlocking" rather
 * than a locked lesson and no explanation. Pass the track ids from the return URL,
 * and for a course purchase the course (domain) ids from `courses=`. */
export function usePurchaseUnlock(trackIds: string[], courseIds: string[] = []): UnlockStatus {
  const key = JSON.stringify([trackIds, courseIds]);
  const [status, setStatus] = useState<UnlockStatus>(trackIds.length + courseIds.length > 0 ? 'waiting' : 'idle');

  useEffect(() => {
    const [wantedTracks, wantedCourses] = JSON.parse(key) as [string[], string[]];
    if (wantedTracks.length + wantedCourses.length === 0) return;
    let cancelled = false;
    const started = Date.now();

    const check = async () => {
      try {
        const res = await api.get<{ credentials: CredentialRow[] }>('/checkout/credentials');
        const ownedTracks = new Set(res.credentials.filter(isTrackRow).map((c) => c.trackId));
        const ownedCourses = new Set(
          res.credentials.filter((c) => c.productType === 'course' && c.domainId).map((c) => c.domainId),
        );
        if (cancelled) return true;
        if (wantedTracks.every((t) => ownedTracks.has(t)) && wantedCourses.every((d) => ownedCourses.has(d))) {
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
