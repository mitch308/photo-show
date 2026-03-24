# Architecture Research

**Domain:** Photography Studio Portfolio Platform
**Researched:** 2026-03-24
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Vue3 SPA)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  | Public  |  | Admin   |  | Private |  | Shared  |        │
│  | Gallery |  | Panel   |  | Gallery |  | Comp    |        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
├───────┴────────────┴────────────┴────────────┴──────────────┤
│                     Backend API (Node/Express)               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  |  Routes → Controllers → Services → Repositories     |    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                      Data Layer                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  |  MySQL   |  |  Redis   |  |  Files   |                   │
│  |  (Data)  |  |  (Cache) |  | (Uploads)|                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Public Gallery | Display works, albums, search | Vue Router + lazy loading |
| Admin Panel | Upload, manage, statistics | Element Plus components |
| Private Gallery | Token-authenticated viewing | Route guard + token validation |
| API Routes | HTTP endpoints, validation | Express Router |
| Services | Business logic, processing | TypeScript classes |
| Repositories | Data access, queries | TypeORM repositories |

## Recommended Project Structure

```
photo-show/
├── frontend/                    # Vue3 前端应用
│   ├── src/
│   │   ├── views/              # 页面组件
│   │   │   ├── public/         # 公开展示页面
│   │   │   ├── admin/          # 管理后台页面
│   │   │   └── private/        # 私密链接页面
│   │   ├── components/         # 可复用组件
│   │   │   ├── gallery/        # 画廊相关组件
│   │   │   ├── upload/         # 上传相关组件
│   │   │   └── common/         # 通用组件
│   │   ├── stores/             # Pinia 状态管理
│   │   ├── api/                # API 请求封装
│   │   ├── router/             # 路由配置
│   │   ├── composables/        # 组合式函数
│   │   ├── utils/              # 工具函数
│   │   └── styles/             # 全局样式
│   ├── public/                 # 静态资源
│   └── vite.config.ts
│
├── backend/                     # Node 后端应用
│   ├── src/
│   │   ├── routes/             # 路由定义
│   │   │   ├── auth.ts         # 认证路由
│   │   │   ├── works.ts        # 作品管理
│   │   │   ├── albums.ts       # 相册管理
│   │   │   ├── upload.ts       # 文件上传
│   │   │   ├── share.ts        # 分享链接
│   │   │   └── stats.ts        # 统计数据
│   │   ├── controllers/        # 控制器
│   │   ├── services/           # 业务逻辑
│   │   ├── repositories/       # 数据访问
│   │   ├── models/             # TypeORM 实体
│   │   ├── middlewares/        # 中间件
│   │   │   ├── auth.ts         # JWT 验证
│   │   │   ├── upload.ts       # 文件上传处理
│   │   │   └── errorHandler.ts # 错误处理
│   │   ├── utils/              # 工具函数
│   │   ├── types/              # TypeScript 类型
│   │   └── config/             # 配置文件
│   ├── uploads/                # 上传文件存储
│   └── vite.config.ts
│
└── shared/                      # 前后端共享代码
    └── types/                  # 共享类型定义
```

### Structure Rationale

- **frontend/src/views/**: 按访问权限分目录，清晰区分公开/管理/私密页面
- **backend/src/routes/**: RESTful 路由，每个资源一个文件
- **backend/src/services/**: 业务逻辑集中，便于测试和复用
- **shared/types/**: 前后端共享类型，保证 API 一致性

## Architectural Patterns

### Pattern 1: Repository Pattern

**What:** 数据访问层抽象，隔离业务逻辑和数据库操作
**When to use:** 需要清晰的分层架构，便于测试和切换数据源
**Trade-offs:** 增加代码量，但提高可维护性

**Example:**
```typescript
// repositories/WorkRepository.ts
export class WorkRepository {
  constructor(private dataSource: DataSource) {}
  
  async findById(id: number): Promise<Work | null> {
    return this.dataSource.getRepository(Work).findOne({ 
      where: { id },
      relations: ['album', 'tags']
    });
  }
  
  async findPublic(limit: number, offset: number): Promise<[Work[], number]> {
    return this.dataSource.getRepository(Work).findAndCount({
      where: { isPublic: true },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset
    });
  }
}
```

### Pattern 2: Service Layer

**What:** 业务逻辑封装，协调多个 Repository
**When to use:** 复杂业务规则，事务处理
**Trade-offs:** 多一层抽象，但职责清晰

**Example:**
```typescript
// services/WorkService.ts
export class WorkService {
  constructor(
    private workRepo: WorkRepository,
    private fileService: FileService
  ) {}
  
  async uploadWork(file: Express.Multer.File, metadata: WorkMetadata): Promise<Work> {
    // 1. 处理文件（缩略图、水印）
    const processed = await this.fileService.processImage(file);
    
    // 2. 创建数据库记录
    const work = await this.workRepo.create({
      ...metadata,
      filePath: processed.path,
      thumbnailPath: processed.thumbnail,
    });
    
    return work;
  }
}
```

### Pattern 3: Token-based Private Access

**What:** 使用随机 token 实现私密链接访问控制
**When to use:** 无需用户系统的临时访问授权
**Trade-offs:** Token 泄露风险，需要过期机制

## Data Flow

### Request Flow

```
[用户访问]
    ↓
[Vue Router] → [组件加载] → [API调用]
    ↓              ↓           ↓
[响应数据] ← [状态更新] ← [Axios请求]
```

### Upload Flow

```
[选择文件]
    ↓
[前端预览/验证] → [FormData封装] → [POST /api/upload]
    ↓                                       ↓
[进度显示]                          [Multer接收]
                                           ↓
                                    [Sharp处理]
                                           ↓
                                    [保存到uploads/]
                                           ↓
                                    [数据库记录]
                                           ↓
                                    [返回文件信息]
```

### Private Link Access Flow

```
[用户点击私密链接]
    ↓
[解析token] → [Redis查询token有效性] → [返回关联的作品IDs]
    ↓                    ↓
[token有效]         [token无效/过期]
    ↓                    ↓
[加载作品列表]      [显示错误页面]
```

### Key Data Flows

1. **作品上传流程:** 前端选择文件 → 验证 → 后端接收 → 图片处理 → 存储 → 数据库记录
2. **私密分享流程:** 管理员创建链接 → 生成token → 存入Redis → 返回URL → 客户访问验证
3. **统计记录流程:** 页面加载 → 发送访问事件 → Redis计数 → 定期同步到MySQL

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k 访问/天 | 单服务器部署，MySQL + Redis 同机 |
| 1k-10k 访问/天 | Nginx 反向代理，静态文件 CDN |
| 10k+ 访问/天 | 文件存储分离（OSS/NAS），读写分离 |

### Scaling Priorities

1. **First bottleneck:** 图片加载速度 → CDN 加速静态资源
2. **Second bottleneck:** 数据库查询 → Redis 缓存热点数据

## Anti-Patterns

### Anti-Pattern 1: 同步处理大文件

**What people do:** 上传时同步处理图片，阻塞请求
**Why it's wrong:** 大文件处理耗时，用户体验差，服务器压力大
**Do this instead:** 异步处理队列，先返回临时ID，处理完成通知

### Anti-Pattern 2: 前端直接访问数据库

**What people do:** 前端直接调用 MySQL（常见于小程序）
**Why it's wrong:** 安全风险，无法做权限控制
**Do this instead:** 所有数据访问通过后端 API

### Anti-Pattern 3: 文件路径存储错误

**What people do:** 存储绝对路径（/home/user/uploads/xxx.jpg）
**Why it's wrong:** 迁移时路径失效
**Do this instead:** 存储相对路径或生成唯一文件名

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Redis | ioredis client | 连接池，重试机制 |
| MySQL | TypeORM connection | 连接池配置 |
| File System | fs-extra | 上传目录权限检查 |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend ↔ Backend | REST API | JSON, 统一响应格式 |
| Backend ↔ MySQL | TypeORM | Repository 模式 |
| Backend ↔ Redis | ioredis | 缓存、会话、计数 |

## Sources

- Vue 3 官方文档 — 组合式 API 最佳实践
- TypeORM 文档 — Repository 模式
- Node.js 最佳实践 — 错误处理、文件上传
- 个人经验 — 摄影平台开发实践

---
*Architecture research for: Photography Studio Portfolio Platform*
*Researched: 2026-03-24*