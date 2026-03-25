import { Request, Response, NextFunction } from 'express';
import { verifyToken, getTokenFromCookie, JwtPayload } from '../utils/jwt.js';
import { jwtBlacklist } from '../config/redis.js';
import { errorResponse, ErrorCodes } from '../types/response.js';

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * 认证中间件
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = getTokenFromCookie(req.headers.cookie, 'accessToken');

  if (!token) {
    res.status(401).json(errorResponse(ErrorCodes.UNAUTHORIZED, '未登录'));
    return;
  }

  // 检查黑名单
  const isBlacklisted = await jwtBlacklist.has(token);
  if (isBlacklisted) {
    res.status(401).json(errorResponse(ErrorCodes.TOKEN_INVALID, 'Token 已失效'));
    return;
  }

  // 验证 Token
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json(errorResponse(ErrorCodes.TOKEN_INVALID, 'Token 无效'));
    return;
  }

  if (payload.type !== 'access') {
    res.status(401).json(errorResponse(ErrorCodes.TOKEN_INVALID, 'Token 类型错误'));
    return;
  }

  // 将用户信息挂载到 request
  req.user = payload;
  next();
}

/**
 * 可选认证中间件（不强制要求登录）
 */
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = getTokenFromCookie(req.headers.cookie, 'accessToken');

  if (token) {
    const isBlacklisted = await jwtBlacklist.has(token);
    if (!isBlacklisted) {
      const payload = verifyToken(token);
      if (payload && payload.type === 'access') {
        req.user = payload;
      }
    }
  }

  next();
}