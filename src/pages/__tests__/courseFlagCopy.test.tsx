/* Flag off: the pages say what origin/main says. Flag on: they lead with courses.
 * (The off side was also checked once against origin/main's rendered DOM for
 * these pages and the locked cards: identical.) */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock('@/lib/AuthContext', () => ({ useAuth: () => ({ user: null, loading: false }) }));

import { Pricing } from '../Pricing';
import { TracksCatalog } from '../TracksCatalog';
import { TrackInfo } from '../TrackInfo';
import { Landing } from '../Landing';
import { About } from '../About';
import { ReturningToWork } from '../ReturningToWork';
import { Welcome } from '../Welcome';
import { ForTeams } from '../ForTeams';
import { Employers } from '../Employers';
import { LockedCard } from '@/components/LockedCard';
import { COURSE_CATALOG } from '@/data/courseCatalog';

// jsdom has no canvas. The landing page's wave animation asks for one.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;

afterEach(() => vi.unstubAllEnvs());

function show(el: ReactElement, path = '/x') {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/x" element={el} />
          <Route path="/tracks/:slug" element={el} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );
}
const on = () => vi.stubEnv('VITE_COURSES_ENABLED', 'true');
const text = () => document.body.textContent ?? '';

describe('flag off: main copy', () => {
  it('pricing leads with the track at 99 and keeps the 2 and 3 track bundles', () => {
    show(<Pricing />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Try lesson 1 free. Then pay once per track.');
    expect(text()).toContain('€99 per track, flat.');
    expect(text()).toContain('Bundle — 2 tracks for €149, 3 for €199');
    expect(text()).not.toMatch(/€29|€69/);
    expect(screen.queryByRole('link', { name: /see all courses/i })).not.toBeInTheDocument();
  });

  it('catalogue, landing, about, returning to work, welcome, teams, employers have no course prices', () => {
    for (const el of [<TracksCatalog />, <Landing />, <About />, <ReturningToWork />, <Welcome />, <ForTeams />, <Employers />]) {
      const { unmount } = show(el);
      expect(text()).toMatch(/€99/);
      expect(text()).not.toMatch(/€29|€69|any 3/);
      unmount();
    }
  });

  it('the locked lesson card is the track card', () => {
    show(<LockedCard what="lesson" trackId="ai-orchestrated-dev" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('This lesson is part of the full track');
    expect(text()).toContain('The first lesson of every track is a free trial.');
    expect(screen.getByRole('link', { name: 'See the track' })).toBeInTheDocument();
  });
});

describe('flag on: course first', () => {
  it('pricing shows 29, any 3 for 69 and the whole track for 99, and no track bundles', () => {
    on();
    show(<Pricing />);
    expect(text()).toContain('€29');
    expect(text()).toMatch(/Buy one course for €29, any 3 for €69, or the whole track for €99/);
    expect(text()).not.toContain('Bundle — 2 tracks');
    expect(screen.getByRole('link', { name: /see all courses/i })).toHaveAttribute('href', '/courses');
    expect(screen.getAllByRole('button', { name: /buy the whole track/i }).length).toBeGreaterThan(0);
  });

  it('catalogue, landing, about, returning to work, welcome name the course prices', () => {
    on();
    for (const el of [<TracksCatalog />, <Landing />, <About />, <ReturningToWork />, <Welcome />]) {
      const { unmount } = show(el);
      expect(text()).toMatch(/€29/);
      expect(text()).toMatch(/first lesson of (every|any) course/i);
      unmount();
    }
  });

  it('a track page lists its courses and the 99 option', () => {
    on();
    const track = COURSE_CATALOG[0].trackId;
    show(<TrackInfo />, `/tracks/${track}`);
    expect(screen.getByRole('heading', { name: 'courses in this track' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: COURSE_CATALOG[0].title })).toHaveAttribute('href', `/courses/${COURSE_CATALOG[0].slug}`);
    expect(text()).toMatch(/whole track for €99/);
  });

  it('a locked lesson offers to buy this course, by name', () => {
    on();
    const c = COURSE_CATALOG[3];
    show(<LockedCard what="lesson" trackId={c.trackId} courseSlug={c.slug} />);
    const buy = screen.getByRole('link', { name: `Buy this course: ${c.title}` });
    expect(buy).toHaveAttribute('href', `/courses/${c.slug}`);
    expect(text()).toContain(`${c.title} is €29 once.`);
  });

  it('a locked exam offers the whole track and no single course', () => {
    on();
    show(<LockedCard what="exam" trackId="ai-orchestrated-dev" />);
    expect(screen.queryByRole('link', { name: /buy this course/i })).not.toBeInTheDocument();
    expect(text()).toMatch(/€99 once/);
  });

  it('seats for organisations stay whole-track', () => {
    on();
    show(<ForTeams />);
    expect(text()).toMatch(/Seats stay whole-track at €99/);
  });
});
