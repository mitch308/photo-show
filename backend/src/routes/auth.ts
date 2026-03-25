import { Router, Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { authMiddleware } from '../middlewares/auth.js';
import { successResponse, errorResponse, ErrorCodes } from '../types/response.js';
import { getTokenFromCookie } from '../utils/jwt.js';

const router = Router();

/**
 * POST /api/auth/login
 * 登录
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json(errorResponse(ErrorCodes.VALIDATION_ERROR, '用户名和密码不能为空'));
      return;
    }

    const result = await authService.login(username, password);

    // 设置 Cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: result.accessTokenExpiresIn * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: result.refreshTokenExpiresIn * 1000,
    });

    res.json(successResponse({ user: result.user }, '登录成功'));
  } catch (error: any) {
    res.status(401).json(errorResponse(ErrorCodes.LOGIN_FAILED, error.message));
  }
});

/**
 * POST /api/auth/logout
 * 退出登录
 */
router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = getTokenFromCookie(req.headers.cookie, 'accessToken');
    if (token) {
      await authService.logout(token);
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json(successResponse(null, '退出成功'));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

/**
 * POST /api/auth/refresh
 * 刷新 Token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = getTokenFromCookie(req.headers.cookie, 'refreshToken');

    if (!refreshToken) {
      res.status(401).json(errorResponse(ErrorCodes.TOKEN_INVALID, '未找到 Refresh Token'));
      return;
    }

    const result = await authService.refreshToken(refreshToken);

    // 设置新的 Cookie
    const accessTokenExpiresIn = 7 * 24 * 60 * 60; // 7天
    const refreshTokenExpiresIn = 30 * 24 * 60 * 60; // 30天

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: accessTokenExpiresIn * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshTokenExpiresIn * 1000,
    });

    res.json(successResponse(null, 'Token 刷新成功'));
  } catch (error: any) {
    res.status(401).json(errorResponse(ErrorCodes.TOKEN_INVALID, error.message));
  }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse(ErrorCodes.UNAUTHORIZED, '未登录'));
      return;
    }

    const user = await authService.getCurrentUser(req.user.userId);

    if (!user) {
      res.status(404).json(errorResponse(ErrorCodes.NOT_FOUND, '用户不存在'));
      return;
    }

    res.json(successResponse(user));
  } catch (error: any) {
    res.status(500).json(errorResponse(ErrorCodes.UNKNOWN, error.message));
  }
});

export default router;