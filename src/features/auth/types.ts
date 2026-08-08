export interface CognitoConfig {
  domain: string;
  clientId: string;
  redirectUri: string;
  responseType: string;
  scope: string;
}

export interface CognitoTokenResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthUser {
  sub: string;
  email?: string;
  [key: string]: unknown;
}
