# 摄影工作室作品展示平台

一个面向摄影工作室的作品展示与管理平台。摄影师可以上传、管理作品，通过公开画廊展示作品，也可生成私密链接分享给特定客户，客户可通过私密链接下载高清无水印原图。

## 核心价值

让摄影师轻松管理作品，让客户优雅地查看和获取作品。

## 功能特性

### ✅ 已实现（v1.0 & v1.1）

**作品管理**
- 上传照片和视频作品
- 批量上传支持
- 作品分类、标签、排序、置顶管理
- 作品可包含多个媒体项（图片/视频）
- 水印保护功能
- 文件去重（Fast-MD5）
- 智能缩略图生成

**相册管理**
- 创建和管理相册
- 相册分享功能

**公开展示**
- 公开画廊瀑布流布局
- 作品浏览量统计
- 深色/浅色主题切换

**私密分享**
- 生成私密链接分享给客户
- 客户可查看和下载高清无水印原图
- 私密链接支持过期时间和访问限制
- 访问记录追踪

**管理后台**
- 管理员登录认证
- 客户联系方式管理
- 作品数据统计（浏览量、下载量）
- 工作室介绍页面

### 🚧 开发中（v1.2）

- 关于我们页面无需登录访问
- 作品详情页（展示作品下所有文件）
- 后台列表筛选功能
- 布局和样式优化

## 技术栈

### 前端
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite 5
- **UI 组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **工具库**: VueUse, Axios
- **富文本编辑器**: WangEditor

### 后端
- **运行时**: Node.js 20 LTS
- **框架**: Express + TypeScript
- **ORM**: TypeORM
- **数据库**: MySQL 8.0
- **缓存**: Redis 7.2
- **认证**: JWT + bcrypt
- **文件处理**: Sharp, Fluent-FFmpeg
- **测试**: Vitest

### 部署
- **进程管理**: PM2 cluster
- **反向代理**: Nginx
- **SSL**: Let's Encrypt
- **操作系统**: Ubuntu 22.04

## 快速开始

### 环境要求

- Node.js >= 20 LTS
- MySQL >= 8.0
- Redis >= 7.2
- npm 或 pnpm

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd photo-show
```

2. **安装依赖**
```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

3. **配置环境变量**
```bash
cd ../backend
cp .env.example .env
# 编辑 .env 文件，配置数据库连接、Redis、JWT 密钥等
```

4. **初始化数据库**
```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE photo_show CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 运行迁移
npm run migration:run
```

5. **启动开发服务器**
```bash
# 后端（在 backend 目录）
npm run dev

# 前端（在 frontend 目录，新终端）
npm run dev
```

6. **访问应用**
- 前端: http://localhost:5173
- 后端 API: http://localhost:3000

## 项目结构

```
photo-show/
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── assets/         # 静态资源
│   │   ├── components/     # Vue 组件
│   │   ├── composables/    # Vue Composition API
│   │   ├── router/         # 路由配置
│   │   ├── stores/         # Pinia 状态管理
│   │   ├── types/          # TypeScript 类型定义
│   │   ├── utils/          # 工具函数
│   │   └── views/          # 页面视图
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── entities/       # TypeORM 实体
│   │   ├── middlewares/    # Express 中间件
│   │   ├── routes/         # 路由定义
│   │   ├── services/       # 业务逻辑
│   │   ├── utils/          # 工具函数
│   │   └── index.ts        # 入口文件
│   ├── migrations/         # 数据库迁移
│   └── package.json
│
├── deploy/                  # 部署脚本
│   ├── setup.sh           # 初始化部署脚本
│   ├── deploy.sh          # 更新部署脚本
│   ├── backup-mysql.sh    # 数据库备份
│   └── health-check.sh    # 健康检查
│
├── .planning/              # 项目规划文档
├── ecosystem.config.js    # PM2 配置
└── README.md
```

## 部署

详细部署说明请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 快速部署

```bash
# 运行部署设置脚本
chmod +x deploy/*.sh
./deploy/setup.sh

# 初始化数据库
cd backend
npm run migration:run

# 配置 SSL
sudo certbot --nginx -d your-domain.com
```

### 常用运维命令

```bash
# 重启应用
pm2 restart photo-show-api

# 查看日志
pm2 logs photo-show-api

# 备份数据库
./deploy/backup-mysql.sh

# 健康检查
./deploy/health-check.sh
```

## 开发指南

### 前端开发

```bash
cd frontend

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 后端开发

```bash
cd backend

# 启动开发服务器（带热重载）
npm run dev

# 构建
npm run build

# 运行测试
npm run test

# 创建迁移
npm run typeorm migration:create src/migrations/MigrationName

# 运行迁移
npm run migration:run
```

## 版本历史

- **v1.1** (2026-03-26) - 增强与修复
  - 水印功能集成
  - 文件去重和智能缩略图
  - 作品文件管理
  - 工作室介绍页面
  - 相册分享功能

- **v1.0** (2026-03-25) - 首次发布
  - 完整的作品管理系统
  - 公开展示与私密分享
  - 批量操作和统计
  - 客户管理
  - 深色/浅色主题

## 许可证

MIT License

## 贡献指南

欢迎提交 Issue 和 Pull Request。

## 联系方式

如有问题或建议，请提交 Issue。