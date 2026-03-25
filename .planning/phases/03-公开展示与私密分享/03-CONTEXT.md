# Phase 3: 公开展示与私密分享 - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning (gray areas resolved)

<domain>
## Phase Boundary

实现公开画廊和私密链接分享功能，让客户可以查看和下载作品。

**交付内容：**
- 公开画廊首页（瀑布流展示）
- 按相册/标签筛选作品
- 作品搜索功能
- 移动端响应式适配
- 私密链接生成（管理员端）
- 私密链接访问（客户端）
- 高清无水印原图下载
- 链接过期机制

**不包含：**
- 批量上传（Phase 4）
- 统计展示（Phase 4）
- 客户管理（Phase 4）
- 主题切换（Phase 4）

</domain>

<decisions>
## Implementation Decisions

### 公开画廊

- **D-01:** 瀑布流使用 CSS Grid 实现，无需第三方库
  - 理由：纯 CSS 方案轻量，性能好，支持响应式

- **D-02:** 公开 API 不需要认证，但需要验证作品 isPublic=true
  - 理由：访客无需登录，简化访问流程

- **D-03:** 首页加载 20 张作品，滚动加载更多（无限滚动）
  - 理由：平衡首屏性能和用户体验

- **D-04:** 图片懒加载使用 Intersection Observer API
  - 理由：原生支持，性能最佳

### 筛选和搜索

- **D-05:** 筛选状态通过 URL 参数同步（?album=xxx&tag=xxx&search=xxx）
  - 理由：支持分享、书签、刷新保持状态

- **D-06:** 搜索使用数据库 LIKE 查询，Phase 4 可升级为全文搜索
  - 理由：初期简单实现，满足小规模数据需求

### 移动端适配

- **D-07:** 响应式断点：
  - 移动端：< 768px（单列瀑布流）
  - 平板：768px - 1024px（2列）
  - 桌面：> 1024px（3-4列）

- **D-08:** 移动端隐藏次要信息（如描述），保留核心展示

### 私密链接

- **D-09:** Token 使用 crypto.randomBytes(32).toString('base64url')
  - 理由：加密安全，适合 URL，不可预测

- **D-10:** Token 存储在 Redis，使用 TTL 实现自动过期
  - 格式：`share:{token}` → JSON.stringify({ workIds: string[], expiresAt: number })

- **D-11:** 默认过期时间 7 天，管理员可选择 1/7/30 天或自定义

- **D-12:** 私密链接支持选择多个作品，生成一个分享链接

### 原图下载

- **D-13:** 下载原图需要验证 token 有效性
  - 公开展示的作品显示带水印版本
  - 私密链接客户可下载无水印原图

- **D-14:** 下载 API：GET /api/share/{token}/download/{workId}
  - 验证 token 有效性
  - 验证 workId 在 token 关联的作品列表中
  - 返回原始文件流

### 作品详情

- **D-15:** 点击作品打开 Lightbox/Modal 查看大图
  - 显示标题、描述、拍摄信息
  - 前后导航浏览

- **D-16:** 管理员在后台可以预览链接、复制链接、使链接失效

### 灰色决策（已确认）

- **D-17:** 瀑布流使用响应式列宽（CSS Grid auto-fill），自动适应屏幕宽度
- **D-18:** 首页仅显示作品瀑布流，相册通过筛选访问
- **D-19:** 私密链接预览带水印，下载无水印原图
- **D-20:** 移动端使用顶部下拉筛选

### Claude's Discretion

- 瀑布流 CSS 具体间距参数（建议 16px）
- Lightbox 组件交互细节
- 错误页面设计（链接过期、作品不存在）
- 加载状态和骨架屏

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 技术栈文档
- `.planning/research/STACK.md` — 前端框架、CSS 方案
- `.planning/research/ARCHITECTURE.md` — 私密链接访问流程、系统架构
- `.planning/research/PITFALLS.md` — 私密链接安全隐患、懒加载

### 需求文档
- `.planning/REQUIREMENTS.md` — PUBL-01~07, PRIV-01~04 详细需求

### 项目约束
- `.planning/PROJECT.md` — 响应式支持、UI 风格

### Phase 2 上下文
- `.planning/phases/02-作品管理功能/02-CONTEXT.md` — 作品数据结构、水印策略

</canonical_refs>

<code_context>
## Existing Code Insights

### 已有的基础设施（Phase 1 & 2）

**Backend:**
- `src/app.ts` — Express 应用，已有 /api/works 等路由
- `src/models/Work.ts` — 作品实体，包含 isPublic、viewCount、downloadCount
- `src/models/Album.ts` — 相册实体
- `src/models/Tag.ts` — 标签实体
- `src/services/workService.ts` — 作品服务，已有筛选逻辑
- `src/routes/works.ts` — 作品路由（需认证）
- `src/config/redis.ts` — Redis 客户端，已有 JWT 黑名单实现
- `src/services/imageService.ts` — 图片处理（水印）

**Frontend:**
- `src/router/index.ts` — 已有首页路由 `/`
- `src/views/Home.vue` — 首页占位符（需实现）
- `src/views/admin/Works.vue` — 作品管理页面
- `src/stores/works.ts` — 作品状态管理
- `src/api/works.ts` — 作品 API

### 需要创建的内容

**Backend:**
- `src/routes/public.ts` — 公开 API（无需认证）
- `src/routes/share.ts` — 私密分享 API
- `src/services/shareService.ts` — 分享链接服务
- 更新 `src/services/workService.ts` — 添加搜索、浏览计数

**Frontend:**
- `src/views/Home.vue` — 公开画廊首页（重写）
- `src/views/Gallery.vue` — 相册详情页
- `src/views/Share.vue` — 私密链接页面
- `src/components/gallery/MasonryGrid.vue` — 瀑布流组件
- `src/components/gallery/WorkCard.vue` — 作品卡片
- `src/components/gallery/Lightbox.vue` — 图片灯箱
- `src/components/gallery/FilterBar.vue` — 筛选栏
- `src/api/public.ts` — 公开 API
- `src/api/share.ts` — 分享 API
- `src/stores/gallery.ts` — 画廊状态
- `src/stores/share.ts` — 分享状态

</code_context>

<specifics>
## Specific Ideas

- 首页瀑布流视觉冲击力强，突出作品本身
- 筛选器简洁，不喧宾夺主
- 私密链接页面与公开画廊风格一致，但顶部提示"私密分享"
- 原图下载按钮明显但不突兀
- 链接过期页面友好提示，可引导联系摄影师

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-公开展示与私密分享*
*Context gathered: 2026-03-25*