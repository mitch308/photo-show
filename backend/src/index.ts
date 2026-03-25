import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 加载环境变量
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import app from './app.js';
import { initDatabase } from './config/database.js';
import { initRedis } from './config/redis.js';
import { authService } from './services/authService.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  try {
    // 初始化数据库
    console.log('🔄 Connecting to database...');
    await initDatabase();
    console.log('✅ Database connected');

    // 初始化默认管理员
    await authService.initDefaultAdmin();

    // 初始化 Redis
    console.log('🔄 Connecting to Redis...');
    await initRedis();
    console.log('✅ Redis connected');

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();