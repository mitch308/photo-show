import { getDataSource } from '../config/database.js';
import { Admin } from '../models/Admin.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, getTokenExpiresInSeconds } from '../utils/jwt.js';
import { jwtBlacklist } from '../config/redis.js';
import { randomUUID } from 'crypto';

export interface LoginResult {
  user: {
    id: string;
    username: string;
    email: string | null;
  };
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

class AuthService {
  private getAdminRepository() {
    return getDataSource().getRepository(Admin);
  }

  /**
   * 登录
   */
  async login(username: string, password: string): Promise<LoginResult> {
    const repo = this.getAdminRepository();
    
    // 查找用户
    const admin = await repo.findOne({ where: { username } });
    if (!admin) {
      throw new Error('用户名或密码错误');
    }

    // 验证密码
    const isValid = await verifyPassword(password, admin.password);
    if (!isValid) {
      throw new Error('用户名或密码错误');
    }

    // 生成 Token
    const accessToken = generateAccessToken(admin.id, admin.username);
    const refreshToken = generateRefreshToken(admin.id, admin.username);

    return {
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
      },
      accessToken,
      refreshToken,
      accessTokenExpiresIn: getTokenExpiresInSeconds(accessToken),
      refreshTokenExpiresIn: getTokenExpiresInSeconds(refreshToken),
    };
  }

  /**
   * 退出登录
   */
  async logout(accessToken: string): Promise<void> {
    const expiresInSeconds = getTokenExpiresInSeconds(accessToken);
    if (expiresInSeconds > 0) {
      await jwtBlacklist.add(accessToken, expiresInSeconds);
    }
  }

  /**
   * 刷新 Token
   */
  async refreshToken(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // 检查黑名单
    const isBlacklisted = await jwtBlacklist.has(oldRefreshToken);
    if (isBlacklisted) {
      throw new Error('Token 已失效');
    }

    // 验证 Refresh Token
    const payload = await import('../utils/jwt.js').then(m => m.verifyToken(oldRefreshToken));
    if (!payload || payload.type !== 'refresh') {
      throw new Error('无效的 Refresh Token');
    }

    // 将旧的 Refresh Token 加入黑名单
    const expiresInSeconds = getTokenExpiresInSeconds(oldRefreshToken);
    if (expiresInSeconds > 0) {
      await jwtBlacklist.add(oldRefreshToken, expiresInSeconds);
    }

    // 生成新的 Token
    const accessToken = generateAccessToken(payload.userId, payload.username);
    const refreshToken = generateRefreshToken(payload.userId, payload.username);

    return { accessToken, refreshToken };
  }

  /**
   * 获取当前用户
   */
  async getCurrentUser(userId: string): Promise<{ id: string; username: string; email: string | null } | null> {
    const repo = this.getAdminRepository();
    const admin = await repo.findOne({ where: { id: userId } });
    
    if (!admin) return null;
    
    return {
      id: admin.id,
      username: admin.username,
      email: admin.email,
    };
  }

  /**
   * 初始化默认管理员
   */
  async initDefaultAdmin(): Promise<void> {
    const repo = this.getAdminRepository();
    const count = await repo.count();
    
    if (count === 0) {
      const hashedPassword = await hashPassword('admin123');
      const admin = new Admin();
      admin.id = randomUUID();
      admin.username = 'admin';
      admin.password = hashedPassword;
      admin.email = '';
      await repo.save(admin);
      console.log('✅ Default admin created: admin / admin123');
    }
  }
}

export const authService = new AuthService();