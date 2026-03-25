import axios from 'axios';
import type { ApiResponse } from './types';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true, // 发送 cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse;
    // 业务成功
    if (res.code === 0) {
      return response;
    }
    // 业务错误
    return Promise.reject(new Error(res.message || '请求失败'));
  },
  (error) => {
    // HTTP 错误
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        // 未授权，清除用户状态，跳转登录
        const authStore = useAuthStore();
        authStore.clearUser();
        router.push({ name: 'Login' });
      }
    }
    return Promise.reject(error);
  }
);

export default api;