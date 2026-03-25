# Phase 2: 作品管理功能 - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

实现完整的作品和相册管理，包括上传、编辑、删除、分类、水印功能。

**交付内容：**
- 照片/视频上传（拖拽 + 进度条）
- 作品 CRUD（标题、描述、标签、排序、置顶、公开展示设置）
- 相册管理（创建、编辑、删除、封面、排序）
- 自动缩略图生成（照片和视频）
- 水印添加（文字和图片）
- 后台作品管理界面

**不包含：**
- 公开展示页面（Phase 3）
- 批量上传功能（Phase 4）
- 私密链接分享（Phase 3）

</domain>

<decisions>
## Implementation Decisions

### 上传功能

- **D-01:** 上传交互采用拖拽 + 点击选择，显示上传进度条
- **D-02:** 单个文件大小限制默认 50MB，支持通过配置修改
- **D-03:** 视频支持扩展格式：mp4、webm、MOV、AVI 等专业相机格式
- **D-04:** 视频上传后自动生成缩略图预览

### 缩略图生成

- **D-05:** 生成 2 种尺寸缩略图：
  - 小图：300px（用于列表、缩略图）
  - 大图：1200px（用于预览、详情页）

### 水印功能

- **D-06:** 水印功能默认开启，所有公开展示的作品自动添加水印
- **D-07:** 支持文字水印和图片水印两种类型
- **D-08:** 水印位置可选 5 个：左上、右上、左下、右下、居中
- **D-09:** 水印透明度可配置

### 文件存储

- **D-10:** 文件按年月目录存储：`uploads/works/YYYY-MM/`
- **D-11:** 文件名使用 UUID 避免冲突

### 相册管理

- **D-12:** 一个作品可以属于多个相册（多对多关系）
- **D-13:** 删除相册时，作品可选择移出或一并删除
- **D-14:** 相册封面可设置，默认使用相册中第一个作品

### 标签管理

- **D-15:** 采用预设标签模式，管理员创建、编辑、删除标签
- **D-16:** 作品可以选择已有的标签

### 作品排序

- **D-17:** 作品和相册支持拖拽排序
- **D-18:** 作品可以设置置顶，置顶作品排在最前

### 后台界面

- **D-19:** 作品管理使用表格视图（缩略图、标题、状态、操作按钮）
- **D-20:** 删除操作需要确认对话框

### Claude's Discretion

- 数据库表结构设计（Works、Albums、Tags 及关联表）
- Multer 上传中间件配置
- Sharp 图片处理参数
- FFmpeg 视频缩略图提取

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 技术栈文档
- `.planning/research/STACK.md` — Sharp、Multer、FFmpeg 使用说明
- `.planning/research/ARCHITECTURE.md` — 项目结构建议
- `.planning/research/PITFALLS.md` — 大文件上传、图片处理阻塞等陷阱

### 需求文档
- `.planning/REQUIREMENTS.md` — WORK-01~11, ALBM-01~05, WATR-01~03 详细需求

### 项目约束
- `.planning/PROJECT.md` — 技术栈约束和设计决策

### Phase 1 上下文
- `.planning/phases/01-项目基础架构/01-CONTEXT.md` — API 响应格式、认证中间件等

</canonical_refs>

<code_context>
## Existing Code Insights

### 已有的基础设施（Phase 1）
- **Backend:**
  - `src/app.ts` — Express 应用配置
  - `src/config/database.ts` — TypeORM MySQL 连接
  - `src/middlewares/auth.ts` — JWT 认证中间件
  - `src/models/Admin.ts` — Admin 实体模型
  - `src/types/response.ts` — 统一响应格式

- **Frontend:**
  - `src/router/index.ts` — Vue Router 配置，已有 `/admin` 路由
  - `src/stores/auth.ts` — Pinia auth store
  - `src/api/index.ts` — Axios 配置

### 需要创建的内容
- **Backend:**
  - `src/models/Work.ts` — 作品实体
  - `src/models/Album.ts` — 相册实体
  - `src/models/Tag.ts` — 标签实体
  - `src/routes/works.ts` — 作品 API 路由
  - `src/routes/albums.ts` — 相册 API 路由
  - `src/routes/upload.ts` — 上传 API 路由
  - `src/services/uploadService.ts` — 文件上传处理
  - `src/services/imageService.ts` — 图片处理（缩略图、水印）
  - `src/services/videoService.ts` — 视频处理（缩略图）

- **Frontend:**
  - `src/views/admin/Works.vue` — 作品管理页面
  - `src/views/admin/Albums.vue` — 相册管理页面
  - `src/views/admin/Tags.vue` — 标签管理页面
  - `src/components/Upload.vue` — 上传组件
  - `src/stores/works.ts` — 作品状态管理
  - `src/api/works.ts` — 作品 API
  - `src/api/albums.ts` — 相册 API

</code_context>

<specifics>
## Specific Ideas

- 上传体验要流畅，支持拖拽和进度显示
- 水印功能要灵活，支持文字和图片
- 相册可以跨相册包含同一作品
- 后台管理界面简洁实用，表格视图便于管理大量作品

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-作品管理功能*
*Context gathered: 2026-03-25*