/**
 * 统一 API 响应格式
 */
export interface ApiResponse<T = any> {
  code: number;    // 0=成功，非0=错误码
  data: T;
  message: string;
}

/**
 * 成功响应
 */
export function successResponse<T>(data: T, message: string = 'success'): ApiResponse<T> {
  return { code: 0, data, message };
}

/**
 * 错误响应
 */
export function errorResponse(code: number, message: string): ApiResponse<null> {
  return { code, data: null, message };
}

/**
 * 错误码定义
 */
export const ErrorCodes = {
  UNKNOWN: 1,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  LOGIN_FAILED: 1001,
  TOKEN_EXPIRED: 1002,
  TOKEN_INVALID: 1003,
} as const;

/**
 * Admin 用户信息
 */
export interface AdminInfo {
  id: string;
  username: string;
  email?: string;
}