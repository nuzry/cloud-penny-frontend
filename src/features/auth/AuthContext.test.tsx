import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';

const exchangeCodeForTokens = vi.fn();
const refreshTokens = vi.fn();
const logoutBackend = vi.fn();
const getCognitoLogoutUrl = vi.fn(() => 'https://cognito.example/logout');
const parseJwt = vi.fn();

vi.mock('./api/cognito', () => ({
  exchangeCodeForTokens,
  refreshTokens,
  logoutBackend,
  getCognitoLogoutUrl,
  parseJwt,
}));

const { AuthProvider, useAuth } = await import('./AuthContext');

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

const setUrl = (search: string) => {
  window.history.replaceState({}, '', `/${search}`);
};

describe('AuthContext', () => {
  beforeEach(() => {
    exchangeCodeForTokens.mockReset();
    refreshTokens.mockReset();
    logoutBackend.mockReset().mockResolvedValue(undefined);
    parseJwt.mockReset();
    setUrl('');
  });

  // jsdom locks individual Location methods (assign/reload/replace) down as
  // non-configurable, so the only way to observe a call to `.assign()` is to
  // swap out `window.location` itself for a plain object with the same
  // current href/search/pathname (captured live via spread) plus a stub.
  const mockLocationAssign = () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, assign },
      configurable: true,
    });
    return assign;
  };

  it('attempts a silent refresh on mount when there is no ?code= in the URL, and settles logged-out on failure', async () => {
    refreshTokens.mockRejectedValue(new Error('no session'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(refreshTokens).toHaveBeenCalledTimes(1);
  });

  it('restores the session from a successful silent refresh', async () => {
    refreshTokens.mockResolvedValue({ access_token: 'at', id_token: 'it' });
    parseJwt.mockReturnValue({ sub: 'tenant-123', email: 'a@b.com' });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.sub).toBe('tenant-123');
  });

  it('does not attempt a silent refresh when a ?code= param is present (defers to loginWithCode)', async () => {
    setUrl('?code=abc123');
    renderHook(() => useAuth(), { wrapper });
    await new Promise((r) => setTimeout(r, 0));
    expect(refreshTokens).not.toHaveBeenCalled();
  });

  it('loginWithCode exchanges the code, sets the authenticated user, and strips the code from the URL', async () => {
    refreshTokens.mockRejectedValue(new Error('no session'));
    exchangeCodeForTokens.mockResolvedValue({ access_token: 'at', id_token: 'it' });
    parseJwt.mockReturnValue({ sub: 'tenant-123' });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.loginWithCode('the-code');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.sub).toBe('tenant-123');
    expect(result.current.error).toBeNull();
  });

  it('loginWithCode surfaces the error and logs out locally on failure', async () => {
    refreshTokens.mockRejectedValue(new Error('no session'));
    exchangeCodeForTokens.mockRejectedValue(new Error('token exchange failed'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.loginWithCode('bad-code');
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toMatch(/token exchange failed/);
  });

  it('logout clears local state immediately and navigates to Cognito logout regardless of the backend call outcome', async () => {
    refreshTokens.mockResolvedValue({ access_token: 'at', id_token: 'it' });
    parseJwt.mockReturnValue({ sub: 'tenant-123' });
    logoutBackend.mockRejectedValue(new Error('backend unreachable'));
    const assign = mockLocationAssign();

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    act(() => {
      result.current.logout();
    });

    // Local state clears synchronously, before the backend call even settles.
    expect(result.current.isAuthenticated).toBe(false);

    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://cognito.example/logout'));
  });
});
