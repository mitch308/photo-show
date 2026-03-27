# Milestones

## v1.3 作品管理 UI 修复与优化 (Shipped: 2026-03-27)

**Phases completed:** 2 phases, 2 plans, 8 tasks

**Key accomplishments:**

- 作品编辑修复：后端 updateWork 方法返回完整 mediaItems，统一上传/编辑弹窗 UI，支持多文件拖拽和选择
- 作品展示修复：验证缩略图和详情页显示正常，实现灯箱左键上一张、右键下一张点击导航

---

## v1.2 UI/UX 优化与修复 (Shipped: 2026-03-27)

**Phases completed:** 5 phases, 10 plans, 22 tasks

**Key accomplishments:**

- Bug 修复：验证关于我们页面公开访问，创建 useWorkThumbnail composable 修复缩略图显示并兼容旧数据
- 作品详情页：创建 WorkDetail.vue 响应式网格布局页面，集成 vue-easy-lightbox 灯箱支持缩放/平移/旋转
- 后台筛选：作品管理支持标题搜索和状态筛选，相册/标签支持名称搜索，分享支持客户和类型筛选
- 布局优化：侧边栏独立滚动（min-height: 0 技巧），系统设置卡片宽度自适应
- 样式统一：Shares.vue 和 Clients.vue 转换为 Element Plus 组件，移除 700+ 行自定义 CSS

---

## v1.1 增强与修复 (Shipped: 2026-03-26)

**Phases completed:** 6 phases, 14 plans, 45 tasks

**Key accomplishments:**

- 文件存储优化：MD5 去重、智能缩略图生成
- 作品信息增强：列表显示文件数量和总大小，后台侧边栏前台入口
- 作品文件管理：添加/删除文件功能
- 工作室介绍：wangEditor 富文本编辑器、sanitize-html XSS 防护
- 相册分享：支持分享整个相册，动态获取作品

---

## v1.0 摄影工作室作品展示平台 (Shipped: 2026-03-25)

**Phases completed:** 6 phases, 27 plans, 70 tasks

**Key accomplishments:**

- Public API endpoints for accessing works, albums, and tags without authentication, with search and filter capabilities
- Share service with crypto-secure tokens, Redis TTL storage, and admin management endpoints for private link generation and original file download.
- Public gallery frontend with CSS Grid masonry layout, lightbox, URL-synced filters, and infinite scroll pagination
- Complete private sharing workflow with client-facing share page, original file download, and admin share link management interface.
- Client 模型和访问日志数据模型，支持客户管理和私密链接访问追踪
- Batch operations, statistics, client management, and share link enhancements APIs
- Frontend batch operations UI with checkbox selection, batch action bar, and statistics display
- Client management UI and enhanced share link creation with access logs and limits
- 深色/浅色主题切换功能实现，使用 VueUse 和 CSS 变量，支持 localStorage 持久化
- MediaItem model created with multi-media support, Work model updated with OneToMany relationship, migration script ready for data migration
- Updated backend API routes to support the new Work → MediaItem structure with full CRUD operations, multiple file upload, and backward compatibility.
- Database migration infrastructure and test verification for MediaItem model

---
