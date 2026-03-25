import crypto from 'crypto';
import { getRedis } from '../config/redis.js';

/**
 * Share token data stored in Redis
 */
export interface ShareTokenData {
  workIds: string[];
  expiresAt: number;  // Unix timestamp (ms)
  createdAt: number;
  createdBy?: string; // Admin ID (optional)
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
   * @param expiresInDays - Expiration in days (default: 7)
   * @returns The generated token
   */
  async createShareToken(workIds: string[], expiresInDays: number = 7): Promise<string> {
    const token = this.generateToken();
    const now = Date.now();
    const expiresAt = now + expiresInDays * 24 * 60 * 60 * 1000;
    const ttlSeconds = expiresInDays * 24 * 60 * 60;

    const data: ShareTokenData = {
      workIds,
      expiresAt,
      createdAt: now,
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
   * @returns ShareTokenData if valid, null if expired/invalid
   */
  async validateToken(token: string): Promise<ShareTokenData | null> {
    const redis = getRedis();
    const key = `${this.KEY_PREFIX}${token}`;
    
    const data = await redis.get(key);
    
    if (!data) {
      return null;
    }

    return JSON.parse(data) as ShareTokenData;
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
}

// Export singleton instance
export const shareService = new ShareService();