import type { CognitoConfig, CognitoTokenResponse, AuthUser } from '../types';
import { generateCodeVerifier, generateCodeChallenge } from './pkce';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const CODE_VERIFIER_KEY = 'pkce_code_verifier';

export const getCognitoConfig = (): CognitoConfig => {
  let rawDomain =
    import.meta.env.VITE_COGNITO_DOMAIN ||
    'cloudpenny-auth.auth.us-east-1.amazoncognito.com';
  // Strip any accidental leading protocol (http/https) and trailing slashes
  rawDomain = rawDomain.replace(/^https?:\/\//i, '').replace(/\/+$/, '');

  let rawRedirect =
    import.meta.env.VITE_COGNITO_REDIRECT_URI || `${window.location.origin}/`;
  // Ensure trailing slash for redirect origin matching
  if (!rawRedirect.endsWith('/') && !rawRedirect.includes('?')) {
    rawRedirect += '/';
  }

  return {
    domain: rawDomain,
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || 'your-cognito-client-id',
    redirectUri: rawRedirect,
    responseType: 'code',
    scope: import.meta.env.VITE_COGNITO_SCOPE || 'openid email phone',
  };
};

export const getCognitoLoginUrl = async (): Promise<string> => {
  const config = getCognitoConfig();

  // The verifier has to survive a full-page navigation to Cognito's Hosted
  // UI and back, so it's persisted here (sessionStorage, not tokenStore's
  // in-memory closure, which a navigation would wipe) and read back once by
  // exchangeCodeForTokens after the redirect returns.
  const codeVerifier = generateCodeVerifier();
  sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Build manually to ensure scope spaces are encoded as %20 (not +)
  const url =
    `https://${config.domain}/oauth2/authorize` +
    `?client_id=${encodeURIComponent(config.clientId)}` +
    `&response_type=${encodeURIComponent(config.responseType)}` +
    `&scope=${config.scope.split(' ').map(encodeURIComponent).join('%20')}` +
    `&redirect_uri=${encodeURIComponent(config.redirectUri)}` +
    `&code_challenge=${encodeURIComponent(codeChallenge)}` +
    `&code_challenge_method=S256`;
  return url;
};

export const getCognitoLogoutUrl = (): string => {
  const config = getCognitoConfig();
  return (
    `https://${config.domain}/logout` +
    `?client_id=${encodeURIComponent(config.clientId)}` +
    `&logout_uri=${encodeURIComponent(config.redirectUri)}`
  );
};

// The actual Cognito token exchange now happens server-side (our backend
// holds the refresh token in an httpOnly cookie the browser can never read)
// — this just hands the code + verifier to our own API and gets back the
// short-lived access/id tokens for in-memory use.
export const exchangeCodeForTokens = async (code: string): Promise<CognitoTokenResponse> => {
  const config = getCognitoConfig();
  const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
  if (!codeVerifier) {
    throw new Error('Missing PKCE code verifier — the login attempt may have started in a different tab/session');
  }

  const response = await fetch(`${API_BASE}/v1/auth/callback`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: codeVerifier, redirect_uri: config.redirectUri }),
  });

  sessionStorage.removeItem(CODE_VERIFIER_KEY);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(`Token exchange failed: ${errorBody.message || errorBody.error || response.status}`);
  }

  return response.json();
};

// No refresh token argument — it's the httpOnly cp_refresh cookie, sent
// automatically by the browser via credentials:'include', that authorizes
// this call. Used both for silent session restore on page load and for
// renewing an expired access token.
export const refreshTokens = async (): Promise<CognitoTokenResponse> => {
  const response = await fetch(`${API_BASE}/v1/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  return response.json();
};

export const logoutBackend = async (): Promise<void> => {
  await fetch(`${API_BASE}/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
};

export const parseJwt = (token: string): AuthUser | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload) as AuthUser;
  } catch (e) {
    console.error('Failed to parse JWT', e);
    return null;
  }
};
