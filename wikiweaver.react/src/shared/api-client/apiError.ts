import axios, { AxiosError } from 'axios';
import { locale } from '../../localization';

type ProblemPayload = {
  title?: unknown;
  message?: unknown;
  error?: unknown;
  code?: unknown;
  traceId?: unknown;
};

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly traceId?: string;

  constructor(message: string, status?: number, code?: string, traceId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.traceId = traceId;
  }
}

type ApiProblemDetails = {
  message: string | null;
  code?: string;
  traceId?: string;
};

const extractString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const extractProblemDetails = (payload: unknown): ApiProblemDetails => {
  if (!payload || typeof payload !== 'object') {
    return { message: null };
  }

  const candidate = payload as ProblemPayload;
  const value = candidate.title ?? candidate.message ?? candidate.error;
  return {
    message: extractString(value) ?? null,
    code: extractString(candidate.code),
    traceId: extractString(candidate.traceId),
  };
};

export const extractApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof AxiosError) {
    return extractProblemDetails(error.response?.data).message ?? error.message;
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
    const details = extractProblemDetails(error.response?.data);
    const message = details.message ?? extractApiErrorMessage(error);
    return new ApiError(message, error.response?.status, details.code, details.traceId);
  }

  return new ApiError(extractApiErrorMessage(error));
};
