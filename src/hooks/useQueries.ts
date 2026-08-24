import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

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
