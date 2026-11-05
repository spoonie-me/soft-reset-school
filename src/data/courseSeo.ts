// Head tags for the course-first pages. One place, because each page's <SEO>
// and scripts/prerender.mjs must say the same thing. Relative imports on
// purpose: prerender bundles this file with esbuild, which does not know "@/".
//
// Used only while VITE_COURSES_ENABLED is "true". With the flag off the pages
// keep the literal <SEO> props they had on origin/main.

import { COURSE_PRICE, COURSE_BUNDLE_3_PRICE, COURSE_TRACK_PRICE } from './pricing';
import type { CatalogCourse } from './courseCatalog';

export function courseSeo(course: CatalogCourse): { title: string; description: string } {
  return {
    title: `${course.title}: a short course, €${COURSE_PRICE}, first lesson free`,
    description: `${course.blurb} ${course.lessonCount} lessons. The first lesson is free and the course is €${COURSE_PRICE} once.`,
  };
}

export const COURSES_SEO = {
  title: `Courses: first lesson free, €${COURSE_PRICE} each, any 3 for €${COURSE_BUNDLE_3_PRICE}`,
  description: `Short courses in AI-assisted software work, AI automation consulting and accessibility QA. The first lesson of every course is free. A course is €${COURSE_PRICE}, any 3 are €${COURSE_BUNDLE_3_PRICE}, a whole track is €${COURSE_TRACK_PRICE}.`,
} as const;

export const PRICING_SEO = {
  title: 'Pricing | Soft Reset School',
  description: `Try the first lesson of any course free. Then pay once: €${COURSE_PRICE} a course, any 3 for €${COURSE_BUNDLE_3_PRICE}, or €${COURSE_TRACK_PRICE} for a whole track with the exam and a certificate anyone can verify.`,
} as const;

export const TRACKS_SEO = {
  title: "Tracks: see what's inside before you sign up",
  description: `All Soft Reset School career tracks, with the full curriculum outline before you create an account. Try the first lesson of any course free. A course is €${COURSE_PRICE}, a whole track is €${COURSE_TRACK_PRICE}. No subscription.`,
} as const;

export function trackSeoDescription(pitch: string): string {
  return `${pitch} Full curriculum outline, who it's for, and the credential exam. Every course has a free first lesson. The whole track is €${COURSE_TRACK_PRICE}.`;
}

const BASE_URL = 'https://softreset.school';

/** schema.org Course with an Offer for the course page. */
export function courseJsonLd(course: CatalogCourse): object {
  const url = `${BASE_URL}/courses/${course.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.blurb,
    url,
    inLanguage: 'en',
    provider: { '@type': 'Organization', name: 'Soft Reset School', url: `${BASE_URL}/` },
    offers: {
      '@type': 'Offer',
      category: 'Paid',
      price: `${COURSE_PRICE}.00`,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url,
    },
  };
}

/** Course-first head text for the existing pages whose flag-off text names the
 * old per-track price. Only the fields listed here change. */
export const HEAD_SEO: Record<string, { title?: string; description?: string }> = {
  '/': {
    description: 'AI-era work skills for people returning to work after illness or time away. Try the first lesson of any course free. Short units, a lower-energy path in every module, nothing timed.',
  },
  '/welcome': {
    description: `A coding school built for chronic illness. Short, resumable lessons, no streak penalties, ship real AI tools. The first lesson of every course is free, then €${COURSE_PRICE} a course or €${COURSE_TRACK_PRICE} for a whole track.`,
  },
  '/for-teams': {
    description: `Fund seats for people returning to work. A seat is a whole track at €${COURSE_TRACK_PRICE}, with single-use codes by email and no subscription. For employers, nonprofits, rehab agencies and return-to-work programmes.`,
  },
  '/employers': {
    description: `Hire graduates trained in AI-assisted software development, AI automation consulting, AI-augmented medical coding and digital accessibility QA, or sponsor certification seats for your own people. A seat is a whole track at €${COURSE_TRACK_PRICE}, no expiry.`,
  },
  '/signup': {
    title: 'Sign Up: try a first lesson free',
    description: `Create your free Soft Reset School account with just your email and start with the first lesson of any course. A course is €${COURSE_PRICE} once and a whole track with the exam and certificate is €${COURSE_TRACK_PRICE}.`,
  },
};
