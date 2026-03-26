# Phase 10: 作品文件管理 - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Source:** ROADMAP.md Phase 10 definition

<domain>
## Phase Boundary

Phase 10 实现作品文件管理功能，让管理员可以：
1. **WORK-03: 添加文件** — 为已有作品添加新的图片或视频文件
2. **WORK-04: 删除文件** — 从作品中删除文件，最后一个文件需确认

**关键洞察：** 后端 API 已完整实现（`mediaItems` 路由），本阶段只需实现前端 UI。

</domain>

<decisions>
## Implementation Decisions

### WORK-03: 添加文件

#### D-01: 添加入口
- **决策:** 在编辑作品对话框中添加"添加文件"按钮
- **理由:**
  - 编辑对话框已有作品上下文
  - 复用现有 Upload 组件
  - 用户心智一致（编辑作品 = 管理作品内容）
- **实现:**
  - 在编辑模式下显示"添加文件"区域
  - 使用 Upload 组件上传文件
  - 上传成功后调用 `mediaItemsApi.addMediaItem()`

#### D-02: 文件上传流程
- **决策:** 复用现有 Upload 组件（Fast-MD5 预检查）
- **理由:**
  - 已实现去重逻辑
  - 统一上传体验
  - 减少重复代码

#### D-03: 添加后刷新
- **决策:** 添加文件后刷新作品列表
- **理由:** 确保文件数量和大小显示正确

### WORK-04: 删除文件

#### D-04: 删除入口
- **决策:** 在编辑对话框中显示文件列表，每个文件有删除按钮
- **理由:**
  - 可视化管理所有文件
  - 操作直观
  - 与添加功能在同一界面

#### D-05: 最后一个文件保护
- **决策:** 删除最后一个文件时阻止操作并提示
- **理由:**
  - 作品至少需要一个文件
  - 避免空作品状态
  - UX 更友好
- **实现:**
  ```typescript
  if (work.mediaItems.length === 1) {
    ElMessage.warning('作品至少需要保留一个文件，请先上传其他文件');
    return;
  }
  ```

#### D-06: 删除确认
- **决策:** 删除前弹出确认框
- **理由:** 删除操作不可逆，需二次确认

### Agent's Discretion

- 文件列表排序（按 position）
- 文件缩略图显示
- 删除按钮样式
- 是否支持拖拽排序（暂不实现，留待后续）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 后端 API（已实现）
- `backend/src/routes/mediaItems.ts:39` — `POST /works/:workId/media` 添加文件
- `backend/src/routes/mediaItems.ts:102` — `DELETE /media/:id` 删除文件
- `backend/src/routes/mediaItems.ts:66` — `GET /works/:workId/media` 获取文件列表
- `backend/src/services/mediaItemService.ts:35` — `createMediaItem()` 创建媒体项
- `backend/src/services/mediaItemService.ts:97` — `deleteMediaItem()` 删除媒体项

### 前端 API（已实现）
- `frontend/src/api/mediaItems.ts:18` — `addMediaItem()` 添加文件 API
- `frontend/src/api/mediaItems.ts:54` — `deleteMediaItem()` 删除文件 API
- `frontend/src/api/mediaItems.ts:33` — `getMediaItems()` 获取文件列表 API

### 前端组件（需修改）
- `frontend/src/views/admin/Works.vue` — 作品管理页面（需添加文件管理 UI）
- `frontend/src/components/Upload.vue` — 上传组件（复用）

### 类型定义
- `frontend/src/api/types.ts:37` — MediaItem 类型
- `frontend/src/api/types.ts:56` — Work 类型

</canonical_refs>

<specifics>
## Specific Ideas

### Works.vue 编辑对话框修改

```vue
<!-- 编辑模式下显示文件管理 -->
<div v-if="editingWork" class="files-section">
  <h4>文件列表</h4>
  
  <div class="files-list">
    <div v-for="item in editingWork.mediaItems" :key="item.id" class="file-item">
      <el-image :src="`/${item.thumbnailSmall}`" fit="cover" class="file-thumb" />
      <span class="file-name">{{ item.originalFilename }}</span>
      <el-button 
        link 
        type="danger" 
        @click="handleDeleteFile(item)"
        :disabled="editingWork.mediaItems.length <= 1"
      >
        删除
      </el-button>
    </div>
  </div>
  
  <div class="add-file-section">
    <el-button @click="showAddFile = true">添加文件</el-button>
  </div>
</div>

<!-- 添加文件区域 -->
<div v-if="showAddFile" class="add-file-dialog">
  <Upload @success="handleAddFile" />
  <el-button @click="showAddFile = false">取消</el-button>
</div>
```

### 添加文件处理

```typescript
async function handleAddFile(result: UploadResult) {
  if (!editingWork.value) return;
  
  try {
    await mediaItemsApi.addMediaItem(editingWork.value.id, {
      filePath: result.filePath,
      thumbnailSmall: result.thumbnailSmall,
      thumbnailLarge: result.thumbnailLarge,
      originalFilename: result.originalFilename,
      fileType: result.fileType,
      mimeType: result.mimeType,
      fileSize: result.fileSize,
      fileHash: result.fileHash,
    });
    
    ElMessage.success('文件添加成功');
    showAddFile.value = false;
    
    // 刷新作品列表
    await worksStore.fetchWorks();
    
    // 重新加载当前编辑的作品
    const updated = worksStore.works.find(w => w.id === editingWork.value?.id);
    if (updated) {
      editingWork.value = updated;
    }
  } catch (error: any) {
    ElMessage.error(error.message || '添加失败');
  }
}
```

### 删除文件处理

```typescript
async function handleDeleteFile(item: MediaItem) {
  if (!editingWork.value) return;
  
  // 检查是否是最后一个文件
  if (editingWork.value.mediaItems && editingWork.value.mediaItems.length <= 1) {
    ElMessage.warning('作品至少需要保留一个文件，请先上传其他文件');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除文件「${item.originalFilename}」吗？此操作不可恢复。`,
      '删除确认',
      { type: 'warning' }
    );
    
    await mediaItemsApi.deleteMediaItem(item.id);
    ElMessage.success('文件删除成功');
    
    // 刷新作品列表
    await worksStore.fetchWorks();
    
    // 重新加载当前编辑的作品
    const updated = worksStore.works.find(w => w.id === editingWork.value?.id);
    if (updated) {
      editingWork.value = updated;
    }
  } catch {
    // 用户取消
  }
}
```

</specifics>

<deferred>
## Deferred Ideas

- **文件拖拽排序** — 允许管理员拖拽调整文件顺序
- **批量删除文件** — 一次选择多个文件删除
- **文件预览** — 在编辑对话框中预览大图/视频
- **文件信息编辑** — 编辑文件名、描述等
- **视频封面选择** — 为视频选择封面图

</deferred>

---

*Phase: 10-作品文件管理*
*Context gathered: 2026-03-26*