// Credential prices (EUR, VAT-inclusive). Backend source of truth:
// backend/src/lib/stripe.ts (CREDENTIAL_PRODUCTS, PROGRAM_PRICES_IN_CENTS).
// Keep the two in sync.

export const TRACK_PRICE = 99;

/** Bundle price by number of tracks. */
export const BUNDLE_PRICES: Record<number, number> = {
  2: 149,
  3: 199,
};

export const MAX_BUNDLE_SIZE = 3;

/** What you save versus buying the same number of tracks one at a time. */
export function bundleSavings(count: number): number {
  return TRACK_PRICE * count - (BUNDLE_PRICES[count] ?? TRACK_PRICE * count);
}

// Course prices (EUR, VAT-inclusive). Used only while VITE_COURSES_ENABLED is
// "true". Backend source of truth: backend/src/lib/stripe.ts (COURSE_PRICE_CENTS,
// COURSE_BUNDLE_3_PRICE_CENTS, COURSE_TRACK_PRICE_CENTS). The flag-off prices
// above (TRACK_PRICE 99, bundles 149 and 199) are unchanged.
export const COURSE_PRICE = 29;
export const COURSE_BUNDLE_3_PRICE = 69;
export const COURSE_TRACK_PRICE = 99;
/** A "pick 3" cart is exactly this many courses. */
export const COURSE_BUNDLE_SIZE = 3;

/** What you save by buying 3 courses as a bundle instead of one at a time. */
export const COURSE_BUNDLE_SAVINGS = COURSE_PRICE * COURSE_BUNDLE_SIZE - COURSE_BUNDLE_3_PRICE;
