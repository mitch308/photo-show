# Phase 13: Bug 修复 - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

修复两个影响用户体验的 bug：关于我们页面访问权限问题和作品缩略图显示问题。

**交付内容：**
- BUG-01: 确保访客无需登录即可访问"关于我们"页面
- BUG-02: 作品缩略图正确显示（使用第一个 mediaItem，兼容旧数据）

**不包含：**
- 其他 UI 优化（Phase 14-17）
- 新功能开发
- 性能优化

</domain>

<decisions>
## Implementation Decisions

### BUG-01: 关于我们页面访问权限

**现状分析：**
- 路由配置：`/about` 路由无 `requiresAuth: true`（已正确）
- 后端 API：`/api/settings/studio` 无 `authMiddleware`（已正确）
- API 拦截器：仅在 401 时重定向登录

**D-01:** 验证并测试关于我们页面的公开访问功能
- 确认前端路由无认证要求
- 确认后端 API 无认证要求
- 如发现问题则修复

### BUG-02: 作品缩略图显示

**现状分析：**
- WorkCard.vue 直接使用 `work.thumbnailLarge`
- Phase 6 重构后，作品使用 `mediaItems` 数组
- 旧数据可能仍使用 Work 级别的 `thumbnailLarge`
- 新数据需要从 `mediaItems[0].thumbnailLarge` 获取

**D-02:** 创建 `useWorkThumbnail` composable
- 优先使用 `work.mediaItems[0].thumbnailLarge`
- 降级使用 `work.thumbnailLarge`（兼容旧数据）
- 处理空数据情况（显示占位图）

**D-03:** 更新 WorkCard.vue 使用 composable
- 替换直接属性访问
- 保持现有样式和交互

**D-04:** 更新其他使用缩略图的组件
- 检查 MasonryGrid.vue、Lightbox.vue 等
- 确保一致的缩略图获取逻辑

### Claude's Discretion

- 占位图的样式和内容
- 错误处理的详细程度
- 日志记录方式

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 需求文档
- `.planning/REQUIREMENTS.md` — BUG-01, BUG-02 详细需求

### 现有实现参考
- `frontend/src/router/index.ts` — 路由配置和认证守卫
- `frontend/src/views/About.vue` — 关于我们页面
- `frontend/src/api/index.ts` — API 拦截器
- `backend/src/routes/settings.ts` — 设置 API（/api/settings/studio）
- `frontend/src/components/gallery/WorkCard.vue` — 作品卡片组件
- `frontend/src/api/types.ts` — Work 和 MediaItem 类型定义
- `backend/src/models/Work.ts` — Work 模型（含 deprecated 字段说明）
- `backend/src/models/MediaItem.ts` — MediaItem 模型

### 数据模型
- Work.thumbnailLarge (deprecated) — 旧数据兼容
- Work.mediaItems[].thumbnailLarge — 新数据结构

</canonical_refs>

<code_context>
## Existing Code Insights

### 可复用资产

**Frontend:**
- Vue 3 Composition API — 适合创建 composable
- Element Plus — 可使用 el-image 组件处理图片加载
- 现有 composables 目录结构

### 需要修改的文件

**BUG-01:**
- 可能需要检查：`frontend/src/router/index.ts`
- 可能需要检查：`frontend/src/api/index.ts`
- 可能需要检查：`backend/src/routes/settings.ts`

**BUG-02:**
- 新建：`frontend/src/composables/useWorkThumbnail.ts`
- 修改：`frontend/src/components/gallery/WorkCard.vue`
- 可能修改：其他使用 work.thumbnailLarge 的组件

### 集成点

- WorkCard 在 MasonryGrid 中使用
- Lightbox 也可能需要缩略图逻辑
- 后台作品列表（Works.vue）使用 thumbnailSmall

</code_context>

<specifics>
## Specific Ideas

- useWorkThumbnail composable 返回计算后的缩略图 URL
- 处理 mediaItems 为空数组的情况
- 处理 mediaItems[0].thumbnailLarge 为 null 的情况
- 占位图可使用 Element Plus 的默认图片占位或自定义 SVG

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-bug-修复*
*Context gathered: 2026-03-26*