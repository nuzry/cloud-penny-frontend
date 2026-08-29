import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('../lib/apiClient', () => ({ default: { get: vi.fn() } }));
const { default: apiClient } = await import('../lib/apiClient');
const { useDashboardData, useExportFiles } = await import('./useDashboardQueries');

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useDashboardQueries', () => {
  beforeEach(() => vi.mocked(apiClient.get).mockReset());

  it('useDashboardData unwraps the envelope\'s data field', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: { totalCost: 42 } } });
    const { result } = renderHook(() => useDashboardData(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.totalCost).toBe(42);
    expect(apiClient.get).toHaveBeenCalledWith('/v1/dashboard');
  });

  it('useDashboardData stays disabled (no request) when enabled=false', async () => {
    const { result } = renderHook(() => useDashboardData(false), { wrapper });
    await new Promise((r) => setTimeout(r, 10));
    expect(result.current.fetchStatus).toBe('idle');
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('useExportFiles returns the export file list', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [{ key: 'a.csv' }] } });
    const { result } = renderHook(() => useExportFiles(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(apiClient.get).toHaveBeenCalledWith('/v1/exports');
  });
});
