import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from './types';
import { exchangeCodeForTokens, getCognitoLogoutUrl, parseJwt } from './api/cognito';

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
    // Check if tokens exist in sessionStorage on mount
    const accessToken = sessionStorage.getItem('access_token');
    const idToken = sessionStorage.getItem('id_token');

    if (accessToken && idToken) {
      const parsedUser = parseJwt(idToken);
      if (parsedUser) {
        setUser(parsedUser);
        setIsAuthenticated(true);
      } else {
        // Token might be invalid or expired
        logoutLocally();
      }
    }
    
    // If there's an OAuth 'code' in the URL, the LandingPage will immediately
    // call loginWithCode which sets isLoading to true. To prevent a UI flicker
    // where it briefly shows the login screen before the exchange starts, 
    // we keep isLoading true here if a code is present.
    const hasCode = new URLSearchParams(window.location.search).has('code');
    if (!hasCode) {
      setIsLoading(false);
    }
  }, []);

  const loginWithCode = async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const tokens = await exchangeCodeForTokens(code);
      
      sessionStorage.setItem('access_token', tokens.access_token);
      sessionStorage.setItem('id_token', tokens.id_token);
      if (tokens.refresh_token) {
        sessionStorage.setItem('refresh_token', tokens.refresh_token);
      }

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
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('id_token');
    sessionStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const logout = () => {
    logoutLocally();
    window.location.assign(getCognitoLogoutUrl());
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
