export interface CognitoConfig {
  domain: string;
  clientId: string;
  redirectUri: string;
  responseType: string;
  scope: string;
}

// Shape returned by our own backend's /auth/callback and /auth/refresh —
// the refresh token never leaves the backend (it lives only in the httpOnly
// cp_refresh cookie), so it's deliberately absent here.
export interface CognitoTokenResponse {
  access_token: string;
  id_token: string;
  expires_in?: number;
}

export interface AuthUser {
  sub: string;
  email?: string;
  [key: string]: unknown;
}
