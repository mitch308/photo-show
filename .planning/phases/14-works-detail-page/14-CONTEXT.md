# Phase 14: 作品详情页 - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

实现作品详情页，让用户可以查看作品的所有媒体文件。点击作品卡片进入详情页，详情页以网格布局展示作品的所有媒体文件，用户可在灯箱中查看文件（支持缩放、平移、旋转）。

**交付内容：**
- GALL-01: 用户可点击作品卡片进入作品详情页
- GALL-02: 详情页以网格布局展示作品的所有媒体文件
- GALL-03: 用户可在灯箱中查看文件（支持缩放、平移、旋转）

**不包含：**
- 作品下载功能（公开画廊无需下载）
- 作品编辑功能（管理后台功能）
- 评论/收藏等互动功能

</domain>

<decisions>
## Implementation Decisions

### 详情页入口（GALL-01）

- **D-01:** 创建独立的 WorkDetail 页面，路由 `/work/:id`
  - 理由：支持 URL 分享、浏览器历史记录、更好的 SEO
  - 点击作品卡片导航到详情页，而非打开 Modal

- **D-02:** 作品卡片点击行为：从 Lightbox 改为路由导航
  - 保留 Lightbox 组件用于详情页内的文件预览
  - 更新 Home.vue 点击处理逻辑

- **D-03:** 详情页返回时保持画廊滚动位置
  - 使用 keep-alive 或存储滚动位置

### 详情页布局（GALL-02）

- **D-04:** 网格布局展示作品的 mediaItems
  - 使用 CSS Grid，响应式列数
  - 移动端 2 列，平板 3 列，桌面 4 列

- **D-05:** 详情页显示作品元数据
  - 标题、描述、标签
  - 文件数量、总大小
  - 创建时间

- **D-06:** 单文件作品也显示详情页
  - 保持一致的用户体验
  - 点击图片打开灯箱

### 灯箱增强（GALL-03）

- **D-07:** 使用 vue-easy-lightbox 库
  - 理由：ROADMAP 风险缓解建议，支持缩放/平移/旋转
  - 轻量、Vue 3 兼容、功能完整

- **D-08:** 灯箱功能支持：
  - 缩放（鼠标滚轮、双击、按钮）
  - 平移（拖拽）
  - 旋转（按钮）
  - 键盘导航（左右箭头、ESC 关闭）

- **D-09:** 灯箱显示文件信息
  - 文件名、文件大小
  - 当前位置（第 N/M 个）

### 后端 API

- **D-10:** 复用现有公开 API：`GET /api/public/works/:id`
  - 返回作品详情，包含 mediaItems
  - 验证 isPublic=true

### Claude's Discretion

- 网格间距、卡片圆角等样式细节
- 灯箱工具栏布局
- 加载状态和骨架屏
- 错误页面样式（作品不存在）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 需求文档
- `.planning/REQUIREMENTS.md` — GALL-01, GALL-02, GALL-03 详细需求

### 技术栈文档
- `.planning/research/STACK.md` — Vue 3 框架

### 现有实现参考
- `.planning/phases/03-公开展示与私密分享/03-CONTEXT.md` — 公开画廊决策
- `frontend/src/views/Home.vue` — 当前首页实现
- `frontend/src/components/gallery/Lightbox.vue` — 当前灯箱组件
- `frontend/src/components/gallery/MasonryGrid.vue` — 瀑布流组件
- `frontend/src/components/gallery/WorkCard.vue` — 作品卡片组件
- `frontend/src/views/Share.vue` — 多媒体下载参考
- `frontend/src/api/types.ts` — Work 和 MediaItem 类型定义
- `backend/src/routes/public.ts` — 公开 API

### 数据模型
- `backend/src/models/Work.ts` — Work 模型
- `backend/src/models/MediaItem.ts` — MediaItem 模型

</canonical_refs>

<code_context>
## Existing Code Insights

### 可复用资产

**Frontend:**
- `Lightbox.vue` — 现有灯箱组件（需增强或替换）
- `MasonryGrid.vue` — 瀑布流布局参考
- `WorkCard.vue` — 作品卡片样式参考
- `useWorkThumbnail.ts` — 缩略图获取逻辑
- Vue Router — 已配置，可添加新路由

**Backend:**
- `/api/public/works/:id` — 已有公开作品详情 API
- `/api/public/works/:id/view` — 浏览量记录

### 需要创建的内容

**Frontend:**
- `views/WorkDetail.vue` — 作品详情页
- 替换或增强 `components/gallery/Lightbox.vue` — 使用 vue-easy-lightbox
- 更新 `router/index.ts` — 添加 `/work/:id` 路由
- 更新 `views/Home.vue` — 点击卡片导航到详情页

### 集成点

- Home.vue 点击 WorkCard → 路由导航到 WorkDetail
- WorkDetail 显示 mediaItems 网格
- 点击 mediaItem → 打开增强灯箱
- 灯箱内支持左右导航浏览所有 mediaItems

</code_context>

<specifics>
## Specific Ideas

- 详情页风格与公开画廊保持一致
- 网格布局视觉冲击力强，突出作品本身
- 灯箱工具栏简洁易用
- 移动端触摸手势友好（缩放、平移）

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-works-detail-page*
*Context gathered: 2026-03-26*