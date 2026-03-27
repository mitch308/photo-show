# 摄影工作室作品展示平台

## What This Is

一个面向摄影工作室的作品展示与管理平台。摄影师可以上传、管理作品，通过公开画廊展示作品，也可生成私密链接分享给特定客户，客户可通过私密链接下载高清无水印原图。

## Core Value

让摄影师轻松管理作品，让客户优雅地查看和获取作品。

## Requirements

### Validated

- [x] 管理员可以使用用户名密码登录后台 — v1.0 Phase 1: AUTH-01
- [x] 登录状态在浏览器关闭后保持 — v1.0 Phase 1: AUTH-02
- [x] 管理员可以安全退出登录 — v1.0 Phase 1: AUTH-03
- [x] 管理员可以上传照片和视频作品 — v1.0 Phase 2: WORK-01~02
- [x] 管理员可以创建和管理相册 — v1.0 Phase 2: ALBM-01~05
- [x] 管理员可以对作品进行分类、标签、排序、置顶管理 — v1.0 Phase 2: WORK-03~07
- [x] 管理员可以为作品添加水印保护 — v1.0 Phase 2: WATR-01~03
- [x] 访客可以在公开画廊浏览作品 — v1.0 Phase 3: PUBL-01~07
- [x] 管理员可以生成私密链接分享给客户 — v1.0 Phase 3: PRIV-01~02
- [x] 客户通过私密链接可以查看和下载高清无水印原图 — v1.0 Phase 3: PRIV-03~04
- [x] 管理员可以批量上传作品 — v1.0 Phase 4: BATCH-01~04
- [x] 管理员可以查看作品数据统计（浏览量、下载量）— v1.0 Phase 4: STAT-01~04
- [x] 管理员可以查看私密链接访问记录 — v1.0 Phase 4: PRIV-05
- [x] 管理员可以管理客户联系方式和备注 — v1.0 Phase 4: CLNT-01~04
- [x] 用户可以切换深色/浅色主题 — v1.0 Phase 4: THEM-01~03
- [x] 作品可以包含多个媒体项（图片/视频）— v1.0 Phase 6: DATA-01~08
- [x] 水印功能集成，公开展示显示水印，私密下载返回原图 — v1.1 Phase 7: BUG-01
- [x] 下载文件返回源文件而非 JSON — v1.1 Phase 7: BUG-02
- [x] 作品浏览量统计正常工作 — v1.1 Phase 7: BUG-03
- [x] 文件使用 fast-md5 去重 — v1.1 Phase 8: FILE-01
- [x] 智能缩略图生成 — v1.1 Phase 8: FILE-02
- [x] 作品列表显示文件数量和总大小 — v1.1 Phase 9
- [x] 后台侧边栏前台画廊入口 — v1.1 Phase 9
- [x] 作品文件管理（添加/删除）— v1.1 Phase 10
- [x] 工作室介绍页面 — v1.1 Phase 11
- [x] 相册分享功能 — v1.1 Phase 12
- [x] 关于我们页面无需登录即可访问 — v1.2 Phase 13: BUG-01
- [x] 作品缩略图显示修复（使用第一个 mediaItem）— v1.2 Phase 13: BUG-02
- [x] 首页作品详情页（展示作品下所有文件）— v1.2 Phase 14: GALL-01~03
- [x] 系统设置卡片自适应宽度 — v1.2 Phase 16: AUX-05
- [x] 管理页左侧菜单栏独立滚动 — v1.2 Phase 16: AUX-06
- [x] 管理列表全部增加筛选功能 — v1.2 Phase 15: AUX-01~04
- [x] 分享管理和客户管理样式统一 — v1.2 Phase 17: AUX-07
- [x] 作品编辑弹窗显示所有文件（包括第一个文件）— v1.3 Phase 18: EDIT-01
- [x] 上传/编辑弹窗 UI 统一（拖拽区在底部）— v1.3 Phase 18: EDIT-02
- [x] 支持多文件拖拽和选择上传 — v1.3 Phase 18: EDIT-03~04
- [x] 首页作品缩略图正确显示 — v1.3 Phase 19: SHOW-01
- [x] 详情页显示所有文件（包括第一个文件）— v1.3 Phase 19: SHOW-02
- [x] 详情页大图左右点击切换导航 — v1.3 Phase 19: SHOW-03
- [x] 详情页大图初始正确显示 — v1.3 Phase 19: SHOW-04

### Active

(None — v1.3 complete, awaiting next milestone planning)

### Out of Scope

- 多工作室/多租户模式 — 单工作室使用
- 多管理员账号 — 仅支持单一管理员
- 客户注册/登录系统 — 客户通过私密链接访问，无需注册
- 公开展示区的互动功能（收藏、评论） — 公开区仅展示，互动限于私密链接客户
- 移动端APP — 优先响应式Web，暂不做原生APP

## Context

**v1.0 Shipped:** 2026-03-25

技术实现：
- 前端: Vue 3 + TypeScript + Vite + Element Plus
- 后端: Node.js + Express + TypeORM
- 数据库: MySQL 8.0 + Redis 7.2
- 部署: PM2 cluster + Nginx + Let's Encrypt SSL

代码统计：
- ~11,500 行 TypeScript/Vue 代码
- 115 次提交
- 6 个开发阶段，27 个计划，70+ 任务

架构亮点：
- 作品可包含多个媒体项（图片/视频）
- 公开画廊瀑布流布局
- 私密链接支持过期时间和访问限制
- 深色/浅色主题切换
- 完整的客户管理和访问记录

## Constraints

- **技术栈**: 前端 Vue3 + TypeScript + Vite，后端 Node + TypeScript + Vite — 开发团队熟悉这些技术，快速开发
- **数据库**: MySQL 存储长期数据，Redis 做缓存和短期数据 — 可靠性与性能兼顾
- **文件存储**: 本地存储 — 成本可控，部署简单
- **部署环境**: 自有服务器 — 数据完全掌控
- **UI风格**: 支持深色/浅色主题切换 — 适应不同用户偏好
- **响应式**: 支持电脑、手机、平板 — 多设备访问

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 前后端分离架构 | 便于独立开发和部署，提高可维护性 | ✅ Phase 5 |
| Vue3 + Node 全栈TypeScript | 类型安全，开发体验一致 | ✅ Phase 5 |
| 本地文件存储 | 成本低，部署简单，适合初期 | ✅ Phase 5 |
| 单管理员模式 | 简化权限系统，快速上线 | — Pending |
| 批量操作支持部分成功 | 用户友好，不会因单个失败而整体失败 | ✅ Phase 4 |
| MySQL 存储访问日志 | 查询方便，适合预期访问量 | ✅ Phase 4 |
| VueUse + CSS 变量实现主题 | 简单可靠，自动持久化 | ✅ Phase 4 |
| PM2 cluster + Nginx | 高可用、负载均衡、SSL 终止 | ✅ v1.0 |
| Let's Encrypt SSL | 免费、自动续期、安全 | ✅ v1.0 |
| MediaItem 模型支持多媒体 | 作品可包含多个图片/视频 | ✅ v1.0 |
| VueUse + CSS 变量实现主题 | 简单可靠，自动持久化 | ✅ v1.0 |
| 后端更新操作重新加载关联 | 确保 edit 返回完整数据 | ✅ v1.3 Phase 18 |
| 上传/编辑弹窗统一布局 | 文件拖拽区始终在底部，一致 UX | ✅ v1.3 Phase 18 |
| 多文件上传分步处理 | 首文件创建作品，后续提示保存后添加 | ✅ v1.3 Phase 18 |
| 灯箱点击导航自定义事件 | 左键上一张，右键下一张 | ✅ v1.3 Phase 19 |

---
*Last updated: 2026-03-27 after v1.3 milestone completed*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state