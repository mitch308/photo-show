import jwt from 'jsonwebtoken';
import ms from 'ms';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
const JWT_EXPIRES_IN: ms.StringValue = '7d';
const JWT_REFRESH_EXPIRES_IN: ms.StringValue = '30d';

export interface JwtPayload {
  userId: string;
  username: string;
  type: 'access' | 'refresh';
}

/**
 * 生成 Access Token
 */
export function generateAccessToken(userId: string, username: string): string {
  return jwt.sign(
    { userId, username, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * 生成 Refresh Token
 */
export function generateRefreshToken(userId: string, username: string): string {
  return jwt.sign(
    { userId, username, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
}

/**
 * 验证 Token
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * 获取 Token 过期时间（秒）
 */
export function getTokenExpiresInSeconds(token: string): number {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (decoded?.exp) {
      return decoded.exp - Math.floor(Date.now() / 1000);
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * 从 Cookie 中获取 Token
 */
export function getTokenFromCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=');
    if (key === name && value) {
      return value;
    }
  }
  return null;
}