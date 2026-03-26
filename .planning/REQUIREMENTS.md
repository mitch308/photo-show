# Requirements: 摄影工作室作品展示平台 v1.1

**Defined:** 2026-03-26
**Core Value:** 让摄影师轻松管理作品，让客户优雅地查看和获取作品

## v1.1 Requirements

### Bug Fixes

- [ ] **BUG-01**: 管理员可以为作品配置水印，公开展示时自动应用水印
- [ ] **BUG-02**: 客户通过私密链接下载文件时返回源文件而非 JSON
- [x] **BUG-03**: 作品浏览量在访问时正确递增

### File Storage Optimization

- [ ] **FILE-01**: 文件使用 MD5 哈希作为文件名存储，相同文件自动去重
- [ ] **FILE-02**: 图片尺寸小于缩略图尺寸时不生成缩略图，访问缩略图时返回原图

### Work Management Enhancement

- [ ] **WORK-01**: 作品列表展示文件总大小和文件数量
- [ ] **WORK-02**: 后台管理页面增加跳转前台画廊的入口
- [ ] **WORK-03**: 管理员可以为已有作品添加新文件
- [ ] **WORK-04**: 管理员可以从已有作品中删除文件

### Studio Introduction

- [ ] **STUD-01**: 管理员可以在后台配置工作室基本信息（名称、Logo、联系方式）
- [ ] **STUD-02**: 管理员可以使用富文本编辑器编辑工作室介绍内容
- [ ] **STUD-03**: 访客可以在前台查看工作室介绍页面

### Private Sharing Extension

- [ ] **SHAR-01**: 管理员可以生成私密链接分享相册
- [ ] **SHAR-02**: 客户通过私密链接可以查看相册中的所有作品
- [ ] **SHAR-03**: 客户通过私密链接可以下载相册中的作品原图

## v2 Requirements

Deferred to future release.

### View Statistics Enhancement

- **VIEW-01**: 浏览量按会话/IP 去重，避免重复计数
- **VIEW-02**: 浏览量统计支持时间窗口（如 24 小时内同一用户只计一次）

### Advanced Features

- **FILE-03**: 现有文件批量去重迁移
- **STUD-04**: 工作室介绍页面支持自定义 SEO 信息

## Out of Scope

| Feature | Reason |
|---------|--------|
| 实时去重进度显示 | 增加复杂度，上传后返回去重信息即可 |
| 完整 CMS 系统 | 单页面介绍无需完整内容管理 |
| 多级相册分享权限 | 与简单私密链接模型冲突 |
| 现有文件批量去重 | 风险高，可能破坏现有引用 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 7 | Pending |
| BUG-02 | Phase 7 | Pending |
| BUG-03 | Phase 7 | Complete |
| FILE-01 | Phase 8 | Pending |
| FILE-02 | Phase 8 | Pending |
| WORK-01 | Phase 9 | Pending |
| WORK-02 | Phase 9 | Pending |
| WORK-03 | Phase 10 | Pending |
| WORK-04 | Phase 10 | Pending |
| STUD-01 | Phase 11 | Pending |
| STUD-02 | Phase 11 | Pending |
| STUD-03 | Phase 11 | Pending |
| SHAR-01 | Phase 12 | Pending |
| SHAR-02 | Phase 12 | Pending |
| SHAR-03 | Phase 12 | Pending |

**Coverage:**
- v1.1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

**Phase Summary:**
- Phase 7 (Bug 修复): BUG-01, BUG-02, BUG-03
- Phase 8 (文件存储优化): FILE-01, FILE-02
- Phase 9 (作品信息增强): WORK-01, WORK-02
- Phase 10 (作品文件管理): WORK-03, WORK-04
- Phase 11 (工作室介绍): STUD-01, STUD-02, STUD-03
- Phase 12 (相册分享): SHAR-01, SHAR-02, SHAR-03

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after v1.1 requirements defined*