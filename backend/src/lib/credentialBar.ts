// Backend copy of the minimum-depth bar for selling a Credential.
// Mirrors src/data/credentialBar.ts (frontend) and the published lesson
// counts declared in src/data/trackCatalog.ts (lessonCount/totalMinutes per
// track), which are themselves checked against the actual seed data by
// `npm run curriculum:audit`.
//
// All of the above are checked against each other by
// src/data/__tests__/credentialBar.test.ts — if the frontend catalog and
// this table disagree, the test suite fails. That's the point: the price a
// learner sees, the content that actually exists, and the gate that decides
// whether checkout is allowed can never quietly drift apart.
//
// Kept as a plain table rather than read from the seed JSON at runtime so
// the serverless function never touches the filesystem to decide whether
// something is sellable — seed JSON isn't guaranteed to ship in the
// deployed function bundle (see vercel.json's `includeFiles`).
//
// Last synced against src/data/trackCatalog.ts: 2026-08-12.

export const CREDENTIAL_MINIMUMS = {
  lessons: 8,
  minutes: 150,
} as const;

export interface TrackDepth {
  lessonCount: number;
  totalMinutes: number;
}

/** Published content per track — must match src/data/trackCatalog.ts. */
export const TRACK_DEPTH: Record<string, TrackDepth> = {
  // Career tracks
  'ai-orchestrated-dev': { lessonCount: 244, totalMinutes: 6135 },
  'ai-workflow-consulting': { lessonCount: 246, totalMinutes: 6150 },
  'ai-oversight-health-informatics': { lessonCount: 246, totalMinutes: 6135 },
  'accessibility-qa-lived-experience': { lessonCount: 243, totalMinutes: 6065 },
  // Foundation tracks
  fundamentals: { lessonCount: 263, totalMinutes: 6345 },
  ai: { lessonCount: 248, totalMinutes: 6120 },
  tools: { lessonCount: 255, totalMinutes: 6225 },
  advanced: { lessonCount: 265, totalMinutes: 6375 },
};

export function meetsCredentialBar(trackId: string): boolean {
  const depth = TRACK_DEPTH[trackId];
  // Unknown track → not sellable. Fail closed, always.
  if (!depth) return false;
  return (
    depth.lessonCount >= CREDENTIAL_MINIMUMS.lessons &&
    depth.totalMinutes >= CREDENTIAL_MINIMUMS.minutes
  );
}
