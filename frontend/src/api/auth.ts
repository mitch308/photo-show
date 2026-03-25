import api from './index';
import type { ApiResponse, AdminInfo, LoginResponse } from './types';

/**
 * 登录
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
    username,
    password,
  });
  return res.data.data;
}

/**
 * 退出登录
 */
export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

/**
 * 刷新 Token
 */
export async function refreshToken(): Promise<void> {
  await api.post('/auth/refresh');
}

/**
 * 获取当前用户信息
 */
export async function getMe(): Promise<AdminInfo> {
  const res = await api.get<ApiResponse<AdminInfo>>('/auth/me');
  return res.data.data;
}