# Roadmap: 摄影工作室作品展示平台

**Project:** 摄影工作室作品展示平台
**Created:** 2026-03-24
**Core Value:** 让摄影师轻松管理作品，让客户优雅地查看和获取作品

## Overview

| Statistic | Value |
|-----------|-------|
| Total Phases | 5 |
| v1 Requirements | 48 |
| Coverage | 100% |

---

## Phase 1: 项目基础架构

**Goal:** 搭建前后端基础框架，实现管理员认证和文件上传能力

### Requirements Covered

AUTH-01, AUTH-02, AUTH-03

### Success Criteria

1. 管理员可以通过登录页面进入后台
2. 登录状态在浏览器关闭后仍然保持
3. 退出登录后无法访问管理功能
4. 前后端项目可以正常启动和运行
5. 数据库连接正常，表结构已创建

### Key Decisions

| Decision | Options Considered | Chosen | Rationale |
|----------|-------------------|--------|-----------|
| 认证方案 | Session vs JWT | JWT | 无状态，适合单服务器部署 |
| 文件存储路径 | 绝对路径 vs 相对路径 | 相对路径 | 便于迁移 |

### Technical Notes

- 前端使用 Vue3 + Vite + TypeScript
- 后端使用 Express + TypeScript + Vite
- 数据库使用 TypeORM 连接 MySQL
- 使用 Redis 存储 JWT 黑名单（退出登录时使用）

### Plans

**Plans:** 4 plans in 3 waves

- [ ] 01-01-PLAN.md — Backend Infrastructure (Wave 1)
- [ ] 01-02-PLAN.md — Frontend Infrastructure (Wave 1, parallel)
- [ ] 01-03-PLAN.md — Authentication Backend (Wave 2)
- [ ] 01-04-PLAN.md — Authentication Frontend (Wave 3, checkpoint)

---

## Phase 2: 作品管理功能

**Goal:** 实现完整的作品和相册管理，包括上传、编辑、删除、分类、水印

### Requirements Covered

WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, WORK-07, WORK-08, WORK-09, WORK-10, WORK-11, ALBM-01, ALBM-02, ALBM-03, ALBM-04, ALBM-05, WATR-01, WATR-02, WATR-03

### Success Criteria

1. 管理员可以上传照片和视频
2. 上传的照片自动生成缩略图
3. 管理员可以创建和管理相册
4. 管理员可以为作品设置标题、描述、标签
5. 公开展示的照片自动添加水印
6. 管理员可以调整作品和相册的展示顺序

### Key Decisions

| Decision | Options Considered | Chosen | Rationale |
|----------|-------------------|--------|-----------|
| 图片处理库 | Sharp vs Jimp vs Canvas | Sharp | 性能最佳，原生模块 |
| 缩略图尺寸 | 固定 vs 自适应 | 固定几种尺寸 | 简化实现，满足展示需求 |
| 水印位置 | 固定 vs 可配置 | 可配置位置和透明度 | 摄影师偏好不同 |

### Technical Notes

- 使用 Multer 处理文件上传
- 使用 Sharp 生成缩略图和添加水印
- 作品排序使用 position 字段，支持拖拽排序
- 文件名使用 UUID 避免冲突

### Plans

**Plans:** 4 plans in 4 waves

- [ ] 02-01-PLAN.md — Database Models (Wave 1)
- [ ] 02-02-PLAN.md — Upload & Processing Service (Wave 2)
- [ ] 02-03-PLAN.md — Backend API Routes (Wave 3)
- [ ] 02-04-PLAN.md — Frontend Admin UI (Wave 4, checkpoint)

---

## Phase 3: 公开展示与私密分享

**Goal:** 实现公开画廊和私密链接分享功能，让客户可以查看和下载作品

**UI hint:** yes

### Requirements Covered

PUBL-01, PUBL-02, PUBL-03, PUBL-04, PUBL-05, PUBL-06, PUBL-07, PRIV-01, PRIV-02, PRIV-03, PRIV-04

### Success Criteria

1. 访客可以在首页看到公开作品的瀑布流展示
2. 访客可以按相册、标签筛选作品
3. 访客可以搜索作品
4. 移动端可以正常浏览
5. 管理员可以生成私密分享链接
6. 客户通过私密链接可以看到选定的作品
7. 客户通过私密链接可以下载高清无水印原图
8. 私密链接到期后无法访问

### Key Decisions

| Decision | Options Considered | Chosen | Rationale |
|----------|-------------------|--------|-----------|
| Token 生成 | UUID vs randomBytes | crypto.randomBytes(32) | 更安全，不可预测 |
| Token 存储 | MySQL vs Redis | Redis + TTL | 自动过期，性能好 |
| 画廊布局 | 网格 vs 瀑布流 | 瀑布流 | 适合不同比例照片 |

### Technical Notes

- 前端使用 CSS Grid 或 Masonry 实现瀑布流
- 私密链接 token 使用 Base64URL 编码，适合 URL
- Redis 存储 token → 作品 IDs 映射，设置 TTL
- 下载原图时验证 token 有效性

---

## Phase 4: 增强功能

**Goal:** 添加批量操作、统计、客户管理、主题切换等增强功能

**UI hint:** yes

### Requirements Covered

BATCH-01, BATCH-02, BATCH-03, BATCH-04, PRIV-05, PRIV-06, STAT-01, STAT-02, STAT-03, STAT-04, CLNT-01, CLNT-02, CLNT-03, CLNT-04, THEM-01, THEM-02, THEM-03

### Success Criteria

1. 管理员可以一次上传多个作品并看到进度
2. 管理员可以批量移动和删除作品
3. 管理员可以看到作品的浏览和下载统计
4. 管理员可以管理客户信息
5. 管理员可以查看私密链接的访问记录
6. 用户可以切换深色/浅色主题
7. 主题选择在刷新后保持

### Key Decisions

| Decision | Options Considered | Chosen | Rationale |
|----------|-------------------|--------|-----------|
| 统计存储 | MySQL vs Redis | Redis 计数 + 定期同步 MySQL | 高性能写入 |
| 主题持久化 | Cookie vs localStorage | localStorage | 简单可靠 |
| 批量上传 | 同步 vs 异步 | 异步 + 进度推送 | 大批量不阻塞 |

### Technical Notes

- 批量上传使用 Promise.all 并发控制
- 统计使用 Redis INCR，定时任务同步到 MySQL
- 客户管理关联私密链接记录
- 主题使用 CSS 变量 + VueUse useDark

---

## Phase 5: 部署与优化

**Goal:** 完成生产环境部署，进行性能优化和安全加固

### Requirements Covered

(No new requirements - deployment and optimization phase)

### Success Criteria

1. 应用可以在生产服务器正常运行
2. 静态资源通过 Nginx 正确提供
3. 数据库和 Redis 连接稳定
4. 文件上传和访问正常
5. 页面加载时间 < 3秒
6. 无明显安全漏洞

### Key Decisions

| Decision | Options Considered | Chosen | Rationale |
|----------|-------------------|--------|-----------|
| 进程管理 | PM2 vs systemd | PM2 | Node.js 生态，易于管理 |
| 反向代理 | Nginx vs Caddy | Nginx | 成熟稳定，配置灵活 |
| SSL 证书 | Let's Encrypt vs 自签名 | Let's Encrypt | 免费，自动续期 |

### Technical Notes

- 前端构建后由 Nginx 提供静态文件服务
- 后端使用 PM2 cluster 模式
- 配置 Nginx 缓存静态资源
- 设置日志轮转和备份策略
- 配置防火墙规则

---

## Phase Dependencies

```
Phase 1 (基础架构)
    ↓
Phase 2 (作品管理) ──requires── Phase 1
    ↓
Phase 3 (公开展示) ──requires── Phase 2
    ↓
Phase 4 (增强功能) ──requires── Phase 3
    ↓
Phase 5 (部署优化) ──requires── Phase 4
```

---

## Risk Register

| Risk | Phase | Mitigation |
|------|-------|------------|
| 大文件上传超时 | Phase 1, 2 | 使用流式上传，设置合理的超时和大小限制 |
| 图片处理阻塞 | Phase 2 | 异步处理，限制并发数 |
| 私密链接泄露 | Phase 3 | 使用安全随机 token，设置过期时间 |
| 数据库连接泄漏 | Phase 1, 5 | 正确配置连接池，监控连接状态 |
| 性能问题 | Phase 5 | CDN 加速，缓存策略，代码优化 |

---

## Traceability Matrix

| Phase | Requirements | Count |
|-------|--------------|-------|
| Phase 1 | AUTH-01, AUTH-02, AUTH-03 | 3 |
| Phase 2 | WORK-01~11, ALBM-01~05, WATR-01~03 | 19 |
| Phase 3 | PUBL-01~07, PRIV-01~04 | 11 |
| Phase 4 | BATCH-01~04, PRIV-05~06, STAT-01~04, CLNT-01~04, THEM-01~03 | 15 |
| Phase 5 | (部署优化，无新需求) | 0 |

**Total:** 48 requirements covered ✓

---

*Roadmap created: 2026-03-24*
*Last updated: 2026-03-24 after initial creation*