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
