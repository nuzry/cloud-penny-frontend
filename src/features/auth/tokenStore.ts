// Access/id tokens live only here — a module-level closure, never
// sessionStorage/localStorage. They're short-lived (60 min) and only ever
// need to survive within a single page load; a closed tab or reload
// re-derives them from the httpOnly refresh cookie via /api/auth/refresh,
// which JS can never read directly.
let accessToken: string | null = null;
let idToken: string | null = null;

export const getAccessToken = (): string | null => accessToken;
export const getIdToken = (): string | null => idToken;

export const setTokens = (tokens: { access_token: string; id_token: string }): void => {
  accessToken = tokens.access_token;
  idToken = tokens.id_token;
};

export const clearTokens = (): void => {
  accessToken = null;
  idToken = null;
};
