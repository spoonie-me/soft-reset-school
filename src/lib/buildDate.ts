// The date of the build, set by vite.config.ts. Empty in tests and in any
// environment that does not define it, and callers then leave the line out.
declare const __BUILD_DATE__: string | undefined;

export function buildDate(): string {
  return typeof __BUILD_DATE__ === 'string' ? __BUILD_DATE__ : '';
}
