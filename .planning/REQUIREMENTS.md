# Requirements: 摄影工作室作品展示平台

**Defined:** 2026-03-27
**Core Value:** 让摄影师轻松管理作品，让客户优雅地查看和获取作品

## v1.3 Requirements

v1.3 作品管理 UI 修复与优化需求。

### 作品编辑修复

- [x] **EDIT-01**: 作品编辑弹窗正确显示所有已上传的文件（包括第一个文件）
- [x] **EDIT-02**: 上传和编辑弹窗 UI 统一，文件拖拽区保持在底部
- [x] **EDIT-03**: 拖拽区支持同时拖拽多个文件
- [x] **EDIT-04**: 点击选择文件时支持多选

### 作品展示修复

- [ ] **SHOW-01**: 首页作品缩略图正确显示
- [ ] **SHOW-02**: 作品详情页正确显示所有文件（包括第一个文件）
- [ ] **SHOW-03**: 详情页大图左右切换逻辑正确（左键切换到上一个，右键切换到下一个）
- [ ] **SHOW-04**: 进入详情页时大图正确显示

## v1.2 Requirements (Complete ✓)

### Bug 修复

- [x] **BUG-01**: 关于我们页面无需登录即可访问
- [x] **BUG-02**: 作品缩略图正确显示（使用第一个 mediaItem，兼容旧数据）

### 公开画廊

- [x] **GALL-01**: 用户可点击作品查看详情页
- [x] **GALL-02**: 作品详情页展示所有文件（网格布局）
- [x] **GALL-03**: 用户可在灯箱中查看文件（支持缩放/平移/旋转）

### 后台体验

- [x] **AUX-01**: 管理员可按标题/状态筛选作品
- [x] **AUX-02**: 管理员可按名称筛选相册
- [x] **AUX-03**: 管理员可按名称筛选标签
- [x] **AUX-04**: 管理员可按客户/类型筛选分享
- [x] **AUX-05**: 侧边栏导航独立滚动
- [x] **AUX-06**: 系统设置卡片自适应宽度
- [x] **AUX-07**: 分享/客户管理表格样式与其他页面统一

## v1.1 Requirements (Complete ✓)

### Bug Fixes

- [x] **BUG-01**: 管理员可以为作品配置水印，公开展示时自动应用水印 — Phase 7
- [x] **BUG-02**: 客户通过私密链接下载文件时返回源文件而非 JSON — Phase 7
- [x] **BUG-03**: 作品浏览量在访问时正确递增 — Phase 7

### File Storage Optimization

- [x] **FILE-01**: 文件使用 MD5 哈希作为文件名存储，相同文件自动去重 — Phase 8
- [x] **FILE-02**: 图片尺寸小于缩略图尺寸时不生成缩略图，访问缩略图时返回原图 — Phase 8

### Work Management Enhancement

- [x] **WORK-01**: 作品列表展示文件总大小和文件数量 — Phase 9
- [x] **WORK-02**: 后台管理页面增加跳转前台画廊的入口 — Phase 9
- [x] **WORK-03**: 管理员可以为已有作品添加新文件 — Phase 10
- [x] **WORK-04**: 管理员可以从已有作品中删除文件 — Phase 10

### Studio Introduction

- [x] **STUD-01**: 管理员可以在后台配置工作室基本信息 — Phase 11
- [x] **STUD-02**: 管理员可以使用富文本编辑器编辑工作室介绍内容 — Phase 11
- [x] **STUD-03**: 访客可以在前台查看工作室介绍页面 — Phase 11

### Private Sharing Extension

- [x] **SHAR-01**: 管理员可以生成私密链接分享相册 — Phase 12
- [x] **SHAR-02**: 客户通过私密链接可以查看相册中的所有作品 — Phase 12
- [x] **SHAR-03**: 客户通过私密链接可以下载相册中的作品原图 — Phase 12

## v2 Requirements

延期至未来版本。

### View Statistics Enhancement

- **VIEW-01**: 浏览量按会话/IP 去重，避免重复计数
- **VIEW-02**: 浏览量统计支持时间窗口

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

需求与阶段对应关系。

### v1.3 Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| EDIT-01 | Phase 18 | Complete |
| EDIT-02 | Phase 18 | Complete |
| EDIT-03 | Phase 18 | Complete |
| EDIT-04 | Phase 18 | Complete |
| SHOW-01 | Phase 19 | Pending |
| SHOW-02 | Phase 19 | Pending |
| SHOW-03 | Phase 19 | Pending |
| SHOW-04 | Phase 19 | Pending |

### v1.2 Traceability (Complete ✓)

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 13 | Complete |
| BUG-02 | Phase 13 | Complete |
| GALL-01 | Phase 14 | Complete |
| GALL-02 | Phase 14 | Complete |
| GALL-03 | Phase 14 | Complete |
| AUX-01 | Phase 15 | Complete |
| AUX-02 | Phase 15 | Complete |
| AUX-03 | Phase 15 | Complete |
| AUX-04 | Phase 15 | Complete |
| AUX-05 | Phase 16 | Complete |
| AUX-06 | Phase 16 | Complete |
| AUX-07 | Phase 17 | Complete |

**Coverage:**
- v1.3 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after v1.3 requirements defined*