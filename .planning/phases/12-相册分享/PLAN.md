# Phase 12: 相册分享 - 执行计划

> **Status:** ✅ COMPLETE
> **Executed:** 2026-03-26
> **Duration:** ~20 minutes

> **Goal**: 让摄影师可以为整个相册生成私密分享链接，客户通过链接查看相册中的所有作品并可下载原图。

## 设计决策

| ID | 决策 | 理由 |
|----|------|------|
| D-01 | 扩展现有 ShareTokenData 支持 albumId 和 albumName | 复用现有分享架构，便于管理端显示 |
| D-02 | 相册分享存储 albumId，访问时动态获取作品 | 客户始终看到最新内容 |
| D-03 | 新增 `/api/album-share/:token` 路由 | 便于区分相册分享，返回格式包含相册信息 |
| D-04 | 创建 AlbumShare.vue 页面 | 显示相册名称和描述，体验更好 |
| D-05 | 分享管理页面区分类型显示 | 管理员清楚区分作品分享和相册分享 |

## 实现计划

### 计划 12-01: 后端相册分享 API

**文件**: `12-01-backend-album-share.md`

1. 扩展 `ShareTokenData` 接口支持 `albumId` 和 `albumName`
2. 添加相册分享相关方法到 `shareService`
3. 创建公开相册分享路由 `/api/album-share/:token`
4. 扩展管理端分享 API 支持创建相册分享

### 计划 12-02: 前端相册分享功能

**文件**: `12-02-frontend-album-share.md`

1. 扩展前端 share API 支持相册分享
2. 创建相册分享页面 `AlbumShare.vue`
3. 在相册管理页面添加分享按钮
4. 更新分享管理页面支持相册分享

## 文件变更清单

### 后端新增
- 无（扩展现有文件）

### 后端修改
- `backend/src/services/shareService.ts` - 添加相册分享支持
- `backend/src/routes/share.ts` - 添加公开相册分享路由
- `backend/src/routes/admin/share.ts` - 扩展创建相册分享

### 前端新增
- `frontend/src/views/AlbumShare.vue` - 相册分享页面

### 前端修改
- `frontend/src/api/share.ts` - 添加相册分享 API
- `frontend/src/api/types.ts` - 添加相册分享类型
- `frontend/src/views/admin/Albums.vue` - 添加分享按钮
- `frontend/src/views/admin/Shares.vue` - 支持相册分享显示
- `frontend/src/router/index.ts` - 添加相册分享路由

## 数据结构变更

### ShareTokenData 扩展

```typescript
interface ShareTokenData {
  workIds?: string[];      // 作品分享（可选）
  albumId?: string;        // 相册分享（可选）
  albumName?: string;      // 相册名称（管理端显示）
  expiresAt: number;
  createdAt: number;
  createdBy?: string;
  clientId?: string;
  maxAccess?: number;
  accessCount?: number;
}
```

**约束**: `workIds` 和 `albumId` 互斥，只能设置其中一个。

### 相册分享数据返回格式

```typescript
// GET /api/album-share/:token 返回
{
  token: string;
  album: {
    id: string;
    name: string;
    description: string;
    coverPath: string;
  };
  works: Work[];
  expiresAt: number;
}
```

## 测试要点

1. 创建相册分享链接
2. 通过链接访问相册
3. 下载相册中的作品
4. 相册内容更新后刷新链接查看最新内容
5. 访问限制和过期控制
6. 前端路由和页面展示

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 相册作品数量多导致加载慢 | 分页加载或懒加载 |
| 相册被删除后分享链接失效 | 友好错误提示 |
| 作品被移出相册后链接仍可访问 | 实时查询相册作品 |