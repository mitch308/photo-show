import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 加载环境变量 - 必须在其他模块之前
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ApiResponse, errorResponse } from './types/response.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import worksRoutes from './routes/works.js';
import albumsRoutes from './routes/albums.js';
import tagsRoutes from './routes/tags.js';

const app = express();

// 中间件
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 静态文件服务 - 提供上传的文件访问
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/works', worksRoutes);
app.use('/api/albums', albumsRoutes);
app.use('/api/tags', tagsRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json(errorResponse(404, 'Not Found'));
});

// 错误处理
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json(errorResponse(1, err.message || 'Internal Server Error'));
});

export default app;