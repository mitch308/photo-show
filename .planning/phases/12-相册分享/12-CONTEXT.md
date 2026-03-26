# Phase 12: 相册分享 - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

管理员可以生成私密链接分享整个相册，客户通过私密链接可以查看相册中的所有作品并下载原图。

**交付内容：**
- 相册分享 API（后端）
- 相册分享入口（前端管理页面）
- 相册分享页面（客户端访问页面）

**不包含：**
- 作品级分享（Phase 3 已实现）
- 访问次数限制增强
- 批量相册分享

</domain>

<decisions>
## Implementation Decisions

### 分享 Token 结构

- **D-01:** 复用现有 ShareTokenData 结构，添加 albumId 和 albumName 字段
  - 理由：保持与现有分享机制一致，albumName 便于管理端显示

- **D-02:** 相册分享存储 albumId，访问时动态获取作品
  - 理由：客户始终看到相册最新内容，无需重新生成链接

- **D-03:** 扩展 shareService，添加 createAlbumShare 方法
  - 理由：复用现有逻辑，避免重复代码

### 后端 API

- **D-04:** 新增 POST /api/admin/share/album 端点
  - Body: { albumId, expiresInDays?, clientId?, maxAccess? }
  - 返回: { token, shareUrl, albumId, albumName, expiresAt }

- **D-05:** 新增 GET /api/album-share/:token 端点
  - 返回: { token, album, works, expiresAt }
  - 区分于作品分享，返回格式包含相册信息

- **D-06:** 新增相册分享下载 API
  - GET /api/album-share/:token/download/:workId
  - GET /api/album-share/:token/download/:workId/media/:mediaId

### 前端管理入口

- **D-07:** 在相册管理页面添加"分享相册"按钮
  - 位置：相册列表每行的操作按钮区域
  - 点击打开分享配置对话框

- **D-08:** 分享配置对话框选项
  - 过期时间：1/7/30 天
  - 关联客户（可选）
  - 访问次数限制（可选）
  - 创建后自动复制链接

- **D-09:** 相册分享记录显示在现有 Shares.vue 页面
  - 添加"类型"列区分作品分享和相册分享
  - 显示相册名称或作品数量

### 客户端访问页面

- **D-10:** 创建 AlbumShare.vue 页面
  - 显示相册名称和描述
  - 复用瀑布流展示、灯箱、下载功能

- **D-11:** 路由: /album-share/:token
  - 区分于作品分享路由 /share/:token

### Claude's Discretion

- 对话框 UI 细节
- 错误提示文案
- 分享成功后的反馈方式

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 需求文档
- `.planning/REQUIREMENTS.md` — SHAR-01, SHAR-02, SHAR-03 详细需求

### 技术栈文档
- `.planning/research/STACK.md` — 前端框架、Redis 使用

### 现有实现参考
- `.planning/phases/03-公开展示与私密分享/03-CONTEXT.md` — 作品分享实现决策
- `backend/src/services/shareService.ts` — 现有分享服务
- `backend/src/routes/admin/share.ts` — 现有分享管理 API
- `frontend/src/views/admin/Shares.vue` — 分享管理页面
- `frontend/src/views/Share.vue` — 客户端分享页面
- `frontend/src/api/share.ts` — 分享 API 客户端

### 数据模型
- `backend/src/models/Album.ts` — 相册模型（works 关系）
- `backend/src/models/Work.ts` — 作品模型

</canonical_refs>

<code_context>
## Existing Code Insights

### 可复用资产

**Backend:**
- `shareService.ts` — 完整的 token 生成、存储、验证逻辑
- `share.ts` (routes) — 公开分享 API
- `admin/share.ts` (routes) — 分享管理 API
- Redis 连接和 TTL 机制

**Frontend:**
- `Share.vue` — 客户端分享页面（瀑布流、灯箱、下载）
- `Shares.vue` — 分享管理页面
- `share.ts` (api) — API 客户端
- `share.ts` (store) — 状态管理
- `MasonryGrid.vue` — 瀑布流组件
- `Lightbox.vue` — 图片灯箱组件

### 需要扩展的内容

**Backend:**
- `shareService.ts` — 添加 createAlbumShare 方法
- `admin/share.ts` — 添加 POST /album-share 端点
- 可能需要扩展 ShareTokenData 接口添加 albumId

**Frontend:**
- `Albums.vue` — 添加"分享相册"按钮和对话框
- `Shares.vue` — 添加类型区分显示
- `share.ts` (api) — 添加 createAlbumShare 方法

### 集成点

- 相册管理页面（Albums.vue）添加分享入口
- 分享管理页面（Shares.vue）区分显示相册分享
- 客户端分享页面（Share.vue）支持显示相册名称

</code_context>

<specifics>
## Specific Ideas

- 用户体验与作品分享保持一致
- 分享相册时显示相册名称和工作数量
- 复用现有 UI 组件保持视觉一致性

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-相册分享*
*Context gathered: 2026-03-26*