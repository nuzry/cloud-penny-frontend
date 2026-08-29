import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

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
