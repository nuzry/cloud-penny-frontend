import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('../lib/apiClient', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
const { default: apiClient } = await import('../lib/apiClient');
const { useAwsConnection, useSaveAwsConnection, useVerifyAwsConnection } = await import('./useAwsConnectionQueries');

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useAwsConnectionQueries', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
  });

  it('useAwsConnection does not retry on a 404 (not-yet-connected is a valid state, not an error)', async () => {
    vi.mocked(apiClient.get).mockRejectedValue({ response: { status: 404 } });
    const { result } = renderHook(() => useAwsConnection(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(apiClient.get).toHaveBeenCalledTimes(1); // no retries
  });

  it('useSaveAwsConnection posts the account ID and invalidates the connection query', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { connectionStatus: 'PENDING' } } });
    const { result } = renderHook(() => useSaveAwsConnection(), { wrapper });

    result.current.mutate('111111111111');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('/v1/aws-connection', { awsAccountId: '111111111111' });
  });

  it('useVerifyAwsConnection returns the full response body (verify may report a soft error inside a 200)', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { success: false, data: { connectionStatus: 'PENDING' } } });
    const { result } = renderHook(() => useVerifyAwsConnection(), { wrapper });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.success).toBe(false);
  });
});
