import { defineStore } from 'pinia';
import {
  clientsApi,
  type Client,
  type ClientWithStats,
  type CreateClientRequest,
  type UpdateClientRequest,
  type ClientShareInfo,
  type AccessLogListResult,
} from '@/api/clients';

// Re-export types for use in components
export type { ClientWithStats, ClientShareInfo };

/**
 * Client store for managing client state
 * Per CLNT-01~04: 客户管理
 */
export const useClientsStore = defineStore('clients', {
  state: () => ({
    clients: [] as ClientWithStats[],
    total: 0,
    currentClient: null as Client | null,
    clientShares: [] as ClientShareInfo[],
    clientAccessLogs: null as AccessLogListResult | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    hasClients: (state) => state.clients.length > 0,
    getClientById: (state) => {
      return (id: string) => state.clients.find(c => c.id === id);
    },
  },

  actions: {
    /**
     * Fetch clients list
     */
    async fetchClients(options?: {
      search?: string;
      limit?: number;
      offset?: number;
    }) {
      this.loading = true;
      this.error = null;
      
      try {
        const result = await clientsApi.getClients(options);
        this.clients = result.clients;
        this.total = result.total;
      } catch (e: any) {
        this.error = e.message || '获取客户列表失败';
        throw e;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Fetch a single client
     */
    async fetchClient(id: string) {
      this.loading = true;
      this.error = null;
      
      try {
        this.currentClient = await clientsApi.getClient(id);
      } catch (e: any) {
        this.error = e.message || '获取客户信息失败';
        throw e;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Create a new client
     */
    async createClient(data: CreateClientRequest) {
      this.loading = true;
      this.error = null;
      
      try {
        const client = await clientsApi.createClient(data);
        // Refresh list
        await this.fetchClients();
        return client;
      } catch (e: any) {
        this.error = e.message || '创建客户失败';
        throw e;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Update a client
     */
    async updateClient(id: string, data: UpdateClientRequest) {
      this.loading = true;
      this.error = null;
      
      try {
        const client = await clientsApi.updateClient(id, data);
        // Update in list if present
        const index = this.clients.findIndex(c => c.id === id);
        if (index !== -1) {
          this.clients[index] = { ...this.clients[index], ...client };
        }
        // Update current client if viewing
        if (this.currentClient?.id === id) {
          this.currentClient = client;
        }
        return client;
      } catch (e: any) {
        this.error = e.message || '更新客户失败';
        throw e;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Delete a client
     */
    async deleteClient(id: string) {
      this.loading = true;
      this.error = null;
      
      try {
        await clientsApi.deleteClient(id);
        // Remove from list
        this.clients = this.clients.filter(c => c.id !== id);
        this.total -= 1;
        // Clear current if viewing
        if (this.currentClient?.id === id) {
          this.currentClient = null;
        }
      } catch (e: any) {
        this.error = e.message || '删除客户失败';
        throw e;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Fetch shares for a client
     */
    async fetchClientShares(id: string) {
      this.loading = true;
      this.error = null;
      
      try {
        this.clientShares = await clientsApi.getClientShares(id);
      } catch (e: any) {
        this.error = e.message || '获取客户分享链接失败';
        throw e;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Fetch access logs for a client
     */
    async fetchClientAccessLogs(id: string, options?: {
      limit?: number;
      offset?: number;
    }) {
      this.loading = true;
      this.error = null;
      
      try {
        this.clientAccessLogs = await clientsApi.getClientAccessLogs(id, options);
      } catch (e: any) {
        this.error = e.message || '获取客户访问记录失败';
        throw e;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Clear current client detail
     */
    clearCurrentClient() {
      this.currentClient = null;
      this.clientShares = [];
      this.clientAccessLogs = null;
    },
  },
});