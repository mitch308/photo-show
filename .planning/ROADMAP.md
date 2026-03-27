# Roadmap: 摄影工作室作品展示平台

**Project:** 摄影工作室作品展示平台
**Created:** 2026-03-24
**Core Value:** 让摄影师轻松管理作品，让客户优雅地查看和获取作品

## Overview

| Statistic | Value |
|-----------|-------|
| Total Phases | 17 |
| v1.0 Requirements | 48 (Complete) |
| v1.1 Requirements | 15 (Complete) |
| v1.2 Requirements | 12 |
| Coverage | 100% |

---

## Milestones

- ✅ **v1.0 摄影工作室作品展示平台** - Phases 1-6 (shipped 2026-03-25)
- ✅ **v1.1 增强与修复** - Phases 7-12 (shipped 2026-03-26)
- 🚧 **v1.2 UI/UX 优化与修复** - Phases 13-17 (in progress)

---

<details>
<summary>✅ v1.0 摄影工作室作品展示平台 (Phases 1-6) - SHIPPED 2026-03-25</summary>

### Phase 1: 项目基础架构
**Goal:** 搭建前后端基础框架，实现管理员认证和文件上传能力
**Plans:** 4 plans (Complete)

### Phase 2: 作品管理功能
**Goal:** 实现完整的作品和相册管理，包括上传、编辑、删除、分类、水印
**Plans:** 4 plans (Complete)

### Phase 3: 公开展示与私密分享
**Goal:** 实现公开画廊和私密链接分享功能，让客户可以查看和下载作品
**Plans:** 4 plans (Complete)

### Phase 4: 增强功能
**Goal:** 添加批量操作、统计、客户管理、主题切换等增强功能
**Plans:** 5 plans (Complete)

### Phase 5: 部署与优化
**Goal:** 完成生产环境部署，进行性能优化和安全加固
**Plans:** (Complete)

### Phase 6: 数据模型重构
**Goal:** 重构数据模型以支持作品包含多个媒体项（图片/视频），相册包含多个作品的三层结构
**Plans:** 5 plans (Complete)

</details>

---

<details>
<summary>✅ v1.1 增强与修复 (Phases 7-12) - SHIPPED 2026-03-26</summary>

### Phase 7: Bug 修复
**Goal:** 核心功能按预期工作
**Requirements:** BUG-01, BUG-02, BUG-03
**Plans:** 3 plans (Complete)

### Phase 8: 文件存储优化
**Goal:** 文件存储高效且智能，通过 Fast-MD5 预检查实现去重
**Requirements:** FILE-01, FILE-02
**Plans:** 2 plans (Complete)

### Phase 9: 作品信息增强
**Goal:** 管理员可以查看作品详情并快速访问前台
**Requirements:** WORK-01, WORK-02
**UI hint:** yes
**Plans:** 2 plans (Complete)

### Phase 10: 作品文件管理
**Goal:** 管理员可以管理作品中的文件
**Requirements:** WORK-03, WORK-04
**UI hint:** yes
**Plans:** 2 plans (Complete)

### Phase 11: 工作室介绍
**Goal:** 访客可以了解工作室信息
**Requirements:** STUD-01, STUD-02, STUD-03
**UI hint:** yes
**Plans:** 3 plans (Complete)

### Phase 12: 相册分享
**Goal:** 管理员可以分享整个相册给客户
**Requirements:** SHAR-01, SHAR-02, SHAR-03
**UI hint:** yes
**Plans:** 2 plans (Complete)

</details>

---

### 🚧 v1.2 UI/UX 优化与修复 (In Progress)

**Milestone Goal:** 修复 UI 问题，美化界面，提升用户体验

#### Phase 13: Bug 修复
**Goal:** 核心功能按预期工作
**Depends on:** Phase 12
**Requirements:** BUG-01, BUG-02
**Success Criteria** (what must be TRUE):
  1. 访客无需登录即可访问"关于我们"页面
  2. 作品缩略图正确显示（使用第一个 mediaItem，兼容旧数据）
**Plans:** 2/2 plans complete

Plans:
- [x] 13-01-PLAN.md — 验证并确保访客无需登录即可访问"关于我们"页面
- [x] 13-02-PLAN.md — 创建 useWorkThumbnail composable 修复缩略图显示

---

#### Phase 14: 作品详情页
**Goal:** 用户可以查看作品的所有文件
**Depends on:** Phase 13
**Requirements:** GALL-01, GALL-02, GALL-03
**UI hint:** yes
**Success Criteria** (what must be TRUE):
  1. 用户可以点击作品卡片进入作品详情页
  2. 详情页以网格布局展示作品的所有媒体文件
  3. 用户可以在灯箱中查看文件（支持缩放、平移、旋转）
**Plans:** 2/2 plans complete

Plans:
- [x] 14-01-PLAN.md — 创建作品详情页，实现从首页作品卡片点击导航到详情页，详情页以响应式网格布局展示作品的所有媒体文件
- [x] 14-02-PLAN.md — 集成 vue-easy-lightbox 库创建增强灯箱组件，支持缩放、平移、旋转功能

---

#### Phase 15: 后台筛选
**Goal:** 管理员可以快速定位管理内容
**Depends on:** Phase 13
**Requirements:** AUX-01, AUX-02, AUX-03, AUX-04
**UI hint:** yes
**Success Criteria** (what must be TRUE):
  1. 管理员可以按标题或状态筛选作品列表
  2. 管理员可以按名称筛选相册列表
  3. 管理员可以按名称筛选标签列表
  4. 管理员可以按客户名称或分享类型筛选分享列表
**Plans:** 4/4 plans complete

Plans:
- [x] 15-01-PLAN.md — 作品管理页面筛选（标题搜索 + 状态筛选）
- [x] 15-02-PLAN.md — 相册管理页面筛选（名称搜索）
- [x] 15-03-PLAN.md — 标签管理页面筛选（名称搜索）
- [x] 15-04-PLAN.md — 分享管理页面筛选（客户筛选 + 类型筛选）

---

#### Phase 16: 布局优化
**Goal:** 后台界面布局更合理易用
**Depends on:** Phase 15
**Requirements:** AUX-05, AUX-06
**UI hint:** yes
**Success Criteria** (what must be TRUE):
  1. 侧边栏导航可以独立滚动，内容区域滚动不影响侧边栏
  2. 系统设置卡片宽度自适应屏幕宽度
**Plans:** 1/1 plans complete

Plans:
- [x] 16-01-PLAN.md — 优化侧边栏独立滚动和设置卡片宽度自适应

---

#### Phase 17: 样式统一
**Goal:** 后台界面视觉风格一致
**Depends on:** Phase 16
**Requirements:** AUX-07
**UI hint:** yes
**Success Criteria** (what must be TRUE):
  1. 分享管理页面使用与其他管理页面一致的表格样式
  2. 客户管理页面使用与其他管理页面一致的表格样式
**Plans:** TBD

---

## Phase Dependencies

```
v1.0 Complete ──→ v1.1 Complete ──→ v1.2
                                        │
                                        ↓
                                   Phase 13 (Bug 修复)
                                        │
                           ┌────────────┴────────────┐
                           ↓                         ↓
                      Phase 14                  Phase 15
                   (作品详情页)               (后台筛选)
                           │                         │
                           └────────────┬────────────┘
                                        ↓
                                   Phase 16 (布局优化)
                                        │
                                        ↓
                                   Phase 17 (样式统一)
                                        │
                                        ↓
                                  v1.2 Complete
```

**Execution Order:**
- Phase 13 → Phase 14 (作品详情页依赖缩略图修复)
- Phase 13 → Phase 15 (筛选功能可与详情页并行)
- Phase 15 → Phase 16 (布局优化在筛选后)
- Phase 16 → Phase 17 (样式统一最后)

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. 项目基础架构 | v1.0 | 4/4 | Complete | 2026-03-25 |
| 2. 作品管理功能 | v1.0 | 4/4 | Complete | 2026-03-25 |
| 3. 公开展示与私密分享 | v1.0 | 4/4 | Complete | 2026-03-25 |
| 4. 增强功能 | v1.0 | 5/5 | Complete | 2026-03-25 |
| 5. 部署与优化 | v1.0 | - | Complete | 2026-03-25 |
| 6. 数据模型重构 | v1.0 | 5/5 | Complete | 2026-03-25 |
| 7. Bug 修复 | v1.1 | 3/3 | Complete | 2026-03-26 |
| 8. 文件存储优化 | v1.1 | 2/2 | Complete | 2026-03-26 |
| 9. 作品信息增强 | v1.1 | 2/2 | Complete | 2026-03-26 |
| 10. 作品文件管理 | v1.1 | 2/2 | Complete | 2026-03-26 |
| 11. 工作室介绍 | v1.1 | 3/3 | Complete | 2026-03-26 |
| 12. 相册分享 | v1.1 | 2/2 | Complete | 2026-03-26 |
| 13. Bug 修复 | v1.2 | 2/2 | Complete    | 2026-03-26 |
| 14. 作品详情页 | v1.2 | 2/2 | Complete    | 2026-03-26 |
| 15. 后台筛选 | v1.2 | 4/4 | Complete   | 2026-03-26 |
| 16. 布局优化 | v1.2 | 1/1 | Complete   | 2026-03-27 |
| 17. 样式统一 | v1.2 | 0/1 | Not started | - |

---

## Risk Register

| Risk | Phase | Mitigation |
|------|-------|------------|
| 缩略图兼容旧数据 | Phase 13 | 创建 useWorkThumbnail composable，实现降级逻辑 |
| 作品无 mediaItems 时显示异常 | Phase 13 | 检查 mediaItems 长度，提供占位图 |
| 灯箱组件功能不完整 | Phase 14 | 使用 vue-easy-lightbox，支持缩放/平移/旋转 |
| 筛选状态丢失 | Phase 15 | 使用 URL 参数存储筛选状态 |
| 侧边栏滚动布局破坏 | Phase 16 | 只对 .nav 设置滚动，使用 min-height: 0 |
| Element Plus 暗色模式不一致 | Phase 17 | 映射 CSS 变量到 Element Plus token |

---

## Traceability Matrix

| Phase | Requirements | Count |
|-------|--------------|-------|
| Phase 13 | BUG-01, BUG-02 | 2 |
| Phase 14 | GALL-01, GALL-02, GALL-03 | 3 |
| Phase 15 | AUX-01, AUX-02, AUX-03, AUX-04 | 4 |
| Phase 16 | AUX-05, AUX-06 | 2 |
| Phase 17 | AUX-07 | 1 |

**v1.2 Total:** 12 requirements covered ✓

---

*Roadmap created: 2026-03-24*
*Updated for v1.1: 2026-03-26*
*Updated for v1.2: 2026-03-26*