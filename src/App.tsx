import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';
import { ProtectedRoute } from '@/components/ProtectedRoute';
// NotFound stays eager — needed for the catch-all without a loading flash
import { NotFound } from '@/pages/NotFound';

// Route-level lazy loading — each page becomes its own chunk
const lazy$ = <T extends Record<string, React.ComponentType<any>>>(
  loader: () => Promise<T>,
  name: keyof T,
) => lazy(() => loader().then((m) => ({ default: m[name] as React.ComponentType })));

const AdLanding        = lazy$(() => import('@/pages/AdLanding'),        'AdLanding');
const Landing          = lazy$(() => import('@/pages/Landing'),          'Landing');
const Pricing          = lazy$(() => import('@/pages/Pricing'),          'Pricing');
const Login            = lazy$(() => import('@/pages/Login'),            'Login');
const Signup           = lazy$(() => import('@/pages/Signup'),           'Signup');
const Dashboard        = lazy$(() => import('@/pages/Dashboard'),        'Dashboard');
const Lesson           = lazy$(() => import('@/pages/Lesson'),           'Lesson');
const TrackOverview    = lazy$(() => import('@/pages/TrackOverview'),    'TrackOverview');
const Module           = lazy$(() => import('@/pages/Module'),           'Module');
const Assessment       = lazy$(() => import('@/pages/Assessment'),       'Assessment');
const Exam             = lazy$(() => import('@/pages/Exam'),             'Exam');
const Certificate      = lazy$(() => import('@/pages/Certificate'),      'Certificate');
const Imprint          = lazy$(() => import('@/pages/Imprint'),          'Imprint');
const PrivacyPolicy    = lazy$(() => import('@/pages/PrivacyPolicy'),    'PrivacyPolicy');
const TermsOfService   = lazy$(() => import('@/pages/TermsOfService'),   'TermsOfService');
const CookiePolicy     = lazy$(() => import('@/pages/CookiePolicy'),     'CookiePolicy');
const DataProcessing   = lazy$(() => import('@/pages/DataProcessing'),   'DataProcessing');
const Leaderboard      = lazy$(() => import('@/pages/Leaderboard'),      'Leaderboard');
const Profile          = lazy$(() => import('@/pages/Profile'),          'Profile');
const ForgotPassword   = lazy$(() => import('@/pages/ForgotPassword'),   'ForgotPassword');
const ResetPassword    = lazy$(() => import('@/pages/ResetPassword'),    'ResetPassword');
const ForTeams         = lazy$(() => import('@/pages/ForTeams'),         'ForTeams');
const About            = lazy$(() => import('@/pages/About'),           'About');
const Employers        = lazy$(() => import('@/pages/Employers'),       'Employers');
const ShareStory       = lazy$(() => import('@/pages/ShareStory'),       'ShareStory');
const Welcome          = lazy$(() => import('@/pages/Welcome'),          'Welcome');
const SignupSuccess     = lazy$(() => import('@/pages/SignupSuccess'),    'SignupSuccess');
const WelcomeMember    = lazy$(() => import('@/pages/WelcomeMember'),    'WelcomeMember');
const WelcomeSpecialist= lazy$(() => import('@/pages/WelcomeSpecialist'),'WelcomeSpecialist');
const WelcomeArchitect = lazy$(() => import('@/pages/WelcomeArchitect'), 'WelcomeArchitect');
const Blog             = lazy$(() => import('@/pages/Blog'),             'Blog');
const Lab              = lazy$(() => import('@/pages/Lab'),              'Lab');
const LabPost           = lazy$(() => import('@/pages/LabPost'),          'LabPost');
const TracksCatalog    = lazy$(() => import('@/pages/TracksCatalog'),    'TracksCatalog');
const TrackInfo        = lazy$(() => import('@/pages/TrackInfo'),        'TrackInfo');
const VerifyEmail      = lazy$(() => import('@/pages/VerifyEmail'),      'VerifyEmail');
const VerifyCertificate= lazy$(() => import('@/pages/VerifyCertificate'),'VerifyCertificate');
const WhatIsAiLiteracy = lazy$(() => import('@/pages/blog/WhatIsAiLiteracy'),       'WhatIsAiLiteracy');
const BuildYourFirstAiApp = lazy$(() => import('@/pages/blog/BuildYourFirstAiApp'), 'BuildYourFirstAiApp');
const CodingWithChronicIllness = lazy$(() => import('@/pages/blog/CodingWithChronicIllness'), 'CodingWithChronicIllness');
const PromptEngineeringGuide = lazy$(() => import('@/pages/blog/PromptEngineeringGuide'), 'PromptEngineeringGuide');

// Simple page-transition fallback (no spinner — keeps layout stable for low-motion users)
function PageFallback() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading page"
      aria-live="polite"
      style={{ minHeight: '60vh' }}
    />
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    const main = document.getElementById('main-content');
    if (main) main.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}

function AppInner() {
  const { pathname } = useLocation();
  const isAdPage = pathname.startsWith('/go/');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <ScrollToTop />
      {!isAdPage && <Header />}
      <main id="main-content" style={{ flex: 1 }} tabIndex={-1}>
        <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Ad landing pages — no nav/footer */}
          <Route path="/go/coding" element={<AdLanding />} />
          <Route path="/go/ai" element={<AdLanding />} />
          <Route path="/go/agents" element={<AdLanding />} />

          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/tracks" element={<TracksCatalog />} />
          <Route path="/tracks/:slug" element={<TrackInfo />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/verify/:code" element={<VerifyCertificate />} />
          <Route path="/imprint" element={<Imprint />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/dpa" element={<DataProcessing />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes — require authentication */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/lesson/:id" element={<ProtectedRoute><Lesson /></ProtectedRoute>} />
          <Route path="/track/:trackId" element={<ProtectedRoute><TrackOverview /></ProtectedRoute>} />
          <Route path="/module/:moduleId" element={<ProtectedRoute><Module /></ProtectedRoute>} />
          <Route path="/assessment/:moduleId" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
          <Route path="/exam/:trackId" element={<ProtectedRoute><Exam /></ProtectedRoute>} />
          <Route path="/certificate/:id" element={<ProtectedRoute><Certificate /></ProtectedRoute>} />
          <Route path="/leaderboard/:trackId" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Blog */}
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/what-is-ai-literacy" element={<WhatIsAiLiteracy />} />
          <Route path="/blog/build-your-first-ai-app" element={<BuildYourFirstAiApp />} />
          <Route path="/blog/coding-with-chronic-illness" element={<CodingWithChronicIllness />} />
          <Route path="/blog/prompt-engineering-guide" element={<PromptEngineeringGuide />} />

          {/* Lab — ongoing work: Dell/clinical AI, Chronically, rois.life */}
          <Route path="/lab" element={<Lab />} />
          <Route path="/lab/:slug" element={<LabPost />} />

          <Route path="/for-teams" element={<ForTeams />} />
          <Route path="/about" element={<About />} />
          <Route path="/employers" element={<Employers />} />
          <Route path="/share-story" element={<ShareStory />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/welcome-member" element={<WelcomeMember />} />
          <Route path="/welcome-specialist" element={<WelcomeSpecialist />} />
          <Route path="/welcome-architect" element={<WelcomeArchitect />} />
          <Route path="/signup-success" element={<ProtectedRoute><SignupSuccess /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </main>
      {!isAdPage && <Footer />}
      {!isAdPage && <CookieConsent />}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
