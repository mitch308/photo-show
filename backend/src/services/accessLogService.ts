import { AppDataSource } from '../config/database.js';
import { ShareAccessLog } from '../models/ShareAccessLog.js';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { shareService } from './shareService.js';

/**
 * Access log data
 */
export interface AccessLogData {
  token: string;
  workId: string;
  action: 'view' | 'download';
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Service for recording and managing access logs
 * Per PRIV-05: 管理员可以查看私密链接的访问记录
 * Per STAT-04: 浏览和下载次数在管理后台可见
 */
export class AccessLogService {
  private accessLogRepo: Repository<ShareAccessLog>;

  constructor() {
    this.accessLogRepo = AppDataSource.getRepository(ShareAccessLog);
  }

  /**
   * Record an access event
   * @param token - Share token
   * @param workId - Work ID being accessed
   * @param action - 'view' or 'download'
   * @param req - Express request for IP and user agent
   */
  async recordAccess(
    token: string,
    workId: string,
    action: 'view' | 'download',
    req?: Request
  ): Promise<ShareAccessLog> {
    // Extract IP address
    let ipAddress = '';
    if (req) {
      ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                   req.socket?.remoteAddress ||
                   '';
      // Handle IPv6-mapped IPv4 addresses
      if (ipAddress.startsWith('::ffff:')) {
        ipAddress = ipAddress.substring(7);
      }
    }

    // Extract user agent
    const userAgent = req?.headers['user-agent'] || '';

    // Create log entry
    const log = new ShareAccessLog();
    log.token = token;
    log.workId = workId;
    log.action = action;
    log.ipAddress = ipAddress;
    log.userAgent = userAgent.substring(0, 255); // Truncate to fit column

    // Save log
    const savedLog = await this.accessLogRepo.save(log);

    // Increment access count in Redis for the share token
    await shareService.incrementAccessCount(token);

    return savedLog;
  }

  /**
   * Get access logs for a specific token
   */
  async getAccessLogs(token: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ logs: ShareAccessLog[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const queryBuilder = this.accessLogRepo.createQueryBuilder('log')
      .where('log.token = :token', { token })
      .orderBy('log.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    queryBuilder.take(limit).skip(offset);

    const logs = await queryBuilder.getMany();

    return { logs, total };
  }

  /**
   * Get access logs for multiple tokens (e.g., client's shares)
   */
  async getAccessLogsForTokens(
    tokens: string[],
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ logs: ShareAccessLog[]; total: number }> {
    if (tokens.length === 0) {
      return { logs: [], total: 0 };
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const queryBuilder = this.accessLogRepo.createQueryBuilder('log')
      .where('log.token IN (:...tokens)', { tokens })
      .orderBy('log.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    queryBuilder.take(limit).skip(offset);

    const logs = await queryBuilder.getMany();

    return { logs, total };
  }

  /**
   * Get access count for a work
   */
  async getWorkAccessCount(workId: string): Promise<{ views: number; downloads: number }> {
    const views = await this.accessLogRepo.count({
      where: { workId, action: 'view' },
    });

    const downloads = await this.accessLogRepo.count({
      where: { workId, action: 'download' },
    });

    return { views, downloads };
  }

  /**
   * Delete old access logs (cleanup job)
   * @param olderThanDays - Delete logs older than this many days
   */
  async deleteOldLogs(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.accessLogRepo
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }
}

export const accessLogService = new AccessLogService();