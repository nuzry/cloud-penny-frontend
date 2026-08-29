import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('../lib/apiClient', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
const { default: apiClient } = await import('../lib/apiClient');
const {
  useSupportConversations, useConversationMessages, useCreateConversation,
  useSendSupportMessage, useResolveConversation,
} = await import('./useSupportChatQueries');

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useSupportChatQueries', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.put).mockReset();
  });

  it('useSupportConversations lists the tenant\'s conversations', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [{ conversationId: 'c1' }] } });
    const { result } = renderHook(() => useSupportConversations(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('useConversationMessages stays disabled with a null conversationId', async () => {
    const { result } = renderHook(() => useConversationMessages(null), { wrapper });
    await new Promise((r) => setTimeout(r, 10));
    expect(result.current.fetchStatus).toBe('idle');
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('useConversationMessages fetches once a conversationId is provided', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: { status: 'OPEN', messages: [] } } });
    const { result } = renderHook(() => useConversationMessages('c1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.get).toHaveBeenCalledWith('/v1/support/conversations/c1/messages');
  });

  it('useCreateConversation posts subject + message', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { conversationId: 'c2' } } });
    const { result } = renderHook(() => useCreateConversation(), { wrapper });

    result.current.mutate({ subject: 'Help', message: 'Question' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.conversationId).toBe('c2');
  });

  it('useSendSupportMessage posts to the specific conversation\'s messages endpoint', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: { messageId: 'm1' } } });
    const { result } = renderHook(() => useSendSupportMessage('c1'), { wrapper });

    result.current.mutate('follow-up');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('/v1/support/conversations/c1/messages', { message: 'follow-up' });
  });

  it('useResolveConversation PUTs the resolve endpoint', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: { data: { status: 'RESOLVED' } } });
    const { result } = renderHook(() => useResolveConversation(), { wrapper });

    result.current.mutate('c1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.put).toHaveBeenCalledWith('/v1/support/conversations/c1/resolve');
  });
});
