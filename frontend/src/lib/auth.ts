import apiClient from './api';
import type { User, ApiResponse } from '@/types';

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  username: string;
  password: string;
  password2: string;
}

export const authApi = {
  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/signup/', credentials);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login/', credentials);
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout/');
    localStorage.removeItem('auth_token');
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/api/auth/profile/');
    return response.data;
  },

  async updateProfile(data: Partial<User> & { github_token?: string }): Promise<{ user: User; message: string }> {
    const response = await apiClient.patch<{ user: User; message: string }>('/api/auth/profile/', data);
    return response.data;
  },

  async validateGitHubPAT(token: string): Promise<{ is_valid: boolean; username?: string; message: string }> {
    const response = await apiClient.post<{ is_valid: boolean; username?: string; message: string }>(
      '/api/auth/validate-pat/',
      { token }
    );
    return response.data;
  },

  async checkPATStatus(): Promise<{ has_token: boolean; github_username: string | null; message: string }> {
    const response = await apiClient.get<{ has_token: boolean; github_username: string | null; message: string }>(
      '/api/auth/check-pat/'
    );
    return response.data;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },
};
