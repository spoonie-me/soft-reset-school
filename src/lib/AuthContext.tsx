/* eslint-disable react-refresh/only-export-components */
// AuthProvider (component) and useAuth (hook) are always co-located in context files.
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi, ApiError, type AuthUser } from './api';

// ─── Types ───────────────────────────────────────────────────────────────

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    name: string;
    gdprConsent: boolean;
    marketingConsent: boolean;
  }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'bc_token';
const DEV_MODE = import.meta.env.DEV;

const DEV_USER: AuthUser = {
  id: 'dev-user',
  email: 'dev@bedcoders.com',
  name: 'Dev User',
  emailVerified: true,
};

// ─── Provider ────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true, // starts loading until we check stored token
    error: null,
  });

  // On mount — check for existing token and validate with /me
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    // Dev mode: if token is set to 'dev', skip API validation
    if (DEV_MODE && token === 'dev') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ user: DEV_USER, loading: false, error: null });
      return;
    }

    if (!token) {
      setState({ user: null, loading: false, error: null });
      return;
    }

    authApi
      .me()
      .then(({ user }) => {
        setState({ user, loading: false, error: null });
      })
      .catch(() => {
        // Token expired or invalid — clear it
        localStorage.removeItem(TOKEN_KEY);
        setState({ user: null, loading: false, error: null });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { token, user } = await authApi.login({ email, password });
      localStorage.setItem(TOKEN_KEY, token);
      setState({ user, loading: false, error: null });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? (err.body.error as string) ?? 'Login failed'
          : 'Network error. Please try again.';
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, []);

  const signup = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      gdprConsent: boolean;
      marketingConsent: boolean;
    }) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const { token, user } = await authApi.signup(data);
        localStorage.setItem(TOKEN_KEY, token);
        setState({ user, loading: false, error: null });
        (window as any).trackEvent?.('signup_complete');
      } catch (err) {
        const message =
          err instanceof ApiError
            ? (err.body.error as string) ?? 'Signup failed'
            : 'Network error. Please try again.';
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw err;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setState({ user: null, loading: false, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
