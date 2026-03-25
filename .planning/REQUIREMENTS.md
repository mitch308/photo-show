# Requirements: 摄影工作室作品展示平台

**Defined:** 2026-03-24
**Core Value:** 让摄影师轻松管理作品，让客户优雅地查看和获取作品

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: 管理员可以使用用户名密码登录后台
- [ ] **AUTH-02**: 登录状态在浏览器关闭后保持（记住登录）
- [ ] **AUTH-03**: 管理员可以安全退出登录

### Works Management

- [ ] **WORK-01**: 管理员可以上传照片作品（支持常见格式：jpg, png, webp）
- [ ] **WORK-02**: 管理员可以上传视频作品（支持常见格式：mp4, webm）
- [ ] **WORK-03**: 管理员可以为作品设置标题和描述
- [ ] **WORK-04**: 管理员可以将作品分配到相册/分类
- [ ] **WORK-05**: 管理员可以为作品添加标签
- [ ] **WORK-06**: 管理员可以设置作品的展示顺序
- [ ] **WORK-07**: 管理员可以置顶精选作品
- [ ] **WORK-08**: 管理员可以编辑作品信息
- [ ] **WORK-09**: 管理员可以删除作品（同时删除文件）
- [ ] **WORK-10**: 系统自动为上传的照片生成缩略图
- [ ] **WORK-11**: 管理员可以为作品设置是否公开展示

### Album Management

- [ ] **ALBM-01**: 管理员可以创建相册
- [ ] **ALBM-02**: 管理员可以编辑相册名称和描述
- [ ] **ALBM-03**: 管理员可以删除相册（作品可选择移出或一并删除）
- [ ] **ALBM-04**: 管理员可以设置相册封面
- [ ] **ALBM-05**: 管理员可以设置相册展示顺序

### Batch Operations

- [x] **BATCH-01**: 管理员可以批量上传多个作品
- [x] **BATCH-02**: 批量上传时显示进度和成功/失败状态
- [x] **BATCH-03**: 管理员可以批量移动作品到相册
- [x] **BATCH-04**: 管理员可以批量删除作品

### Watermark

- [ ] **WATR-01**: 管理员可以为公开展示的照片自动添加水印
- [ ] **WATR-02**: 管理员可以配置水印文字或图片
- [ ] **WATR-03**: 管理员可以设置水印位置和透明度

### Public Gallery

- [x] **PUBL-01**: 访客可以在首页浏览公开的作品
- [x] **PUBL-02**: 访客可以按相册浏览作品
- [x] **PUBL-03**: 访客可以按标签筛选作品
- [x] **PUBL-04**: 访客可以搜索作品标题和描述
- [x] **PUBL-05**: 作品以瀑布流/网格形式优雅展示
- [x] **PUBL-06**: 访客可以点击作品查看大图和详细信息
- [x] **PUBL-07**: 移动端适配，支持手机和平板浏览

### Private Sharing

- [x] **PRIV-01**: 管理员可以为选定的作品生成私密分享链接
- [x] **PRIV-02**: 管理员可以设置链接的过期时间
- [x] **PRIV-03**: 客户通过私密链接可以查看选定的作品
- [x] **PRIV-04**: 客户通过私密链接可以下载高清无水印原图
- [x] **PRIV-05**: 管理员可以查看私密链接的访问记录
- [x] **PRIV-06**: 管理员可以手动使私密链接失效

### Statistics

- [x] **STAT-01**: 系统记录每个作品的浏览次数
- [x] **STAT-02**: 系统记录每个作品的下载次数
- [x] **STAT-03**: 管理员可以在后台查看作品统计数据
- [x] **STAT-04**: 管理员可以查看总体访问趋势

### Client Management

- [x] **CLNT-01**: 管理员可以添加客户信息（姓名、联系方式、备注）
- [x] **CLNT-02**: 管理员可以为客户创建专属的私密链接
- [x] **CLNT-03**: 管理员可以查看每个客户的访问历史
- [x] **CLNT-04**: 管理员可以编辑和删除客户信息

### Theme & UI

- [x] **THEM-01**: 用户可以切换深色/浅色主题
- [x] **THEM-02**: 主题选择在刷新后保持
- [x] **THEM-03**: 管理后台界面清晰易用

### Data Model

- [x] **DATA-01**: 作品可以包含多个媒体项（图片或视频）
- [x] **DATA-02**: 数据模型支持 Album → Work → MediaItem 三层结构
- [x] **DATA-03**: 管理员可以为作品添加/删除媒体项
- [x] **DATA-04**: API 提供媒体项管理接口
- [x] **DATA-05**: 前端支持媒体项管理和展示
- [x] **DATA-06**: 现有数据可以平滑迁移到新结构
- [x] **DATA-07**: 所有功能在新结构下正常工作

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Multi-Admin

- **MADM-01**: 支持多个管理员账号
- **MADM-02**: 管理员可以有不同的权限级别

### Advanced Features

- **ADVN-01**: 支持更多图片格式（RAW、TIFF等）
- **ADVN-02**: 视频自动转码和压缩
- **ADVN-03**: 自定义品牌主题（Logo、配色）
- **ADVN-04**: 开放 API 供第三方集成

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| 客户注册/登录系统 | 客户通过私密链接访问，无需账号体系 |
| 多工作室/多租户 | 单工作室使用，不需要租户隔离 |
| 社交功能（点赞、评论） | 公开区仅展示，互动限于私密链接场景 |
| 移动端 APP | 优先响应式 Web，暂不开发原生应用 |
| 在线支付 | 非电商平台，无需支付功能 |
| 实时协作编辑 | 单管理员操作，无需协作 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| WORK-01 | Phase 2 | Pending |
| WORK-02 | Phase 2 | Pending |
| WORK-03 | Phase 2 | Pending |
| WORK-04 | Phase 2 | Pending |
| WORK-05 | Phase 2 | Pending |
| WORK-06 | Phase 2 | Pending |
| WORK-07 | Phase 2 | Pending |
| WORK-08 | Phase 2 | Pending |
| WORK-09 | Phase 2 | Pending |
| WORK-10 | Phase 2 | Pending |
| WORK-11 | Phase 2 | Pending |
| ALBM-01 | Phase 2 | Pending |
| ALBM-02 | Phase 2 | Pending |
| ALBM-03 | Phase 2 | Pending |
| ALBM-04 | Phase 2 | Pending |
| ALBM-05 | Phase 2 | Pending |
| BATCH-01 | Phase 4 | Complete |
| BATCH-02 | Phase 4 | Complete |
| BATCH-03 | Phase 4 | Complete |
| BATCH-04 | Phase 4 | Complete |
| WATR-01 | Phase 2 | Pending |
| WATR-02 | Phase 2 | Pending |
| WATR-03 | Phase 2 | Pending |
| PUBL-01 | Phase 3 | Complete |
| PUBL-02 | Phase 3 | Complete |
| PUBL-03 | Phase 3 | Complete |
| PUBL-04 | Phase 3 | Complete |
| PUBL-05 | Phase 3 | Complete |
| PUBL-06 | Phase 3 | Complete |
| PUBL-07 | Phase 3 | Complete |
| PRIV-01 | Phase 3 | Complete |
| PRIV-02 | Phase 3 | Complete |
| PRIV-03 | Phase 3 | Complete |
| PRIV-04 | Phase 3 | Complete |
| PRIV-05 | Phase 4 | Complete |
| PRIV-06 | Phase 4 | Complete |
| STAT-01 | Phase 4 | Complete |
| STAT-02 | Phase 4 | Complete |
| STAT-03 | Phase 4 | Complete |
| STAT-04 | Phase 4 | Complete |
| CLNT-01 | Phase 4 | Complete |
| CLNT-02 | Phase 4 | Complete |
| CLNT-03 | Phase 4 | Complete |
| CLNT-04 | Phase 4 | Complete |
| THEM-01 | Phase 4 | Complete |
| THEM-02 | Phase 4 | Complete |
| THEM-03 | Phase 4 | Complete |
| DATA-01 | Phase 6 | Complete |
| DATA-02 | Phase 6 | Complete |
| DATA-03 | Phase 6 | Complete |
| DATA-04 | Phase 6 | Complete |
| DATA-05 | Phase 6 | Complete |
| DATA-06 | Phase 6 | Complete |
| DATA-07 | Phase 6 | Complete |

**Coverage:**
- v1 requirements: 55 total
- Mapped to phases: 55
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-25 after Phase 6 Plan 01*