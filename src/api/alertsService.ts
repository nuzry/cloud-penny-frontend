import axios from 'axios';

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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const alertsService = {
  getAlerts: async (): Promise<Alert[]> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/api/v1/alerts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  }
};
