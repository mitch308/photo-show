# Phase 15: 后台筛选 - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

为后台管理页面添加筛选功能，让管理员可以快速定位管理内容。

**交付内容：**
- AUX-01: 管理员可按标题或状态筛选作品列表
- AUX-02: 管理员可按名称筛选相册列表
- AUX-03: 管理员可按名称筛选标签列表
- AUX-04: 管理员可按客户名称或分享类型筛选分享列表

**不包含：**
- 高级组合筛选（多个条件组合）
- 筛选结果导出
- 筛选历史记录

</domain>

<decisions>
## Implementation Decisions

### 筛选 UI 风格

- **D-01:** 作品管理：两个筛选条件
  - 标题搜索：搜索框，支持模糊匹配
  - 状态筛选：下拉选择（全部/公开/私密/置顶）
  - 理由：符合 AUX-01 要求，作品有明确的标题和状态字段

- **D-02:** 相册管理：单一名称搜索
  - 搜索框，按名称模糊匹配
  - 理由：相册数量通常较少，单一搜索足够

- **D-03:** 标签管理：单一名称搜索
  - 搜索框，按名称模糊匹配
  - 理由：与相册筛选保持一致

- **D-04:** 分享管理：两个筛选条件
  - 客户筛选：下拉选择（全部/选择客户）
  - 类型筛选：下拉选择（全部/作品分享/相册分享）
  - 理由：符合 AUX-04 要求，分享有客户和类型两个维度

### 筛选交互行为

- **D-05:** 使用防抖策略，300ms 延迟
  - 参考 Clients.vue 现有实现
  - 避免频繁 API 调用

- **D-06:** 筛选条件不持久化到 URL
  - 理由：管理页面筛选通常是临时操作
  - 简化实现，无需处理 URL 参数

- **D-07:** 筛选时显示加载状态
  - 复用现有 v-loading 指令

### 后端 API 扩展

- **D-08:** 作品 API 扩展支持搜索
  - GET /api/works?title=xxx&isPublic=true/false
  - 后端需添加 title 和 isPublic 查询支持

- **D-09:** 相册 API 添加搜索参数
  - GET /api/albums?name=xxx
  - 后端需添加 name 查询支持

- **D-10:** 标签 API 已支持搜索
  - GET /api/tags?q=xxx
  - 前端只需添加搜索框并调用

- **D-11:** 分享 API 添加筛选参数
  - GET /api/admin/share?clientId=xxx&type=work/album
  - 后端需添加筛选支持

### Claude's Discretion

- 搜索框占位符文案
- 筛选下拉选项文案
- 空筛选结果提示

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 需求文档
- `.planning/REQUIREMENTS.md` — AUX-01, AUX-02, AUX-03, AUX-04 详细需求

### 现有实现参考
- `frontend/src/views/admin/Clients.vue` — 已有搜索实现（防抖模式）
- `frontend/src/views/admin/Works.vue` — 作品管理页面（待添加筛选）
- `frontend/src/views/admin/Albums.vue` — 相册管理页面（待添加筛选）
- `frontend/src/views/admin/Tags.vue` — 标签管理页面（待添加筛选）
- `frontend/src/views/admin/Shares.vue` — 分享管理页面（待添加筛选）

### 后端 API 参考
- `backend/src/routes/works.ts` — 作品 API（需扩展）
- `backend/src/routes/albums.ts` — 相册 API（需扩展）
- `backend/src/routes/tags.ts` — 标签 API（已支持 q 参数）
- `backend/src/routes/admin/share.ts` — 分享 API（需扩展）
- `backend/src/services/workService.ts` — 作品服务
- `backend/src/services/albumService.ts` — 相册服务
- `backend/src/services/tagService.ts` — 标签服务（已有 searchTags）
- `backend/src/services/shareService.ts` — 分享服务

### 前端 API 客户端
- `frontend/src/api/works.ts` — 作品 API 客户端
- `frontend/src/api/albums.ts` — 相册 API 客户端
- `frontend/src/api/tags.ts` — 标签 API 客户端
- `frontend/src/api/share.ts` — 分享 API 客户端

### 状态管理
- `frontend/src/stores/works.ts` — 作品 Store（需扩展 fetchWorks 支持搜索）

</canonical_refs>

<code_context>
## Existing Code Insights

### 可复用资产

**Frontend:**
- `Clients.vue` 搜索实现 — 300ms 防抖、watch 监听、API 调用模式
- Element Plus `el-input` 和 `el-select` 组件 — 筛选 UI
- 现有页面布局 — 筛选框可放在 page-header 区域

**Backend:**
- `tagService.searchTags()` — 已有搜索实现可参考
- `workService.getWorks()` — 已支持 albumId/tagId/isPublic 过滤

### 需要扩展的内容

**Frontend:**
- `Works.vue` — 添加标题搜索和状态筛选
- `Albums.vue` — 添加名称搜索
- `Tags.vue` — 添加名称搜索
- `Shares.vue` — 添加客户和类型筛选

**Backend:**
- `works.ts` — 添加 title 搜索参数
- `albums.ts` — 添加 name 搜索参数
- `admin/share.ts` — 添加 clientId 和 type 筛选参数

### 集成点

- 前端页面添加筛选 UI 组件
- 前端 API 客户端添加筛选参数
- 后端路由添加查询参数解析
- 后端服务添加筛选逻辑

</code_context>

<specifics>
## Specific Ideas

- 筛选框位置：放在页面标题右侧，与操作按钮同行
- 筛选交互：输入即搜索，无需点击按钮
- 样式统一：使用 Element Plus 组件保持风格一致

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-后台筛选*
*Context gathered: 2026-03-26*