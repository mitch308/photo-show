import crypto from 'crypto';
import { getRedis } from '../config/redis.js';

/**
 * Share token data stored in Redis
 * Per PRIV-06: 支持访问次数限制
 * Per CLNT-02: 支持为客户创建专属私密链接
 */
export interface ShareTokenData {
  workIds: string[];
  expiresAt: number;  // Unix timestamp (ms)
  createdAt: number;
  createdBy?: string; // Admin ID (optional)
  clientId?: string;  // Client ID for customer-specific shares (CLNT-02)
  maxAccess?: number; // Maximum access count limit (PRIV-06)
  accessCount?: number; // Current access count
}

/**
 * Share info returned by list operations
 */
export interface ShareInfo extends ShareTokenData {
  token: string;
}

/**
 * Service for managing private share tokens
 * 
 * Per D-09: Token uses crypto.randomBytes(32).toString('base64url')
 * Per D-10: Token stored in Redis with TTL for auto-expiration
 * Per D-11: Default expiration is 7 days
 */
export class ShareService {
  private readonly KEY_PREFIX = 'share:';

  /**
   * Generate a secure random token
   * Per D-09: crypto.randomBytes(32).toString('base64url')
   * Returns ~43 character URL-safe string
   */
  generateToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Create a new share token and store it in Redis
   * @param workIds - Array of work IDs to share
   * @param options - Optional settings
   * @param options.expiresInDays - Expiration in days (default: 7)
   * @param options.clientId - Client ID for customer-specific shares
   * @param options.maxAccess - Maximum access count limit
   * @returns The generated token
   */
  async createShareToken(
    workIds: string[],
    options?: {
      expiresInDays?: number;
      clientId?: string;
      maxAccess?: number;
    }
  ): Promise<string> {
    const token = this.generateToken();
    const now = Date.now();
    const expiresInDays = options?.expiresInDays ?? 7;
    const expiresAt = now + expiresInDays * 24 * 60 * 60 * 1000;
    const ttlSeconds = expiresInDays * 24 * 60 * 60;

    const data: ShareTokenData = {
      workIds,
      expiresAt,
      createdAt: now,
      clientId: options?.clientId,
      maxAccess: options?.maxAccess,
      accessCount: 0,
    };

    const redis = getRedis();
    const key = `${this.KEY_PREFIX}${token}`;

    // Use setex for auto-expiration (per D-10)
    await redis.setex(key, ttlSeconds, JSON.stringify(data));

    return token;
  }

  /**
   * Validate a share token and return its data
   * @param token - The token to validate
   * @returns ShareTokenData if valid, null if expired/invalid/exceeded access limit
   */
  async validateToken(token: string): Promise<ShareTokenData | null> {
    const redis = getRedis();
    const key = `${this.KEY_PREFIX}${token}`;
    
    const data = await redis.get(key);
    
    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data) as ShareTokenData;
    
    // Check if max access limit exceeded (PRIV-06)
    if (parsed.maxAccess !== undefined && parsed.accessCount !== undefined) {
      if (parsed.accessCount >= parsed.maxAccess) {
        return null; // Access limit exceeded
      }
    }

    return parsed;
  }

  /**
   * Increment access count for a share token
   * @param token - The token to increment
   * @returns Updated ShareTokenData or null if token not found
   */
  async incrementAccessCount(token: string): Promise<ShareTokenData | null> {
    const redis = getRedis();
    const key = `${this.KEY_PREFIX}${token}`;
    
    const data = await redis.get(key);
    
    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data) as ShareTokenData;
    parsed.accessCount = (parsed.accessCount || 0) + 1;
    
    // Calculate remaining TTL
    const ttl = await redis.ttl(key);
    if (ttl > 0) {
      await redis.setex(key, ttl, JSON.stringify(parsed));
    }
    
    return parsed;
  }

  /**
   * Revoke a share token
   * @param token - The token to revoke
   * @returns true if token was deleted, false if not found
   */
  async revokeToken(token: string): Promise<boolean> {
    const redis = getRedis();
    const key = `${this.KEY_PREFIX}${token}`;
    
    const result = await redis.del(key);
    return result > 0;
  }

  /**
   * Check if a work is in a share
   * @param token - The share token
   * @param workId - The work ID to check
   * @returns true if work is in share, false otherwise
   */
  async isWorkInShare(token: string, workId: string): Promise<boolean> {
    const data = await this.validateToken(token);
    
    if (!data) {
      return false;
    }

    return data.workIds.includes(workId);
  }

  /**
   * List all active shares using SCAN
   * @returns Array of ShareInfo sorted by createdAt DESC
   */
  async listAllShares(): Promise<ShareInfo[]> {
    const redis = getRedis();
    const shares: ShareInfo[] = [];
    let cursor = '0';

    do {
      // SCAN returns [cursor, keys[]]
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        `${this.KEY_PREFIX}*`,
        'COUNT',
        100
      );
      cursor = nextCursor;

      // Fetch data for each key
      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          const token = key.replace(this.KEY_PREFIX, '');
          const parsed = JSON.parse(data) as ShareTokenData;
          shares.push({
            token,
            ...parsed,
          });
        }
      }
    } while (cursor !== '0');

    // Sort by createdAt DESC
    shares.sort((a, b) => b.createdAt - a.createdAt);

    return shares;
  }

  /**
   * Get share info by token
   * @param token - The token to look up
   * @returns ShareInfo if found, null otherwise
   */
  async getShareInfo(token: string): Promise<ShareInfo | null> {
    const data = await this.validateToken(token);
    
    if (!data) {
      return null;
    }

    return {
      token,
      ...data,
    };
  }

  /**
   * Update share token settings
   * @param token - The token to update
   * @param updates - Fields to update
   * @returns Updated ShareTokenData or null if not found
   */
  async updateShareToken(
    token: string,
    updates: { maxAccess?: number; clientId?: string }
  ): Promise<ShareTokenData | null> {
    const redis = getRedis();
    const key = `${this.KEY_PREFIX}${token}`;
    
    const data = await redis.get(key);
    
    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data) as ShareTokenData;
    
    if (updates.maxAccess !== undefined) {
      parsed.maxAccess = updates.maxAccess;
    }
    if (updates.clientId !== undefined) {
      parsed.clientId = updates.clientId;
    }
    
    // Calculate remaining TTL
    const ttl = await redis.ttl(key);
    if (ttl > 0) {
      await redis.setex(key, ttl, JSON.stringify(parsed));
    }
    
    return parsed;
  }

  /**
   * List shares by client ID
   * @param clientId - The client ID to filter by
   * @returns Array of ShareInfo for the client
   */
  async listSharesByClient(clientId: string): Promise<ShareInfo[]> {
    const allShares = await this.listAllShares();
    return allShares.filter(share => share.clientId === clientId);
  }
}

// Export singleton instance
export const shareService = new ShareService();