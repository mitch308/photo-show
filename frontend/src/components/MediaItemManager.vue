<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Rank } from '@element-plus/icons-vue';
import { useWorksStore } from '@/stores/works';
import type { Work, MediaItem } from '@/api/types';
import api from '@/api/index';

const props = defineProps<{
  work: Work;
}>();

const worksStore = useWorksStore();

const mediaItems = computed(() => props.work.mediaItems || []);
const uploading = ref(false);
const uploadProgress = ref(0);
const dragIndex = ref<number | null>(null);

// Get thumbnail URL for display
function getThumbnailUrl(item: MediaItem): string {
  if (item.thumbnailLarge) {
    return `/${item.thumbnailLarge}`;
  }
  return `/${item.filePath}`;
}

// Check if item is video
function isVideo(item: MediaItem): boolean {
  return item.fileType === 'video';
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Upload new media item
async function handleUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  uploading.value = true;
  uploadProgress.value = 0;

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      await worksStore.addMediaItem(props.work.id, formData);
      
      uploadProgress.value = Math.round(((i + 1) / files.length) * 100);
    }
    
    ElMessage.success(`成功添加 ${files.length} 个媒体项`);
  } catch (error: any) {
    ElMessage.error(error.message || '上传失败');
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
    target.value = '';
  }
}

// Delete media item
async function handleDelete(item: MediaItem) {
  try {
    await ElMessageBox.confirm(
      `确定要删除「${item.originalFilename}」吗？此操作不可恢复。`,
      '删除确认',
      { type: 'warning' }
    );
    
    await worksStore.deleteMediaItem(item.id);
    ElMessage.success('删除成功');
  } catch {
    // Cancelled
  }
}

// Drag and drop for reordering
function handleDragStart(index: number) {
  dragIndex.value = index;
}

function handleDragOver(event: DragEvent, index: number) {
  event.preventDefault();
  if (dragIndex.value === null || dragIndex.value === index) return;
}

function handleDrop(event: DragEvent, index: number) {
  event.preventDefault();
  if (dragIndex.value === null || dragIndex.value === index) return;

  const items = [...mediaItems.value];
  const draggedItem = items[dragIndex.value];
  items.splice(dragIndex.value, 1);
  items.splice(index, 0, draggedItem);

  // Update order
  const itemIds = items.map(item => item.id);
  worksStore.reorderMediaItems(props.work.id, itemIds);
  
  dragIndex.value = null;
}

function handleDragEnd() {
  dragIndex.value = null;
}
</script>

<template>
  <div class="media-item-manager">
    <div class="manager-header">
      <h4>媒体项管理</h4>
      <div class="upload-wrapper">
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          @change="handleUpload"
          class="file-input"
          :disabled="uploading"
        />
        <el-button type="primary" size="small" :loading="uploading">
          <el-icon><Plus /></el-icon>
          {{ uploading ? `上传中 ${uploadProgress}%` : '添加媒体项' }}
        </el-button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="mediaItems.length === 0" class="empty-state">
      <p>暂无媒体项，点击上方按钮添加</p>
    </div>

    <!-- Media items grid -->
    <div v-else class="media-grid">
      <div
        v-for="(item, index) in mediaItems"
        :key="item.id"
        class="media-item"
        :class="{ dragging: dragIndex === index }"
        draggable="true"
        @dragstart="handleDragStart(index)"
        @dragover="handleDragOver($event, index)"
        @drop="handleDrop($event, index)"
        @dragend="handleDragEnd"
      >
        <div class="item-thumbnail">
          <img :src="getThumbnailUrl(item)" :alt="item.originalFilename" />
          <div v-if="isVideo(item)" class="video-indicator">
            <span>视频</span>
          </div>
        </div>
        
        <div class="item-info">
          <span class="filename" :title="item.originalFilename">
            {{ item.originalFilename }}
          </span>
          <span class="filesize">{{ formatFileSize(item.fileSize) }}</span>
        </div>

        <div class="item-actions">
          <el-icon class="drag-handle" title="拖动排序"><Rank /></el-icon>
          <el-button
            link
            type="danger"
            @click="handleDelete(item)"
            title="删除"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.media-item-manager {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 16px;
  background: var(--el-bg-color);
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.manager-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.upload-wrapper {
  position: relative;
}

.file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.media-item {
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-bg-color-page);
  transition: all 0.2s;
}

.media-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.media-item.dragging {
  opacity: 0.5;
  border-color: var(--el-color-primary);
}

.item-thumbnail {
  position: relative;
  width: 100%;
  height: 100px;
  overflow: hidden;
  background: var(--el-fill-color);
}

.item-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}

.item-info {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.filename {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filesize {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.item-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.drag-handle {
  cursor: grab;
  color: var(--el-text-color-secondary);
}

.drag-handle:hover {
  color: var(--el-color-primary);
}
</style>