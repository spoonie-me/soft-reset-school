// Backend feature flags. Read at call time so tests can change the env.

/** Courses (a domain bought on its own) are on only when COURSES_ENABLED is exactly "true". */
export function coursesEnabled(): boolean {
  return process.env.COURSES_ENABLED === 'true';
}
