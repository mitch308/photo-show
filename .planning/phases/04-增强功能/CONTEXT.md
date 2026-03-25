# Phase 4: 增强功能

**Goal:** 添加批量操作、统计、客户管理、主题切换等增强功能

**UI Phase:** Yes — 前端 UI 变更

## Requirements

### Batch Operations (BATCH)

- **BATCH-01**: 管理员可以一次选择多个作品
- **BATCH-02**: 管理员可以批量修改作品的公开状态
- **BATCH-03**: 管理员可以批量移动作品到相册
- **BATCH-04**: 管理员可以批量删除作品

### Private Sharing Extensions (PRIV)

- **PRIV-05**: 管理员可以查看私密链接的访问记录
- **PRIV-06**: 管理员可以设置私密链接的访问次数限制

### Statistics (STAT)

- **STAT-01**: 管理员可以看到作品的浏览次数
- **STAT-02**: 管理员可以看到作品的下载次数
- **STAT-03**: 管理员可以看到相册的浏览次数
- **STAT-04**: 浏览和下载次数在管理后台可见

### Client Management (CLNT)

- **CLNT-01**: 管理员可以添加和管理客户信息
- **CLNT-02**: 管理员可以为客户创建专属的私密链接
- **CLNT-03**: 管理员可以查看每个客户的访问历史
- **CLNT-04**: 管理员可以编辑和删除客户信息

### Theme & UI (THEM)

- **THEM-01**: 用户可以切换深色/浅色主题
- **THEM-02**: 主题选择在刷新后保持
- **THEM-03**: 管理后台界面清晰易用

## Success Criteria

1. 管理员可以一次上传多个作品并看到进度
2. 管理员可以批量移动和删除作品
3. 管理员可以看到作品的浏览和下载统计
4. 管理员可以管理客户信息
5. 管理员可以查看私密链接的访问记录
6. 用户可以切换深色/浅色主题
7. 主题选择在刷新后保持

## Key Decisions

| Decision | Options Considered | Chosen | Rationale |
|----------|-------------------|--------|-----------|
| 客户模型字段 | 基础 vs 扩展 | **扩展字段** | 公司名、地址、生日、备注等更实用 |
| 访问记录存储 | Redis vs MySQL vs 混合 | **MySQL** | 查询方便，适合预期访问量 |
| 批量操作 UI | Checkbox vs 原生多选 | **Checkbox + 批量栏** | 操作直观，用户熟悉 |
| 统计存储 | MySQL vs Redis | Redis 计数 + 定期同步 MySQL | 高性能写入 |
| 主题持久化 | Cookie vs localStorage | localStorage | 简单可靠 |
| 批量上传 | 同步 vs 异步 | 异步 + 进度推送 | 大批量不阻塞 |

## Technical Notes

- 批量上传使用 Promise.all 并发控制
- 统计使用 Redis INCR，定时任务同步到 MySQL
- 客户管理关联私密链接记录
- 主题使用 CSS 变量 + VueUse useDark

## Dependencies

- Phase 3 (公开展示与私密分享) — 需要私密链接功能
- Phase 2 (作品管理功能) — 需要作品管理功能

## Existing Codebase Context

### Models Available
- `Work` — 作品模型，已有 viewCount, downloadCount 字段
- `Album` — 相册模型
- `Tag` — 标签模型
- `Admin` — 管理员模型

### Services Available
- `workService` — 作品 CRUD
- `albumService` — 相册 CRUD
- `tagService` — 标签 CRUD
- `shareService` — 分享 token 管理
- `publicService` — 公开数据访问

### Routes Available
- `/api/works` — 作品管理 API
- `/api/albums` — 相册管理 API
- `/api/tags` — 标签管理 API
- `/api/share` — 私密分享 API
- `/api/public` — 公开访问 API
- `/api/admin/share` — 分享管理 API

## Questions for Planning

1. **客户模型设计** — Client 模型需要哪些字段？
2. **访问记录存储** — 访问记录是存在 Redis 还是 MySQL？
3. **批量操作 UI** — 是否使用 checkbox + 批量操作栏的形式？
4. **主题切换位置** — 主题切换按钮放在哪里？

---

*Context created: 2026-03-25*