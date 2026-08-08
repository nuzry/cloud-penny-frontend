import type { CognitoConfig, CognitoTokenResponse, AuthUser } from '../types';

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

export const getCognitoLoginUrl = (): string => {
  const config = getCognitoConfig();
  // Build manually to ensure scope spaces are encoded as %20 (not +)
  const url =
    `https://${config.domain}/oauth2/authorize` +
    `?client_id=${encodeURIComponent(config.clientId)}` +
    `&response_type=${encodeURIComponent(config.responseType)}` +
    `&scope=${config.scope.split(' ').map(encodeURIComponent).join('%20')}` +
    `&redirect_uri=${encodeURIComponent(config.redirectUri)}`;
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

export const exchangeCodeForTokens = async (code: string): Promise<CognitoTokenResponse> => {
  const config = getCognitoConfig();
  const tokenEndpoint = `https://${config.domain}/oauth2/token`;

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    code: code,
    redirect_uri: config.redirectUri,
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${errorText}`);
  }

  return response.json();
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
