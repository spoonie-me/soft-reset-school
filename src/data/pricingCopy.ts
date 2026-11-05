// Course-first price copy, in one place. Used only while VITE_COURSES_ENABLED
// is "true". Pages call courseCopy(): it returns null with the flag off, and
// each page then renders the text it had on origin/main, untouched.
//
// House rules for everything in here: short sentences, no em dashes, no
// semicolons, no promise of a job or income, no talk of illness.

import { coursesEnabled } from '@/lib/flags';
import {
  COURSE_PRICE,
  COURSE_BUNDLE_3_PRICE,
  COURSE_TRACK_PRICE,
  COURSE_BUNDLE_SAVINGS,
  COURSE_BUNDLE_SIZE,
} from '@/data/pricing';

export const COURSE_COPY = {
  /** One line with all three prices. */
  priceLine: `A course is €${COURSE_PRICE}. Any 3 courses are €${COURSE_BUNDLE_3_PRICE}. A whole track is €${COURSE_TRACK_PRICE}.`,
  /** Short form for cards. */
  priceShort: `€${COURSE_PRICE} a course, any 3 for €${COURSE_BUNDLE_3_PRICE}, a whole track €${COURSE_TRACK_PRICE}`,
  freeLesson: 'The first lesson of every course is free.',
  noSubscription: 'You pay once. No subscription and no renewal.',
  certificateNote: 'A certificate only comes with the whole track and its exam.',

  // Landing
  landingTitle: `try a course. any first lesson is free.`,
  landingBody: `The first lesson of every course is free. A course is €${COURSE_PRICE}. Any 3 courses are €${COURSE_BUNDLE_3_PRICE}. The whole track, with the exam and the certificate, is €${COURSE_TRACK_PRICE}. You pay once. There is no monthly anything.`,
  landingPriceHead: `€${COURSE_PRICE}`,
  landingPriceTail: `per course, 3 for €${COURSE_BUNDLE_3_PRICE}, a whole track €${COURSE_TRACK_PRICE}`,
  landingPriceNote: 'first lesson free · pay once · no renewal, ever',
  landingCta: 'See the courses',
  landingHardship: `Can't afford it? Ask for a hardship code, no reason needed.`,

  // Pricing
  pricingTitle: 'Try any first lesson free. Then buy one course or the whole track.',
  pricingIntro: `No subscription. Nothing bills you on a busy month. The first lesson of every course is free. Buy one course for €${COURSE_PRICE}, any 3 for €${COURSE_BUNDLE_3_PRICE}, or the whole track for €${COURSE_TRACK_PRICE}.`,
  pricingSub: `The whole track is €${COURSE_TRACK_PRICE}. That is the only way to the exam and the certificate. If that is out of reach, ask for a hardship code below. No reason needed.`,
  pricingStart: 'Start here: try a first lesson',
  pricingStartBody: `Create a free account with just your email and start with the first lesson of any course. No card. Each course after that is €${COURSE_PRICE}.`,
  pricingCoursesHead: `Courses: €${COURSE_PRICE} each, or any 3 for €${COURSE_BUNDLE_3_PRICE}`,
  pricingCoursesBody: `Every track is six short courses. Buy the one you need, or pick any three and save €${COURSE_BUNDLE_SAVINGS}. A course gives you every lesson in it. It does not include the exam or the certificate.`,
  pricingCoursesCta: 'See all courses',
  pricingTrackHead: `Whole track: €${COURSE_TRACK_PRICE}, once`,
  pricingTrackBody: `All six courses of a track, the track exam and a certificate that anyone can verify. It is proof of practiced skill and not a promise of a job. Lesson count, exam format, and what the certificate does and does not claim are on each track's page before you pay anything.`,
  pricingTrackCta: 'Buy the whole track',
  pricingHardshipHead: `Can't afford €${COURSE_TRACK_PRICE}?`,

  // Track pages
  trackPriceNote: `Courses are €${COURSE_PRICE} each or any 3 for €${COURSE_BUNDLE_3_PRICE}. The whole track is €${COURSE_TRACK_PRICE}.`,
  trackBlock: `Buy the whole track for €${COURSE_TRACK_PRICE}. You get all six courses, the exam and the certificate. Or buy just the courses you need.`,
  trackCtaTitle: 'try a first lesson free. then buy a course or the whole track.',
  trackCoursesLink: 'See the courses in this track',

  // Catalogue
  tracksPriceNote: `Try the first lesson of any course free. A course is €${COURSE_PRICE}. The whole track is €${COURSE_TRACK_PRICE}.`,
  tracksCta: `First lesson free. No card. Then €${COURSE_PRICE} a course or €${COURSE_TRACK_PRICE} for the whole track.`,

  // Organisations
  seatsNote: `Seats stay whole-track at €${COURSE_TRACK_PRICE}. Individuals can also buy single courses for €${COURSE_PRICE} on the pricing page.`,

  // Short lines for About, Welcome and ReturningToWork
  aboutLine: `The first lesson of every course is free to try. After that a course is €${COURSE_PRICE}, and the whole track with the exam and the certificate is €${COURSE_TRACK_PRICE}.`,
  moneyLine: `The first lesson of every course is a free trial. A course is €${COURSE_PRICE} and the whole track is €${COURSE_TRACK_PRICE}, both once.`,
  readyLine: 'Try the first lesson of any course free. No credit card needed.',
  returningLine: `The first lesson of every course is free, with no card. A course is €${COURSE_PRICE} once, and the whole track is €${COURSE_TRACK_PRICE}. There is no subscription. If that is out of reach, ask for a hardship code at hi@softreset.school.`,
  returningCta: 'See the courses',

  // Ads
  adStat: `€${COURSE_PRICE}`,
  adStatLabel: `per course, or €${COURSE_TRACK_PRICE} for the whole track`,
  adFinal: `The whole track is €${COURSE_TRACK_PRICE}, once. Every lesson, the certification exam and a certificate that anyone can verify. You can also buy a single course for €${COURSE_PRICE}. Try a first lesson free first.`,

  // Locked content
  lockedLesson: 'This lesson is part of a paid course',
  lockedExam: 'The exam comes with the whole track',
  lockedAssessment: 'Module assessments come with the course',
  lockedFreeLine: 'The first lesson of every course is free.',
  endOfTrial: 'That was the free lesson',
  endOfTrialBody: `The rest of this course is €${COURSE_PRICE} once. The whole track is €${COURSE_TRACK_PRICE}, with the exam and the certificate. No subscription, no renewal. If that is out of reach, ask for a hardship code. No reason needed.`,
  buyThisCourse: 'Buy this course',
  seeTheCourse: 'See the course',

  // Dashboard
  dashWaitingCourse: 'Payment received. Unlocking your course now. This usually takes a few seconds.',
  dashUnlockedCourse: 'Your course is unlocked. Every lesson in it is yours. No deadline.',
  dashWaitingCourses: 'Payment received. Unlocking your courses now. This usually takes a few seconds.',
  dashUnlockedCourses: 'Your courses are unlocked. Every lesson in them is yours. No deadline.',
  dashBrowse: 'Looking for something else? See all courses.',
} as const;

export type CourseCopy = typeof COURSE_COPY;

/** The course-first copy, or null with the flag off. */
export function courseCopy(): CourseCopy | null {
  return coursesEnabled() ? COURSE_COPY : null;
}

/** GA4 purchase value for a return URL, or null when the URL is not a course purchase
 * (the caller then uses its track value, 99). Flag-independent: a paid session is always reported. */
export function purchaseValue(credential: string, courseCount: number): number | null {
  if (credential !== 'course') return null;
  if (courseCount === COURSE_BUNDLE_SIZE) return COURSE_BUNDLE_3_PRICE;
  return COURSE_PRICE;
}
