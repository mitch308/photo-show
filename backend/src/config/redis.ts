import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      retryStrategy: (times: number) => {
        if (times > 10) {
          console.error('Redis connection failed after 10 retries');
          return null;
        }
        // 指数退避：1s, 2s, 4s, 8s...
        return Math.min(times * 1000, 5000);
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on('connect', () => {
      console.log('Redis connected');
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
    });

    redisClient.on('close', () => {
      console.log('Redis connection closed');
    });
  }
  return redisClient;
}

export async function initRedis(): Promise<Redis> {
  return getRedis();
}

/**
 * JWT 黑名单操作
 */
export const jwtBlacklist = {
  async add(token: string, expiresIn: number): Promise<void> {
    const redis = getRedis();
    await redis.set(`blacklist:${token}`, '1', 'EX', expiresIn);
  },

  async has(token: string): Promise<boolean> {
    const redis = getRedis();
    const result = await redis.get(`blacklist:${token}`);
    return result === '1';
  },

  async remove(token: string): Promise<void> {
    const redis = getRedis();
    await redis.del(`blacklist:${token}`);
  },
};