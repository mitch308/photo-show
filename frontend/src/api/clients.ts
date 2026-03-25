import api from './index';
import type { ApiResponse } from './types';

/**
 * Client data structure
 */
export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  address: string;
  birthday: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  shareCount?: number;
}

/**
 * Client with stats from list endpoint
 */
export interface ClientWithStats extends Client {
  shareCount: number;
}

/**
 * Client list result
 */
export interface ClientListResult {
  clients: ClientWithStats[];
  total: number;
}

/**
 * Create client request
 */
export interface CreateClientRequest {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  address?: string;
  birthday?: string;
  notes?: string;
}

/**
 * Update client request
 */
export interface UpdateClientRequest {
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  address?: string;
  birthday?: string | null;
  notes?: string;
}

/**
 * Share info for client's shares
 */
export interface ClientShareInfo {
  token: string;
  workIds: string[];
  expiresAt: number;
  createdAt: number;
  maxAccess?: number;
  accessCount?: number;
}

/**
 * Access log entry
 */
export interface AccessLog {
  id: string;
  token: string;
  workId: string;
  action: 'view' | 'download';
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

/**
 * Access log list result
 */
export interface AccessLogListResult {
  logs: AccessLog[];
  total: number;
}

/**
 * Clients API
 * Per CLNT-01~04: 客户管理 CRUD
 */
export const clientsApi = {
  /**
   * Get list of clients with optional search
   */
  async getClients(options?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ClientListResult> {
    const params = new URLSearchParams();
    if (options?.search) params.set('search', options.search);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    
    const response = await api.get<ApiResponse<ClientListResult>>(
      `/clients?${params.toString()}`
    );
    return response.data.data;
  },

  /**
   * Get a single client by ID
   */
  async getClient(id: string): Promise<Client> {
    const response = await api.get<ApiResponse<Client>>(`/clients/${id}`);
    return response.data.data;
  },

  /**
   * Create a new client
   */
  async createClient(data: CreateClientRequest): Promise<Client> {
    const response = await api.post<ApiResponse<Client>>('/clients', data);
    return response.data.data;
  },

  /**
   * Update a client
   */
  async updateClient(id: string, data: UpdateClientRequest): Promise<Client> {
    const response = await api.put<ApiResponse<Client>>(`/clients/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete a client
   */
  async deleteClient(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },

  /**
   * Get shares for a client
   * Per CLNT-02: 管理员可以为客户创建专属的私密链接
   */
  async getClientShares(id: string): Promise<ClientShareInfo[]> {
    const response = await api.get<ApiResponse<ClientShareInfo[]>>(
      `/clients/${id}/shares`
    );
    return response.data.data;
  },

  /**
   * Get access logs for a client
   * Per CLNT-03: 管理员可以查看每个客户的访问历史
   */
  async getClientAccessLogs(
    id: string,
    options?: { limit?: number; offset?: number }
  ): Promise<AccessLogListResult> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    
    const response = await api.get<ApiResponse<AccessLogListResult>>(
      `/clients/${id}/access-logs?${params.toString()}`
    );
    return response.data.data;
  },
};