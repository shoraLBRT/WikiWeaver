import axios, { AxiosError } from 'axios';
import { locale } from '../../localization';

type ProblemPayload = {
  title?: unknown;
  message?: unknown;
  error?: unknown;
};

export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const extractPayloadMessage = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as ProblemPayload;
  const value = candidate.title ?? candidate.message ?? candidate.error;
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  return null;
};

export const extractApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof AxiosError) {
    return extractPayloadMessage(error.response?.data) ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return locale.common.unknownError;
};

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const message = extractApiErrorMessage(error);
    return new ApiError(message, error.response?.status);
  }

  return new ApiError(extractApiErrorMessage(error));
};
