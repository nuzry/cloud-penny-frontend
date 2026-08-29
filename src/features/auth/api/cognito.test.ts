import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCognitoConfig, getCognitoLoginUrl, getCognitoLogoutUrl,
  exchangeCodeForTokens, refreshTokens, logoutBackend, parseJwt,
} from './cognito';

const CODE_VERIFIER_KEY = 'pkce_code_verifier';

const fakeJwt = (payload: object) => {
  const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64url(JSON.stringify({ alg: 'none' }))}.${b64url(JSON.stringify(payload))}.sig`;
};

describe('cognito', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('getCognitoConfig falls back to sensible defaults when no env vars are set', () => {
    const config = getCognitoConfig();
    expect(config.responseType).toBe('code');
    expect(config.redirectUri.endsWith('/')).toBe(true);
    expect(config.domain).not.toMatch(/^https?:\/\//);
  });

  it('getCognitoLoginUrl persists a PKCE verifier and includes the S256 challenge in the URL', async () => {
    const url = await getCognitoLoginUrl();
    expect(sessionStorage.getItem(CODE_VERIFIER_KEY)).toBeTruthy();
    expect(url).toContain('/oauth2/authorize');
    expect(url).toContain('code_challenge=');
    expect(url).toContain('code_challenge_method=S256');
    expect(url).toContain('response_type=code');
  });

  it('getCognitoLogoutUrl points at the Cognito /logout endpoint with the client id', () => {
    const url = getCognitoLogoutUrl();
    expect(url).toContain('/logout');
    expect(url).toContain('client_id=');
  });

  describe('exchangeCodeForTokens', () => {
    it('throws if no PKCE verifier was persisted first', async () => {
      await expect(exchangeCodeForTokens('some-code')).rejects.toThrow(/PKCE code verifier/);
    });

    it('posts the code + verifier to the backend callback and clears the verifier either way', async () => {
      sessionStorage.setItem(CODE_VERIFIER_KEY, 'verifier-abc');
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'at', id_token: 'it' }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const tokens = await exchangeCodeForTokens('the-code');
      expect(tokens.access_token).toBe('at');
      expect(sessionStorage.getItem(CODE_VERIFIER_KEY)).toBeNull();

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toContain('/v1/auth/callback');
      expect(options.credentials).toBe('include');
      const body = JSON.parse(options.body);
      expect(body.code).toBe('the-code');
      expect(body.code_verifier).toBe('verifier-abc');
    });

    it('throws a descriptive error when the backend rejects the exchange', async () => {
      sessionStorage.setItem(CODE_VERIFIER_KEY, 'verifier-abc');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'invalid_grant', message: 'code expired' }),
      }));

      await expect(exchangeCodeForTokens('bad-code')).rejects.toThrow(/code expired/);
    });
  });

  describe('refreshTokens', () => {
    it('returns new tokens on success without sending a body', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ access_token: 'at2', id_token: 'it2' }) });
      vi.stubGlobal('fetch', fetchMock);

      const tokens = await refreshTokens();
      expect(tokens.access_token).toBe('at2');
      const [, options] = fetchMock.mock.calls[0];
      expect(options.credentials).toBe('include');
    });

    it('throws when the refresh cookie is missing or expired', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
      await expect(refreshTokens()).rejects.toThrow(/401/);
    });
  });

  it('logoutBackend fires a credentialed POST to the logout endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    await logoutBackend();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/v1/auth/logout');
    expect(options.credentials).toBe('include');
  });

  describe('parseJwt', () => {
    it('decodes a valid token payload', () => {
      const token = fakeJwt({ sub: 'tenant-123', email: 'a@b.com' });
      const user = parseJwt(token);
      expect(user?.sub).toBe('tenant-123');
      expect(user?.email).toBe('a@b.com');
    });

    it('returns null for a malformed token instead of throwing', () => {
      expect(parseJwt('not-a-jwt')).toBeNull();
    });
  });
});
