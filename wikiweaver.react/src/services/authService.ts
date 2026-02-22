import apiClient from '../shared/api-client/ApiClient';
import type {
  AdminAuthResponseDto,
  AdminAuthStatusDto,
  AdminLoginRequestDto,
  AdminRegisterRequestDto,
  AdminInviteTokenCreateResponseDto,
} from '../shared/types/ApiTypes';
import { getStoredAdminToken } from './authTokenStorage';

export const isAdminAuthenticated = (): boolean => Boolean(getStoredAdminToken());

export const getAuthStatus = async (): Promise<AdminAuthStatusDto> => {
  const response = await apiClient.get<AdminAuthStatusDto>('/auth/status');
  return response.data;
};

export const adminLogin = async (payload: AdminLoginRequestDto): Promise<AdminAuthResponseDto> => {
  const response = await apiClient.post<AdminAuthResponseDto>('/auth/login', payload);
  return response.data;
};

export const adminRegister = async (payload: AdminRegisterRequestDto): Promise<AdminAuthResponseDto> => {
  const response = await apiClient.post<AdminAuthResponseDto>('/auth/register', payload);
  return response.data;
};

export const generateInviteToken = async (): Promise<AdminInviteTokenCreateResponseDto> => {
  const response = await apiClient.post<AdminInviteTokenCreateResponseDto>('/auth/invite-token');
  return response.data;
};
