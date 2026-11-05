/* The real route table: /courses* goes to /tracks with the flag off, and
 * to the course pages with it on. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(async () => ({})), post: vi.fn() } }));
vi.mock('@/lib/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ user: null, loading: false, logout: vi.fn() }),
}));
vi.mock('@/components/Header', () => ({ Header: () => null }));
vi.mock('@/components/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/CookieConsent', () => ({ CookieConsent: () => null }));

import { App } from '@/App';
import { COURSE_CATALOG } from '@/data/courseCatalog';

HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
window.scrollTo = (() => {}) as typeof window.scrollTo;

afterEach(() => vi.unstubAllEnvs());

function at(path: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('routes', () => {
  it('flag off: /courses lands on the tracks catalogue', async () => {
    at('/courses');
    expect(await screen.findByRole('heading', { level: 1, name: /see what's inside every track/i })).toBeInTheDocument();
  });

  it('flag off: /courses/<slug> lands on the tracks catalogue', async () => {
    at(`/courses/${COURSE_CATALOG[0].slug}`);
    expect(await screen.findByRole('heading', { level: 1, name: /see what's inside every track/i })).toBeInTheDocument();
  });

  it('flag on: /courses shows the course catalogue', async () => {
    vi.stubEnv('VITE_COURSES_ENABLED', 'true');
    at('/courses');
    expect(await screen.findByRole('heading', { level: 1, name: 'Courses' })).toBeInTheDocument();
  });

  it('flag on: /courses/<slug> shows the course', async () => {
    vi.stubEnv('VITE_COURSES_ENABLED', 'true');
    at(`/courses/${COURSE_CATALOG[0].slug}`);
    expect(await screen.findByRole('heading', { level: 1, name: COURSE_CATALOG[0].title })).toBeInTheDocument();
  });
});
