import { useQuery } from '@tanstack/react-query';
import { alertsService } from '../api/alertsService';
import type { Alert } from '../api/alertsService';

export const useAlerts = () => {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: (): Promise<Alert[]> => alertsService.getAlerts(),
  });
};
