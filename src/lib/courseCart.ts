// A logged-out buyer's picked courses survive the trip to /login and back.
// sessionStorage only: it is a convenience and the page works without it.

const KEY = 'srs.courseCartKeys';

export function saveCourseCart(keys: string[]): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(keys));
  } catch {
    /* storage blocked: the buyer picks again */
  }
}

/** Reads the saved keys without clearing them (safe under StrictMode double init). */
export function peekCourseCart(): string[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : [];
  } catch {
    return [];
  }
}

export function clearCourseCart(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
