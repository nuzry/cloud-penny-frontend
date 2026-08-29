import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

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
