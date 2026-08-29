import apiClient from '../../../lib/apiClient';

export interface AlertMessage {
  monitorArn?: string;
  anomalies?: Array<{
    anomalyId: string;
    anomalyScore: {
      maxScore: number;
      currentScore: number;
    };
    impact: {
      maxImpact: number;
      totalImpact: number;
      totalActualSpend: number;
      totalExpectedSpend: number;
      totalImpactPercentage: number;
    };
    rootCauses?: Array<{
      service: string;
      region: string;
      usageType: string;
      linkedAccount: string;
    }>;
  }>;
}

export interface Alert {
  tenantId: string;
  createdAt: string;
  anomalyId: string;
  awsAccountId: string;
  message: AlertMessage;
  status: 'UNREAD' | 'READ';
}

export const alertsService = {
  getAlerts: async (): Promise<Alert[]> => {
    const response = await apiClient.get('/v1/alerts');
    return response.data.data;
  }
};
