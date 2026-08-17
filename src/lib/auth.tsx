import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
  email: string;
  fullName: string | null;
  avatarUrl?: string | null;
  isAdmin?: boolean;
  marketingConsent?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signup: (
    email: string,
    password: string,
    fullName?: string,
    marketingConsent?: boolean,
  ) => Promise<{ error?: string }>;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  setMarketingConsent: (value: boolean) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signup = async (
    email: string,
    password: string,
    fullName?: string,
    marketingConsent?: boolean,
  ) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, fullName, marketingConsent }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.error ?? 'Sign up failed' };
    }
    const data = await res.json();
    setUser(data);
    return {};
  };

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.error ?? 'Login failed' };
    }
    const data = await res.json();
    setUser(data);
    return {};
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  // Lets the customer turn marketing email on or off from their profile.
  // Local state updates only after the server confirms, so the toggle can
  // never display a consent state the backend disagrees with.
  const setMarketingConsent = async (value: boolean) => {
    const res = await fetch('/api/auth/consent', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ marketingConsent: value }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.error ?? 'Could not update your email preference' };
    }
    const data = await res.json();
    setUser((prev) => (prev ? { ...prev, marketingConsent: data.marketingConsent } : prev));
    return {};
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signup, login, logout, setMarketingConsent }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
