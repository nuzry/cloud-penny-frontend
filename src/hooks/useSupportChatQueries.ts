import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export interface SupportConversationSummary {
  conversationId: string;
  subject: string;
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  lastMessagePreview: string;
}

export interface SupportMessage {
  messageId: string;
  sender: 'CLIENT' | 'ADMIN';
  text: string;
  createdAt: string;
}

export interface SupportConversationDetail {
  conversationId: string;
  subject: string;
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
}

export const useSupportConversations = () => {
  return useQuery({
    queryKey: ['support-conversations'],
    queryFn: async (): Promise<SupportConversationSummary[]> => {
      const { data } = await apiClient.get('/v1/support/conversations');
      return data.data;
    },
  });
};

export const useConversationMessages = (conversationId: string | null) => {
  return useQuery({
    queryKey: ['support-conversation', conversationId],
    queryFn: async (): Promise<SupportConversationDetail> => {
      const { data } = await apiClient.get(`/v1/support/conversations/${conversationId}/messages`);
      return data.data;
    },
    enabled: !!conversationId,
    // Admin replies arrive from Telegram asynchronously, so this polls for
    // new messages — but only while the conversation is still OPEN. Once
    // resolved it's static history, so polling stops on its own without the
    // component needing to manage that.
    refetchInterval: (query) => (query.state.data?.status === 'OPEN' ? 5000 : false),
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { subject: string; message: string }) => {
      const { data } = await apiClient.post('/v1/support/conversations', payload);
      return data.data as { conversationId: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-conversations'] });
    },
  });
};

export const useSendSupportMessage = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      const { data } = await apiClient.post(`/v1/support/conversations/${conversationId}/messages`, { message });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['support-conversations'] });
    },
  });
};

export const useResolveConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data } = await apiClient.put(`/v1/support/conversations/${conversationId}/resolve`);
      return data.data;
    },
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['support-conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['support-conversations'] });
    },
  });
};
