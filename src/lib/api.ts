// ─── API Client — typed fetch wrapper with auth token injection ───────────

const API_BASE = import.meta.env.VITE_BACKEND_URL ?? '/api';

export class ApiError extends Error {
  status: number;
  body: Record<string, unknown>;

  constructor(status: number, body: Record<string, unknown>) {
    super((body.error as string) ?? `API error ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function getToken(): string | null {
  return localStorage.getItem('bc_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try {
      body = await res.json();
    } catch {
      body = { error: res.statusText };
    }
    throw new ApiError(res.status, body);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

// ─── Convenience methods ─────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// ─── Auth-specific API ───────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authApi = {
  signup: (data: {
    email: string;
    password: string;
    name: string;
    gdprConsent: boolean;
    marketingConsent: boolean;
  }) => api.post<AuthResponse>('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  me: () => api.get<{ user: AuthUser }>('/auth/me'),

  verifyEmail: (token: string) =>
    api.post<{ success: boolean }>('/auth/verify-email', { token }),
};

// ─── Domain API ─────────────────────────────────────────────────────────

/* Response shapes (mirrors backend route responses) */

export interface TrackListResponse {
  tracks: Array<{ trackId: string; domainCount: number }>;
}

export interface TrackDomain {
  id: string;
  name: string;
  description: string;
  order: number;
  modules: Array<{ id: string; title: string; tier: string; order: number }>;
}

export interface TrackDetailResponse {
  trackId: string;
  domains: TrackDomain[];
  domainMastery: Record<string, { score: number; stars: number; isMastered: boolean }>;
}

export interface DomainModulesResponse {
  domain: { id: string; name: string; trackId: string };
  modules: Array<{
    id: string;
    title: string;
    description: string;
    tier: string;
    bloomLevel: string;
    order: number;
    lessonCount: number;
    hasAssessment: boolean;
    assessmentId: string | null;
    progress: { completedLessons: number; totalLessons: number } | null;
  }>;
}

export interface LessonExercise {
  id: string;
  ref: string;
  prompt: string;
  type: string;
  config: unknown;
  hints: string[];
  explanation: string | null;
  difficulty: string;
  bloomLevel: string;
  xpReward: number;
  isKnowledgeCheck: boolean;
  order: number;
}

export interface LessonDetailResponse {
  lesson: {
    id: string;
    moduleId: string;
    title: string;
    description: string;
    learningObjectives: unknown;
    contentSections: unknown;
    duration: number;
    difficulty: string;
    order: number;
    exercises: LessonExercise[];
    nextLessonId?: string | null;
    nextLessonLocked?: boolean;
    prevLessonId?: string | null;
    trackId?: string | null;
    trackTitle?: string | null;
    domainTitle?: string | null;
  };
  progress: { status: string; progress: number } | null;
}

export interface ExerciseSubmitResponse {
  submission: {
    id: string;
    score: number;
    isCorrect: boolean;
    feedback: string;
    attemptNumber: number;
  };
  explanation: string | null;
  hints: string[];
}

export interface AssessmentQuestion {
  id: string;
  ref: string;
  prompt: string;
  type: string;
  config: unknown;
  hints: string[];
  difficulty: string;
  bloomLevel: string;
  timeEstimate: number;
  order: number;
}

export interface AssessmentResponse {
  assessment: {
    id: string;
    title: string;
    description: string;
    timeLimit: number;
    passScore: number;
    questionCount: number;
  };
  questions: AssessmentQuestion[];
}

export interface AssessmentAttemptResponse {
  attempt: { id: string; score: number; passed: boolean; completedAt: string };
  answers: Array<{ exerciseId: string; score: number; isCorrect: boolean }>;
}

export interface ExamQuestion {
  id: string;
  ref: string;
  prompt: string;
  type: string;
  config: unknown;
  difficulty: string;
  bloomLevel: string;
  domainId: string;
  timeEstimate: number;
}

export interface ExamResponse {
  exam: {
    id: string;
    trackId: string;
    title: string;
    description: string;
    timeLimit: number;
    passScore: number;
    questionCount: number;
    openEndedCount?: number;
    cooldownUntil?: string | null;
  };
  questions: ExamQuestion[];
}

export interface ExamAttemptResponse {
  attempt: { id: string; score: number; passed: boolean; completedAt: string };
  answers: Array<{ exerciseId: string; score: number; isCorrect: boolean }>;
  certificate: { id: string; verifyCode: string; issuedAt: string } | null;
}

export interface CertificateResponse {
  certificate: {
    id: string;
    trackId: string;
    examScore: number;
    issuedAt: string;
    verifyCode: string;
    pdfUrl: string | null;
    holder: { name: string; email: string };
  };
}

export interface ModuleDetailResponse {
  module: {
    id: string;
    title: string;
    description: string;
    tier: string;
    bloomLevel: string;
    order: number;
    domain: {
      id: string;
      name: string;
      trackId: string;
      trackTitle: string | null;
    } | null;
    lessons: Array<{
      id: string;
      title: string;
      description: string;
      duration: number;
      difficulty: string;
      order: number;
      progress: { status: string; completedAt: string | null } | null;
      locked?: boolean;
    }>;
    assessment: {
      id: string;
      title: string;
      description: string;
      passScore: number;
      questionCount: number;
    } | null;
  };
}

export interface GamificationResponse {
  totalXp: number;
  level: number;
  xpProgress: { level: number; currentXp: number; xpToNextLevel: number; progressPercent: number };
  daysLearned: number;
  lastActiveDate: string | null;
  recentBadges: Array<{
    key: string;
    name: string;
    description: string;
    icon: string;
    tier: string;
    category: string;
    earnedAt: string;
  }>;
}

export const learningApi = {
  getTracks: () => api.get<TrackListResponse>('/tracks'),
  getTrack: (id: string) => api.get<TrackDetailResponse>(`/tracks/${id}`),
  getDomains: (trackId: string) =>
    api.get<{ trackId: string; domains: Array<{ id: string; name: string; description: string; order: number; moduleCount: number }> }>(`/tracks/${trackId}/domains`),
  getModules: (domainId: string) => api.get<DomainModulesResponse>(`/domains/${domainId}/modules`),
  getModule: (moduleId: string) => api.get<ModuleDetailResponse>(`/modules/${moduleId}`),
  getLesson: (id: string) => api.get<LessonDetailResponse>(`/lessons/${id}`),
  updateLessonProgress: (lessonId: string, status: 'in-progress' | 'completed', progress: number) =>
    api.post<{ progress: unknown }>(`/progress/${lessonId}`, { status, progress }),
  submitExercise: (exerciseId: string, answer: unknown) =>
    api.post<ExerciseSubmitResponse>(`/exercises/${exerciseId}/submit`, { answer }),
  getAssessment: (moduleId: string) => api.get<AssessmentResponse>(`/assessments/${moduleId}`),
  submitAssessment: (id: string, answers: Array<{ exerciseId: string; answer: unknown }>) =>
    api.post<AssessmentAttemptResponse>(`/assessments/${id}/attempt`, { answers }),
  getExam: (trackId: string) => api.get<ExamResponse>(`/exams/${trackId}`),
  submitExam: (id: string, answers: Array<{ exerciseId: string; answer: unknown }>) =>
    api.post<ExamAttemptResponse>(`/exams/${id}/attempt`, { answers }),
  getCertificate: (id: string) => api.get<CertificateResponse>(`/certificates/${id}`),
  verifyCertificate: (code: string) =>
    api.get<{ valid: boolean; certificate?: { trackId: string; examScore: number; issuedAt: string; holderName: string } }>(`/certificates/verify/${code}`),
  getLeaderboard: (trackId: string) =>
    api.get<{ leaderboard: Array<{ rank: number; totalXp: number; displayName: string; avatar: string | null; isCurrentUser: boolean }>; currentUser: { rank: number; totalXp: number } | null }>(`/gamification/leaderboard/${trackId}`),
  getGamification: () => api.get<GamificationResponse>('/gamification'),
  getBadges: () =>
    api.get<{ earned: Array<{ key: string; name: string; tier: string; earnedAt: string }>; all: Array<{ key: string; name: string; tier: string; isEarned: boolean }> }>('/gamification/badges'),
};
