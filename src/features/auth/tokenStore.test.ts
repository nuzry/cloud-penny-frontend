import { describe, it, expect, afterEach } from 'vitest';
import { getAccessToken, getIdToken, setTokens, clearTokens } from './tokenStore';

describe('tokenStore', () => {
  afterEach(() => clearTokens());

  it('starts empty', () => {
    expect(getAccessToken()).toBeNull();
    expect(getIdToken()).toBeNull();
  });

  it('setTokens populates both tokens', () => {
    setTokens({ access_token: 'at', id_token: 'it' });
    expect(getAccessToken()).toBe('at');
    expect(getIdToken()).toBe('it');
  });

  it('clearTokens resets both to null', () => {
    setTokens({ access_token: 'at', id_token: 'it' });
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getIdToken()).toBeNull();
  });

  it('a later setTokens call overwrites the previous values', () => {
    setTokens({ access_token: 'at1', id_token: 'it1' });
    setTokens({ access_token: 'at2', id_token: 'it2' });
    expect(getAccessToken()).toBe('at2');
    expect(getIdToken()).toBe('it2');
  });
});
