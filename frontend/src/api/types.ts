/**
 * API 响应格式
 */
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

/**
 * 管理员信息
 */
export interface AdminInfo {
  id: string;
  username: string;
  email?: string;
}

/**
 * 登录请求
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  user: AdminInfo;
}