# Roadmap: 摄影工作室作品展示平台

**Project:** 摄影工作室作品展示平台
**Created:** 2026-03-24
**Core Value:** 让摄影师轻松管理作品，让客户优雅地查看和获取作品

## Overview

| Statistic | Value |
|-----------|-------|
| Total Phases | 12 |
| v1.0 Requirements | 48 (Complete) |
| v1.1 Requirements | 15 |
| Coverage | 100% |

---

## Milestones

- ✅ **v1.0 摄影工作室作品展示平台** - Phases 1-6 (shipped 2026-03-25)
- 🚧 **v1.1 增强与修复** - Phases 7-12 (in progress)

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

### 🚧 v1.1 增强与修复 (In Progress)

**Milestone Goal:** 修复已知问题，增强文件处理、作品管理和私密分享功能

#### Phase 7: Bug 修复
**Goal:** 核心功能按预期工作
**Depends on:** Phase 6
**Requirements:** BUG-01, BUG-02, BUG-03
**Success Criteria** (what must be TRUE):
  1. 管理员配置水印后，公开展示的作品图片显示水印
  2. 客户通过私密链接下载文件时，获得源文件而非 JSON 响应
  3. 作品浏览量在每次访问时正确递增
**Plans:** 3 plans

Plans:
- [x] 07-01-PLAN.md — 水印功能集成
- [x] 07-02-PLAN.md — 下载文件修复
- [x] 07-03-PLAN.md — 浏览量统计修复

---

#### Phase 8: 文件存储优化
**Goal:** 文件存储高效且智能
**Depends on:** Phase 7
**Requirements:** FILE-01, FILE-02
**Success Criteria** (what must be TRUE):
  1. 相同文件上传时自动去重，存储空间不浪费
  2. 图片尺寸小于缩略图尺寸时，访问缩略图返回原图
  3. 新上传的文件以 MD5 哈希命名
**Plans:** 2 plans

Plans:
- [ ] 08-01-PLAN.md — MD5 去重存储
- [ ] 08-02-PLAN.md — 智能缩略图生成

---

#### Phase 9: 作品信息增强
**Goal:** 管理员可以查看作品详情并快速访问前台
**Depends on:** Phase 8
**Requirements:** WORK-01, WORK-02
**UI hint:** yes
**Success Criteria** (what must be TRUE):
  1. 作品列表显示每个作品的总文件大小
  2. 作品列表显示每个作品的文件数量
  3. 后台管理页面有跳转前台画廊的入口链接
**Plans:** 2 plans

Plans:
- [ ] 09-01-PLAN.md — 文件信息展示
- [ ] 09-02-PLAN.md — 前台跳转入口

---

#### Phase 10: 作品文件管理
**Goal:** 管理员可以管理作品中的文件
**Depends on:** Phase 9
**Requirements:** WORK-03, WORK-04
**UI hint:** yes
**Success Criteria** (what must be TRUE):
  1. 管理员可以为已有作品添加新的图片或视频文件
  2. 管理员可以从作品中删除文件
  3. 删除最后一个文件时提示确认或阻止操作
**Plans:** 2 plans

Plans:
- [ ] 10-01-PLAN.md — 添加文件功能
- [ ] 10-02-PLAN.md — 删除文件功能

---

#### Phase 11: 工作室介绍
**Goal:** 访客可以了解工作室信息
**Depends on:** Phase 7
**Requirements:** STUD-01, STUD-02, STUD-03
**UI hint:** yes
**Success Criteria** (what must be TRUE):
  1. 管理员可以在后台配置工作室名称、Logo 和联系方式
  2. 管理员可以使用富文本编辑器编辑工作室介绍内容
  3. 访客可以在前台查看工作室介绍页面
**Plans:** 3 plans

Plans:
- [ ] 11-01-PLAN.md — 工作室设置模型
- [ ] 11-02-PLAN.md — 后台设置页面
- [ ] 11-03-PLAN.md — 前台介绍页面

---

#### Phase 12: 相册分享
**Goal:** 管理员可以分享整个相册给客户
**Depends on:** Phase 7
**Requirements:** SHAR-01, SHAR-02, SHAR-03
**UI hint:** yes
**Success Criteria** (what must be TRUE):
  1. 管理员可以生成私密链接分享整个相册
  2. 客户通过私密链接可以查看相册中的所有作品
  3. 客户通过私密链接可以下载相册中的作品原图
**Plans:** 2 plans

Plans:
- [ ] 12-01-PLAN.md — 相册分享后端
- [ ] 12-02-PLAN.md — 相册分享前端

---

## Phase Dependencies

```
v1.0 (Complete)
    │
    ↓
Phase 7 (Bug 修复)
    ├──────────────────┬────────────────────┐
    ↓                  ↓                    ↓
Phase 8            Phase 11             Phase 12
(文件存储优化)     (工作室介绍)          (相册分享)
    ↓                  │                    │
Phase 9               │                    │
(作品信息增强)        │                    │
    ↓                  │                    │
Phase 10              │                    │
(作品文件管理)        │                    │
    │                  │                    │
    └──────────────────┴────────────────────┘
                       │
                       ↓
                v1.1 Complete
```

**Execution Order:**
- Phases 7 → 8 → 9 → 10 (sequential chain)
- Phases 11 and 12 can run in parallel after Phase 7

---

## Risk Register

| Risk | Phase | Mitigation |
|------|-------|------------|
| 水印影响原图质量 | Phase 7 | 只在公开展示时动态添加水印，不修改原图 |
| MD5 计算大文件慢 | Phase 8 | 使用流式计算，显示进度 |
| 富文本 XSS 风险 | Phase 11 | 使用 sanitize-html 过滤，白名单策略 |
| 相册分享权限泄露 | Phase 12 | 使用安全随机 token，设置过期时间 |

---

## Traceability Matrix

| Phase | Requirements | Count |
|-------|--------------|-------|
| Phase 7 | BUG-01, BUG-02, BUG-03 | 3 |
| Phase 8 | FILE-01, FILE-02 | 2 |
| Phase 9 | WORK-01, WORK-02 | 2 |
| Phase 10 | WORK-03, WORK-04 | 2 |
| Phase 11 | STUD-01, STUD-02, STUD-03 | 3 |
| Phase 12 | SHAR-01, SHAR-02, SHAR-03 | 3 |

**v1.1 Total:** 15 requirements covered ✓

---

*Roadmap created: 2026-03-24*
*Updated for v1.1: 2026-03-26*