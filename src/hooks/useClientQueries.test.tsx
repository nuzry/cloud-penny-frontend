import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('../lib/apiClient', () => ({ default: { get: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
const { default: apiClient } = await import('../lib/apiClient');
const { useClientMe, useUpdateClientMe, useDeleteClientMe } = await import('./useClientQueries');

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useClientQueries', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.put).mockReset();
    vi.mocked(apiClient.delete).mockReset();
  });

  it('useClientMe fetches the client profile', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: { email: 'a@b.com' } } });
    const { result } = renderHook(() => useClientMe(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.email).toBe('a@b.com');
  });

  it('useUpdateClientMe PUTs the payload and returns the updated record', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: { data: { dailyRefreshQuota: 5 } } });
    const { result } = renderHook(() => useUpdateClientMe(), { wrapper });

    result.current.mutate({ dailyRefreshQuota: 5 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.put).toHaveBeenCalledWith('/v1/clients/me', { dailyRefreshQuota: 5 });
  });

  it('useDeleteClientMe calls DELETE on the client endpoint', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({});
    const { result } = renderHook(() => useDeleteClientMe(), { wrapper });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('/v1/clients/me');
  });
});
