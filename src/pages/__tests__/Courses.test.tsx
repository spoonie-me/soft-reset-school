import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const post = vi.fn();
vi.mock('@/lib/api', () => ({ api: { post: (...a: unknown[]) => post(...a), get: vi.fn() } }));

let mockUser: { id: string } | null = { id: 'u1' };
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));

import { Courses } from '../Courses';
import { CoursePage } from '../CoursePage';
import { COURSE_CATALOG, coursesOfTrack } from '@/data/courseCatalog';

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function renderAt(path: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CoursePage />} />
          <Route path="/login" element={<p>login page</p>} />
          <Route path="/tracks" element={<p>tracks catalogue</p>} />
          <Route path="/tracks/:slug" element={<p>track page</p>} />
        </Routes>
        <Where />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

const course = COURSE_CATALOG[0];

beforeEach(() => {
  post.mockReset();
  mockUser = { id: 'u1' };
  sessionStorage.clear();
  vi.stubEnv('VITE_COURSES_ENABLED', 'true');
});
afterEach(() => {
  vi.unstubAllEnvs();
  delete (globalThis as { __BUILD_DATE__?: string }).__BUILD_DATE__;
});

describe('flag off', () => {
  beforeEach(() => vi.stubEnv('VITE_COURSES_ENABLED', ''));

  it('/courses goes to /tracks', () => {
    renderAt('/courses');
    expect(screen.getByText('tracks catalogue')).toBeInTheDocument();
    expect(screen.getByTestId('where')).toHaveTextContent('/tracks');
  });

  it('/courses/:slug goes to /tracks', () => {
    renderAt(`/courses/${course.slug}`);
    expect(screen.getByText('tracks catalogue')).toBeInTheDocument();
  });
});

describe('course page', () => {
  it('shows title, blurb, modules with lesson counts, price and the free first lesson link', () => {
    renderAt(`/courses/${course.slug}`);
    expect(screen.getByRole('heading', { level: 1, name: course.title })).toBeInTheDocument();
    expect(screen.getByText(course.blurb)).toBeInTheDocument();
    for (const m of course.modules) {
      const item = screen.getByText(m.title).closest('li')!;
      expect(item).toHaveTextContent(`${m.lessonCount} ${m.lessonCount === 1 ? 'lesson' : 'lessons'}`);
    }
    expect(screen.getByRole('heading', { name: '€29, once' })).toBeInTheDocument();
    const free = screen.getByRole('link', { name: /try the first lesson free/i });
    expect(free).toHaveAttribute('href', `/lesson/${course.firstLessonId}`);
  });

  it('links to the other courses of the track and to the track with the 99 option', () => {
    renderAt(`/courses/${course.slug}`);
    const others = coursesOfTrack(course.trackId).filter((c) => c.slug !== course.slug);
    for (const o of others) {
      expect(screen.getByRole('link', { name: o.title })).toHaveAttribute('href', `/courses/${o.slug}`);
    }
    expect(screen.getByRole('heading', { name: /whole track for €99/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /see the whole track/i })).toHaveAttribute('href', `/tracks/${course.trackId}`);
  });

  it('is honest about what is and is not included', () => {
    renderAt(`/courses/${course.slug}`);
    expect(screen.getByRole('heading', { name: 'What you get' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What you do not get' })).toBeInTheDocument();
    expect(screen.getByText(/certificate only comes with the whole track and its exam/i)).toBeInTheDocument();
    expect(screen.getByText(/no promise of a job or an income/i)).toBeInTheDocument();
    expect(screen.getByText('If you want a graded exam and a certificate, buy the whole track.')).toBeInTheDocument();
  });

  it('shows the build date as last updated, and leaves the line out when there is none', () => {
    const { unmount } = renderAt(`/courses/${course.slug}`);
    expect(screen.queryByText(/last updated/i)).not.toBeInTheDocument();
    unmount();
    (globalThis as { __BUILD_DATE__?: string }).__BUILD_DATE__ = '2026-11-05';
    renderAt(`/courses/${course.slug}`);
    expect(screen.getByText('Last updated 2026-11-05.')).toBeInTheDocument();
  });

  it('an unknown slug goes to the catalogue', () => {
    renderAt('/courses/not-a-course');
    expect(screen.getByTestId('where')).toHaveTextContent('/courses');
  });

  it('buy button asks for consent, then posts courseIds', async () => {
    post.mockResolvedValue({ url: '' });
    const user = userEvent.setup();
    renderAt(`/courses/${course.slug}`);
    await user.click(screen.getByRole('button', { name: /buy this course for €29/i }));
    const go = screen.getByRole('button', { name: /continue to checkout/i });
    expect(go).toBeDisabled();
    await user.click(screen.getByRole('checkbox'));
    await user.click(go);
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/checkout/session', { courseIds: [course.domainKey] });
  });

  it('shows the server error and stays on the dialog', async () => {
    post.mockRejectedValue({ body: { error: 'You already own the course.' } });
    const user = userEvent.setup();
    renderAt(`/courses/${course.slug}`);
    await user.click(screen.getByRole('button', { name: /buy this course/i }));
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /continue to checkout/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('You already own the course.');
  });
});

describe('checkout edge cases', () => {
  async function toConfirm() {
    const user = userEvent.setup();
    renderAt(`/courses/${course.slug}`);
    await user.click(screen.getByRole('button', { name: /buy this course/i }));
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /continue to checkout/i }));
  }

  it('on a 409 with an open session url, goes to that url', async () => {
    const loc = { href: '' };
    vi.stubGlobal('location', loc);
    post.mockRejectedValue({ status: 409, body: { error: 'in progress', url: 'https://checkout.stripe.test/s1' } });
    await toConfirm();
    await waitFor(() => expect(loc.href).toBe('https://checkout.stripe.test/s1'));
    vi.unstubAllGlobals();
  });

  it('logged out: does not post, keeps the cart, goes to /login', async () => {
    mockUser = null;
    await toConfirm();
    expect(post).not.toHaveBeenCalled();
    expect(await screen.findByText('login page')).toBeInTheDocument();
    expect(JSON.parse(sessionStorage.getItem('srs.courseCartKeys')!)).toEqual([course.domainKey]);
  });

  it('restores a saved 3-course cart on /courses', () => {
    const keys = COURSE_CATALOG.slice(0, 3).map((c) => c.domainKey);
    sessionStorage.setItem('srs.courseCartKeys', JSON.stringify(keys));
    renderAt('/courses');
    expect(screen.getByRole('button', { name: /buy these 3/i })).toBeEnabled();
  });
});

describe('catalogue and pick 3', () => {
  it('groups the courses by track, each with a link to its page', () => {
    renderAt('/courses');
    const tracks = new Set(COURSE_CATALOG.map((c) => c.trackId));
    expect(screen.getAllByRole('region').length).toBe(tracks.size);
    for (const c of COURSE_CATALOG) {
      expect(screen.getByRole('link', { name: c.title })).toHaveAttribute('href', `/courses/${c.slug}`);
    }
  });

  it('has no checkboxes until picking starts', () => {
    renderAt('/courses');
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('needs exactly 3, shows the running selection, and posts those 3 for 69', async () => {
    post.mockResolvedValue({ url: '' });
    const user = userEvent.setup();
    renderAt('/courses');
    await user.click(screen.getByRole('button', { name: /pick 3 courses/i }));

    const buy = () => screen.getByRole('button', { name: /pick \d more|buy these 3 for €69/i });
    expect(buy()).toBeDisabled();
    expect(screen.getByText('0 of 3 picked')).toBeInTheDocument();

    const [a, b, c, d] = COURSE_CATALOG;
    await user.click(screen.getByRole('checkbox', { name: `Pick ${a.title}` }));
    await user.click(screen.getByRole('checkbox', { name: `Pick ${b.title}` }));
    expect(screen.getByText('2 of 3 picked')).toBeInTheDocument();
    expect(screen.getByText(/€69 once you pick 1 more/)).toBeInTheDocument();
    expect(buy()).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: `Pick ${c.title}` }));
    expect(screen.getByText('3 of 3 picked')).toBeInTheDocument();
    expect(screen.getByText('Price: €69 for these 3.')).toBeInTheDocument();
    expect(buy()).toBeEnabled();
    expect(buy()).toHaveTextContent('Buy these 3 for €69');

    // A fourth cannot be picked. The rest are disabled until one is unticked.
    const fourth = screen.getByRole('checkbox', { name: `Pick ${d.title}` });
    expect(fourth).toBeDisabled();
    const status = screen.getByRole('status');
    for (const x of [a, b, c]) expect(within(status).getByText(x.title)).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: `Pick ${c.title}` }));
    expect(screen.getByText('2 of 3 picked')).toBeInTheDocument();
    expect(buy()).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: `Pick ${c.title}` }));

    await user.click(buy());
    await user.click(screen.getByRole('checkbox', { name: /withdrawal|understand/i }));
    await user.click(screen.getByRole('button', { name: /continue to checkout/i }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/checkout/session', { courseIds: [a.domainKey, b.domainKey, c.domainKey] });
  });

  it('every checkbox is keyboard operable (Space toggles)', async () => {
    const user = userEvent.setup();
    renderAt('/courses');
    await user.click(screen.getByRole('button', { name: /pick 3 courses/i }));
    const box = screen.getByRole('checkbox', { name: `Pick ${COURSE_CATALOG[0].title}` });
    box.focus();
    await user.keyboard(' ');
    expect(box).toBeChecked();
  });

  it('stop picking clears the selection', async () => {
    const user = userEvent.setup();
    renderAt('/courses');
    await user.click(screen.getByRole('button', { name: /pick 3 courses/i }));
    await user.click(screen.getByRole('checkbox', { name: `Pick ${COURSE_CATALOG[0].title}` }));
    await user.click(screen.getByRole('button', { name: /stop picking/i }));
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: /pick 3 courses/i }));
    expect(screen.getByText('0 of 3 picked')).toBeInTheDocument();
  });
});
