import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { alertsService } from '../api/alertsService';
import type { Alert } from '../api/alertsService';

// --- Dashboard Queries ---

export const useDashboardData = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get('/v1/dashboard');
      return data.data;
    },
    enabled,
  });
};

export const useExportFiles = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['export-files'],
    queryFn: async () => {
      const { data } = await apiClient.get('/v1/exports');
      return data.data as ExportFile[];
    },
    enabled,
    staleTime: 30_000, // re-fetch if older than 30s
  });
};

export interface ExportFile {
  key: string;
  filename: string;
  queryId: string;
  sizeBytes: number;
  createdAt: string;
  expiresAt: string;
  downloadUrl: string;
}

// --- AWS Connection Queries & Mutations ---

export const useAwsConnection = () => {
  return useQuery({
    queryKey: ['aws-connection'],
    queryFn: async () => {
      const { data } = await apiClient.get('/v1/aws-connection');
      return data.data;
    },
    // Don't throw errors for 404s if it just means not connected yet, 
    // or handle it in the component. Tanstack will retry by default, which we might want to disable for 404s.
    retry: (failureCount, error: any) => {
      if (error.response?.status === 404) return false;
      return failureCount < 3;
    },
  });
};

export const useSaveAwsConnection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (awsAccountId: string) => {
      const { data } = await apiClient.post('/v1/aws-connection', { awsAccountId });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aws-connection'] });
    },
  });
};

export const useVerifyAwsConnection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/v1/aws-connection/verify');
      return data; // returning the whole data since verify sometimes returns { error: ... } inside 200 OK
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aws-connection'] });
    },
  });
};

// --- Client / User Queries & Mutations ---

export const useClientMe = () => {
  return useQuery({
    queryKey: ['client-me'],
    queryFn: async () => {
      const { data } = await apiClient.get('/v1/clients/me');
      return data.data;
    },
  });
};

export const useUpdateClientMe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.put('/v1/clients/me', payload); // DataRefreshSettings uses PUT
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-me'] });
    },
  });
};

export const useDeleteClientMe = () => {
  return useMutation({
    mutationFn: async () => {
      await apiClient.delete('/v1/clients/me');
    },
  });
};

// --- Alerts Queries ---

export const useAlerts = () => {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: (): Promise<Alert[]> => alertsService.getAlerts(),
  });
};

// --- Support Chat Queries & Mutations ---

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
