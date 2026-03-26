# Phase 9: 作品信息增强 - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Source:** ROADMAP.md Phase 9 definition

<domain>
## Phase Boundary

Phase 9 增强作品信息展示，实现：
1. **WORK-01: 文件信息展示** — 作品列表显示每个作品的总文件大小和文件数量
2. **WORK-02: 前台跳转入口** — 后台管理页面有跳转前台画廊的入口链接

**关键洞察：** 数据已在后端获取（mediaItems 关联），前端只需计算聚合值。WORK-02 是纯前端 UI 增强。

</domain>

<decisions>
## Implementation Decisions

### WORK-01: 文件信息展示

#### D-01: 数据计算位置
- **决策:** 前端计算（computed property）
- **理由:**
  - 后端已返回 `mediaItems[]` 数组
  - 避免修改后端 API 和数据模型
  - 减少后端计算负担
- **实现:**
  ```typescript
  // 前端计算
  const totalFileSize = work.mediaItems?.reduce((sum, item) => sum + item.fileSize, 0) || work.fileSize
  const fileCount = work.mediaItems?.length || 1
  ```

#### D-02: 兼容旧数据
- **决策:** 兼容没有 mediaItems 的旧作品
- **理由:** 部分作品可能只有 deprecated 字段（filePath, fileSize）
- **实现:** 优先使用 mediaItems，fallback 到旧字段

#### D-03: 显示位置
- **决策:** 在作品列表表格中新增两列
- **理由:** 符合现有 UI 结构，信息一目了然
- **列顺序:** 缩略图 | 标题 | 文件数 | 大小 | 状态 | 浏览 | 下载 | 相册 | 操作

### WORK-02: 前台跳转入口

#### D-04: 入口位置
- **决策:** 在 Dashboard.vue 侧边栏底部，与主题切换按钮并列
- **理由:**
  - 侧边栏是导航区域，符合用户心智
  - 与现有按钮风格一致
  - 始终可见，方便快速访问

#### D-05: 链接目标
- **决策:** 跳转到 `/`（公开画廊首页）
- **理由:**
  - 公开画廊展示所有公开作品
  - 管理员可能需要预览前台效果
  - 新标签页打开，不影响当前管理操作

#### D-06: UI 样式
- **决策:** 使用 `<a>` 标签 + `target="_blank"`，样式与现有按钮一致
- **理由:**
  - 外部链接应新窗口打开
  - 保持侧边栏视觉一致性

### Agent's Discretion

- 文件大小格式化函数（已存在 `formatFileSize`）
- 列宽度调整
- 图标选择（可选）
- 是否显示每个文件的单独大小（暂不显示）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 后端相关
- `backend/src/services/workService.ts:114` — `getWorks()` 已 fetch mediaItems
- `backend/src/models/Work.ts` — Work 模型，含 mediaItems 关系
- `backend/src/models/MediaItem.ts` — MediaItem 模型，含 fileSize 字段

### 前端相关
- `frontend/src/views/admin/Works.vue` — 作品列表页面（需修改）
- `frontend/src/views/admin/Dashboard.vue` — 管理后台布局（需修改）
- `frontend/src/api/types.ts:56` — Work 类型定义

### 现有工具函数
- `frontend/src/views/admin/Works.vue:124` — `formatFileSize()` 函数

</canonical_refs>

<specifics>
## Specific Ideas

### Works.vue 表格修改

```vue
<!-- 新增：文件数量列 -->
<el-table-column label="文件" width="80" align="center">
  <template #default="{ row }">
    <span>{{ row.mediaItems?.length || 1 }}</span>
  </template>
</el-table-column>

<!-- 修改：文件大小列（聚合） -->
<el-table-column label="大小" width="100">
  <template #default="{ row }">
    {{ formatFileSize(getTotalFileSize(row)) }}
  </template>
</el-table-column>
```

```typescript
// 新增：计算总大小
function getTotalFileSize(work: Work): number {
  if (work.mediaItems && work.mediaItems.length > 0) {
    return work.mediaItems.reduce((sum, item) => sum + item.fileSize, 0);
  }
  return work.fileSize || 0;
}
```

### Dashboard.vue 侧边栏修改

```vue
<div class="sidebar-footer">
  <a href="/" target="_blank" class="gallery-link" title="在新窗口打开前台画廊">
    🖼️ 前台
  </a>
  <button class="theme-toggle" @click="handleThemeToggle" ...>
    ...
  </button>
  <button class="logout-btn" @click="handleLogout">退出登录</button>
</div>
```

```css
.gallery-link {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--sidebar-hover-bg);
  color: var(--sidebar-text);
  border-radius: 4px;
  text-decoration: none;
  transition: all 0.2s;
}

.gallery-link:hover {
  background: var(--sidebar-hover-bg);
  color: var(--sidebar-text-active);
}
```

</specifics>

<deferred>
## Deferred Ideas

- **后端聚合字段** — 可考虑在 Work 模型添加 `totalFileSize` 和 `fileCount` 字段（需 migration）
- **文件类型统计** — 显示"3 图 2 视频"格式
- **点击跳转到作品前台页** — 作品列表项可点击跳转到前台作品详情
- **批量查看前台** — 批量操作中添加"在新窗口预览"功能

</deferred>

---

*Phase: 09-作品信息增强*
*Context gathered: 2026-03-26*