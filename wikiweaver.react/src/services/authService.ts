import { AxiosError } from 'axios';
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
  try {
    const response = await apiClient.post<AdminAuthResponseDto>('/auth/login', payload);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const adminRegister = async (payload: AdminRegisterRequestDto): Promise<AdminAuthResponseDto> => {
  try {
    const response = await apiClient.post<AdminAuthResponseDto>('/auth/register', payload);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const generateInviteToken = async (): Promise<AdminInviteTokenCreateResponseDto> => {
  try {
    const response = await apiClient.post<AdminInviteTokenCreateResponseDto>('/auth/invite-token');
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

const extractApiErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const responseMessage = error.response?.data?.message;
    if (typeof responseMessage === 'string' && responseMessage.trim()) {
      return responseMessage;
    }
  }

  return error instanceof Error ? error.message : 'Unknown error';
};
