import apiClient from '../lib/apiClient';

// Interfaces for our User data
export interface UserInitData {
  companyName: string;
  role: string;
  // Add any other form fields you plan to collect here
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ClientProfile {
  tenantId: string;
  email: string;
  planTier: string;
  awsAccountId?: string;
  externalId?: string;
  roleArn?: string;
  connectionStatus?: string;
  lastVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const BASE_URL = '/v1/clients'; // RESTful base for this resource

export const userService = {
  /**
   * Create/Initialize a new user (tenant) in DynamoDB.
   * This sends a POST request to /api/v1/clients
   * The backend will extract the 'sub' from the Cognito token to use as tenantId.
   */
  initUser: async (data: UserInitData): Promise<ClientProfile> => {
    const response = await apiClient.post<ApiResponse<ClientProfile>>(BASE_URL, data);
    return response.data.data;
  },

  /**
   * Fetch the current user's profile from DynamoDB.
   * This sends a GET request to /api/v1/clients/me
   */
  getCurrentUser: async (): Promise<ClientProfile> => {
    const response = await apiClient.get<ApiResponse<ClientProfile>>(`${BASE_URL}/me`);
    return response.data.data;
  },

  /**
   * Update the current user's profile.
   * This sends a PATCH request to /api/v1/clients/me
   */
  updateCurrentUser: async (data: Partial<UserInitData>): Promise<ClientProfile> => {
    const response = await apiClient.patch<ApiResponse<ClientProfile>>(`${BASE_URL}/me`, data);
    return response.data.data;
  },

  /**
   * Delete the current user's profile.
   * This sends a DELETE request to /api/v1/clients/me
   */
  deleteCurrentUser: async (): Promise<void> => {
    await apiClient.delete('/v1/clients/me');
  }
};
