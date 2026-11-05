// Front end feature flags. Read at call time so tests can change the env.

/** Courses (a domain bought on its own) are on only when VITE_COURSES_ENABLED is exactly "true".
 * Off: the site is what origin/main renders. The backend has its own COURSES_ENABLED. */
export function coursesEnabled(): boolean {
  return import.meta.env.VITE_COURSES_ENABLED === 'true';
}
