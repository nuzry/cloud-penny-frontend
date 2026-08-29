import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from './types';
import { exchangeCodeForTokens, refreshTokens, logoutBackend, getCognitoLogoutUrl, parseJwt } from './api/cognito';
import { setTokens, clearTokens } from './tokenStore';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  loginWithCode: (code: string) => Promise<void>;
  logout: () => void;
  /** Clears auth state locally WITHOUT triggering a Cognito/browser navigation.
   *  Use this before async operations (e.g. delete account API) so the request
   *  isn't aborted mid-flight by the page redirect that `logout()` causes.
   */
  clearSession: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If there's an OAuth 'code' in the URL, LandingPage will immediately
    // call loginWithCode — let that own isLoading instead of racing it with
    // the silent-refresh attempt below.
    const hasCode = new URLSearchParams(window.location.search).has('code');
    if (hasCode) return;

    // No tokens survive a closed tab (they're in-memory only), so on every
    // fresh page load the only thing that can restore a session is the
    // httpOnly refresh cookie — try it silently before showing the login
    // screen. A missing/expired cookie just means "not logged in", not an
    // error.
    (async () => {
      try {
        const tokens = await refreshTokens();
        setTokens(tokens);
        const parsedUser = parseJwt(tokens.id_token);
        if (parsedUser) {
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch {
        // No valid session to restore — this is the normal logged-out state.
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const loginWithCode = async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const tokens = await exchangeCodeForTokens(code);
      setTokens(tokens);

      const parsedUser = parseJwt(tokens.id_token);
      if (parsedUser) {
        setUser(parsedUser);
        setIsAuthenticated(true);
        // Clear code from URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        throw new Error('Could not parse user from ID token');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to exchange authorization code for tokens');
      logoutLocally();
    } finally {
      setIsLoading(false);
    }
  };

  const logoutLocally = () => {
    clearTokens();
    sessionStorage.removeItem('aws_connect_cached_profile');
    sessionStorage.removeItem('aws_connect_cached_verify');
    setUser(null);
    setIsAuthenticated(false);
  };

  const logout = () => {
    logoutLocally();
    // Best-effort: revoke the refresh token + clear the cookie server-side.
    // Bounded so a slow/unreachable backend can never trap the user on this
    // page — they still need to reach Cognito's own /logout regardless.
    const withTimeout = Promise.race([
      logoutBackend(),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
    withTimeout
      .catch(() => undefined)
      .finally(() => window.location.assign(getCognitoLogoutUrl()));
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, loginWithCode, logout, clearSession: logoutLocally, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

