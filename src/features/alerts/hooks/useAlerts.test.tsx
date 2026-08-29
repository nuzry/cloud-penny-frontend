import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('../../../lib/apiClient', () => ({ default: { get: vi.fn() } }));
const { default: apiClient } = await import('../../../lib/apiClient');
const { useAlerts } = await import('./useAlerts');

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useAlerts', () => {
  beforeEach(() => vi.mocked(apiClient.get).mockReset());

  it('fetches the tenant\'s anomaly alerts', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [{ anomalyId: 'a1', status: 'UNREAD' }] } });
    const { result } = renderHook(() => useAlerts(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(apiClient.get).toHaveBeenCalledWith('/v1/alerts');
  });
});
