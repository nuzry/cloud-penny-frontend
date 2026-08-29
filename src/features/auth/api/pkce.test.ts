import { describe, it, expect } from 'vitest';
import { generateCodeVerifier, generateCodeChallenge } from './pkce';

describe('pkce', () => {
  it('generateCodeVerifier produces a URL-safe string with no padding', () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThan(0);
    expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it('generateCodeVerifier produces a different value each call', () => {
    const a = generateCodeVerifier();
    const b = generateCodeVerifier();
    expect(a).not.toBe(b);
  });

  it('generateCodeChallenge is deterministic for the same verifier (S256 of the same input)', async () => {
    const verifier = 'fixed-test-verifier-value';
    const challengeA = await generateCodeChallenge(verifier);
    const challengeB = await generateCodeChallenge(verifier);
    expect(challengeA).toBe(challengeB);
    expect(challengeA).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it('generateCodeChallenge produces different output for different verifiers', async () => {
    const a = await generateCodeChallenge('verifier-one');
    const b = await generateCodeChallenge('verifier-two');
    expect(a).not.toBe(b);
  });
});
