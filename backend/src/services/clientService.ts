import { AppDataSource } from '../config/database.js';
import { Client } from '../models/Client.js';
import { ShareAccessLog } from '../models/ShareAccessLog.js';
import { Repository, Like } from 'typeorm';
import { shareService, ShareInfo } from './shareService.js';

/**
 * Client with associated shares count
 */
export interface ClientWithStats {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  address: string;
  birthday: Date | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  shareCount: number;
}

/**
 * Client list options
 */
export interface ClientListOptions {
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Create client data
 */
export interface CreateClientData {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  address?: string;
  birthday?: Date;
  notes?: string;
}

/**
 * Update client data
 */
export interface UpdateClientData {
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  address?: string;
  birthday?: Date | null;
  notes?: string;
}

/**
 * Access log with work info
 */
export interface AccessLogWithWork {
  id: string;
  token: string;
  workId: string;
  action: 'view' | 'download';
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

/**
 * Service for client management
 * Per CLNT-01~04: 客户管理
 */
export class ClientService {
  private clientRepo: Repository<Client>;
  private accessLogRepo: Repository<ShareAccessLog>;

  constructor() {
    this.clientRepo = AppDataSource.getRepository(Client);
    this.accessLogRepo = AppDataSource.getRepository(ShareAccessLog);
  }

  /**
   * List clients with optional search
   * Per CLNT-01: 管理员可以添加和管理客户信息
   */
  async listClients(options: ClientListOptions = {}): Promise<{ clients: ClientWithStats[]; total: number }> {
    const { search, limit = 50, offset = 0 } = options;

    const queryBuilder = this.clientRepo.createQueryBuilder('client');

    if (search) {
      queryBuilder.where(
        'client.name LIKE :search OR client.email LIKE :search OR client.phone LIKE :search OR client.company LIKE :search',
        { search: `%${search}%` }
      );
    }

    queryBuilder.orderBy('client.createdAt', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.take(limit).skip(offset);

    const clients = await queryBuilder.getMany();

    // Get share counts for each client
    const allShares = await shareService.listAllShares();
    const shareCounts = new Map<string, number>();

    for (const share of allShares) {
      if (share.clientId) {
        shareCounts.set(share.clientId, (shareCounts.get(share.clientId) || 0) + 1);
      }
    }

    const clientsWithStats: ClientWithStats[] = clients.map(client => ({
      ...client,
      shareCount: shareCounts.get(client.id) || 0,
    }));

    return { clients: clientsWithStats, total };
  }

  /**
   * Get a single client by ID
   */
  async getClientById(id: string): Promise<Client | null> {
    return this.clientRepo.findOne({ where: { id } });
  }

  /**
   * Create a new client
   * Per CLNT-01: 管理员可以添加和管理客户信息
   */
  async createClient(data: CreateClientData): Promise<Client> {
    const client = new Client();
    client.name = data.name;
    client.phone = data.phone || '';
    client.email = data.email || '';
    client.company = data.company || '';
    client.address = data.address || '';
    client.birthday = data.birthday || null;
    client.notes = data.notes || '';

    return this.clientRepo.save(client);
  }

  /**
   * Update a client
   * Per CLNT-04: 管理员可以编辑和删除客户信息
   */
  async updateClient(id: string, data: UpdateClientData): Promise<Client | null> {
    const client = await this.getClientById(id);
    if (!client) return null;

    if (data.name !== undefined) client.name = data.name;
    if (data.phone !== undefined) client.phone = data.phone;
    if (data.email !== undefined) client.email = data.email;
    if (data.company !== undefined) client.company = data.company;
    if (data.address !== undefined) client.address = data.address;
    if (data.birthday !== undefined) client.birthday = data.birthday;
    if (data.notes !== undefined) client.notes = data.notes;

    return this.clientRepo.save(client);
  }

  /**
   * Delete a client
   * Per CLNT-04: 管理员可以编辑和删除客户信息
   */
  async deleteClient(id: string): Promise<boolean> {
    const client = await this.getClientById(id);
    if (!client) return false;

    await this.clientRepo.remove(client);
    return true;
  }

  /**
   * Get shares for a client
   * Per CLNT-02: 管理员可以为客户创建专属的私密链接
   */
  async getClientShares(clientId: string): Promise<ShareInfo[]> {
    return shareService.listSharesByClient(clientId);
  }

  /**
   * Get access logs for a client
   * Per CLNT-03: 管理员可以查看每个客户的访问历史
   */
  async getClientAccessLogs(clientId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AccessLogWithWork[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    // Get shares for this client
    const shares = await shareService.listSharesByClient(clientId);
    const tokens = shares.map(s => s.token);

    if (tokens.length === 0) {
      return { logs: [], total: 0 };
    }

    // Query access logs for these tokens
    const queryBuilder = this.accessLogRepo.createQueryBuilder('log')
      .where('log.token IN (:...tokens)', { tokens })
      .orderBy('log.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    queryBuilder.take(limit).skip(offset);

    const logs = await queryBuilder.getMany();

    return {
      logs: logs.map(log => ({
        id: log.id,
        token: log.token,
        workId: log.workId,
        action: log.action,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      })),
      total,
    };
  }
}

export const clientService = new ClientService();