# 摄影工作室作品展示平台

## What This Is

一个面向摄影工作室的作品展示与管理平台。摄影师可以上传、管理作品，通过公开画廊展示作品，也可生成私密链接分享给特定客户，客户可通过私密链接下载高清无水印原图。

## Core Value

让摄影师轻松管理作品，让客户优雅地查看和获取作品。

## Requirements

### Validated

- [x] 摄影师可以批量上传作品 — Phase 4: BATCH-01~04
- [x] 摄影师可以查看作品数据统计（浏览量、下载量）— Phase 4: STAT-01~04
- [x] 摄影师可以查看私密链接访问记录 — Phase 4: PRIV-05
- [x] 摄影师可以管理客户联系方式和备注 — Phase 4: CLNT-01~04

### Active

- [ ] 摄影师可以上传照片和视频作品
- [ ] 摄影师可以创建和管理相册
- [ ] 摄影师可以对作品进行分类、标签、排序、置顶管理
- [ ] 摄影师可以为作品添加水印保护
- [ ] 访客可以在公开画廊浏览作品
- [ ] 摄影师可以生成私密链接分享给客户
- [ ] 客户通过私密链接可以查看和下载高清无水印原图

### Out of Scope

- 多工作室/多租户模式 — 单工作室使用
- 多管理员账号 — 仅支持单一管理员
- 客户注册/登录系统 — 客户通过私密链接访问，无需注册
- 公开展示区的互动功能（收藏、评论） — 公开区仅展示，互动限于私密链接客户
- 移动端APP — 优先响应式Web，暂不做原生APP

## Context

- 摄影工作室需要一个专业的在线作品展示平台
- 目前可能通过社交媒体或网盘分享作品，缺乏专业性和统一管理
- 需要区分公开展示和私密分享两种场景
- 私密分享的客户需要下载高清原图的权限

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
| PM2 cluster + Nginx | 高可用、负载均衡、SSL 终止 | ✅ Phase 5 |
| Let's Encrypt SSL | 免费、自动续期、安全 | ✅ Phase 5 |

---
*Last updated: 2026-03-25 after Phase 5 completion*

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