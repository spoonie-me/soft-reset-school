import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';

const get = vi.fn();
vi.mock('@/lib/api', () => ({
  api: { get: (...a: unknown[]) => get(...a), post: vi.fn() },
  learningApi: {
    getTracks: vi.fn(async () => ({ tracks: [] })),
    getGamification: vi.fn(async () => null),
    getTrack: vi.fn(),
  },
}));

import { Dashboard } from '../Dashboard';

function renderAt(search: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/dashboard${search}`]}>
        <Dashboard />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

const loaded = () => waitFor(() => expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument());
const gtag = vi.fn();
const purchase = () => gtag.mock.calls.find((c) => c[0] === 'event' && c[1] === 'purchase')?.[2];

beforeEach(() => {
  get.mockReset();
  gtag.mockReset();
  (window as unknown as { gtag: unknown }).gtag = gtag;
  localStorage.setItem('bc_path_selected', '1');
});
afterEach(() => {
  delete (window as unknown as { gtag?: unknown }).gtag;
  vi.unstubAllEnvs();
});

describe('Dashboard after checkout', () => {
  it('one course: unlocking state, polls for the domainId, GA4 value 29', async () => {
    get.mockImplementation(async (path: string) =>
      path === '/checkout/credentials'
        ? { credentials: [{ trackId: 't', productType: 'course', domainId: 'dom1' }] }
        : {},
    );
    renderAt('?session_id=cs_test_12345678&credential=course&courses=dom1');
    await loaded();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Your course is unlocked'));
    expect(get).toHaveBeenCalledWith('/checkout/credentials');
    expect(purchase().value).toBe(29);
    expect(purchase().currency).toBe('EUR');
  });

  it('three courses: GA4 value 69, waits for all three', async () => {
    get.mockImplementation(async (path: string) =>
      path === '/checkout/credentials'
        ? { credentials: ['a', 'b'].map((d) => ({ trackId: 't', productType: 'course', domainId: d })) }
        : {},
    );
    renderAt('?session_id=cs_test_12345678&credential=course&courses=a,b,c');
    await loaded();
    await waitFor(() => expect(get).toHaveBeenCalledWith('/checkout/credentials'));
    expect(screen.getByRole('status')).toHaveTextContent('Unlocking your courses now');
    expect(purchase().value).toBe(69);
    expect(screen.getByRole('status')).not.toHaveTextContent('unlocked');
  });

  it('a whole track still reports 99 and keeps the track wording', async () => {
    get.mockImplementation(async (path: string) =>
      path === '/checkout/credentials'
        ? { credentials: [{ trackId: 'aqa', productType: 'track_credential', domainId: '' }] }
        : {},
    );
    renderAt('?session_id=cs_test_12345678&credential=track_credential&tracks=aqa');
    await loaded();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Your track is unlocked'));
    expect(purchase().value).toBe(99);
  });

  it('with no return URL there is no unlocking banner, and no courses link while the flag is off', async () => {
    renderAt('');
    await loaded();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /see all courses/i })).not.toBeInTheDocument();
  });

  it('flag on: a link to the courses', async () => {
    vi.stubEnv('VITE_COURSES_ENABLED', 'true');
    renderAt('');
    await loaded();
    expect(screen.getByRole('link', { name: /see all courses/i })).toHaveAttribute('href', '/courses');
  });
});
