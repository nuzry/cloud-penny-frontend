import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

const refreshTokens = vi.fn();
vi.mock('../features/auth/api/cognito', () => ({ refreshTokens: (...args: unknown[]) => refreshTokens(...args) }));

const { default: apiClient } = await import('./apiClient');
const { setTokens, clearTokens, getAccessToken } = await import('../features/auth/tokenStore');

const mock = new MockAdapter(apiClient);

describe('apiClient', () => {
  beforeEach(() => {
    mock.reset();
    refreshTokens.mockReset();
    clearTokens();
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  afterEach(() => clearTokens());

  it('attaches the in-memory access token as a Bearer header when present', async () => {
    setTokens({ access_token: 'at1', id_token: 'it1' });
    mock.onGet('/v1/whoami').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer at1');
      return [200, { ok: true }];
    });

    await apiClient.get('/v1/whoami');
  });

  it('sends no Authorization header when there is no token yet', async () => {
    mock.onGet('/v1/whoami').reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, { ok: true }];
    });
    await apiClient.get('/v1/whoami');
  });

  it('on a 401, silently refreshes and retries the original request once', async () => {
    setTokens({ access_token: 'stale', id_token: 'it' });
    refreshTokens.mockResolvedValue({ access_token: 'fresh', id_token: 'it2' });

    let calls = 0;
    mock.onGet('/v1/dashboard').reply((config) => {
      calls++;
      if (config.headers?.Authorization === 'Bearer stale') return [401, { error: 'expired' }];
      return [200, { data: 'ok', authHeader: config.headers?.Authorization }];
    });

    const res = await apiClient.get('/v1/dashboard');
    expect(calls).toBe(2);
    expect(res.data.authHeader).toBe('Bearer fresh');
    expect(getAccessToken()).toBe('fresh');
  });

  it('queues concurrent 401s behind a single in-flight refresh, then retries all of them', async () => {
    setTokens({ access_token: 'stale', id_token: 'it' });
    let resolveRefresh: (v: { access_token: string; id_token: string }) => void;
    refreshTokens.mockReturnValue(new Promise((resolve) => { resolveRefresh = resolve; }));

    mock.onGet('/v1/a').reply((config) =>
      config.headers?.Authorization === 'Bearer fresh' ? [200, { ok: true }] : [401, {}]
    );
    mock.onGet('/v1/b').reply((config) =>
      config.headers?.Authorization === 'Bearer fresh' ? [200, { ok: true }] : [401, {}]
    );

    const p1 = apiClient.get('/v1/a');
    const p2 = apiClient.get('/v1/b');

    // Let both initial 401s land before the refresh resolves.
    await new Promise((r) => setTimeout(r, 10));
    resolveRefresh!({ access_token: 'fresh', id_token: 'it2' });

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(refreshTokens).toHaveBeenCalledTimes(1); // not once per queued request
  });

  it('clears tokens and redirects to login when the refresh itself fails', async () => {
    setTokens({ access_token: 'stale', id_token: 'it' });
    refreshTokens.mockRejectedValue(new Error('refresh cookie expired'));
    mock.onGet('/v1/dashboard').reply(401, {});

    await expect(apiClient.get('/v1/dashboard')).rejects.toThrow();
    expect(getAccessToken()).toBeNull();
    expect(window.location.href).toBe('/');
  });
});
